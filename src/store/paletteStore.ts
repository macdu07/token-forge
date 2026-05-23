import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Palette, PaletteColor, ColorOptions } from '../types';
import { DEFAULT_COLOR_OPTIONS } from '../types';
import { generateShades, generateTransparentShades, generateDarkVariant, formatColorString } from '../lib/color-engine';

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildShades(
  color: string,
  varName: string,
  mode: 'light' | 'dark',
  opts: ColorOptions
) {
  // Defensive: fallback to defaults if opts is missing (stale localStorage)
  const safeOpts = opts ?? DEFAULT_COLOR_OPTIONS;
  return {
    light:       generateShades(color, 'light',       varName, mode, safeOpts),
    dark:        generateShades(color, 'dark',        varName, mode, safeOpts),
    transparent: generateTransparentShades(color,     varName, mode, safeOpts),
  };
}

/** Recompute all shades from the current color values. Safe even with stale data. */
function recompute(color: PaletteColor): PaletteColor {
  const opts = color.options ?? DEFAULT_COLOR_OPTIONS;
  const shades = buildShades(color.light, color.variable, 'light', opts);
  const darkModeShades =
    color.darkModeEnabled && color.dark
      ? buildShades(color.dark, color.variable, 'dark', opts)
      : undefined;
  return { ...color, options: opts, shades, darkModeShades };
}

// ─── Default palette data ────────────────────────────────────────────────────

const SEMANTIC_COLORS = [
  { name: 'Primary',   variable: 'primary',   light: 'oklch(0.45 0.22 264)' },
  { name: 'Secondary', variable: 'secondary', light: 'oklch(0.45 0.15 300)' },
  { name: 'Neutral',   variable: 'neutral',   light: 'oklch(0.40 0.01 250)' },
  { name: 'Success',   variable: 'success',   light: 'oklch(0.52 0.17 145)' },
  { name: 'Warning',   variable: 'warning',   light: 'oklch(0.65 0.20 75)'  },
  { name: 'Error',     variable: 'error',     light: 'oklch(0.52 0.24 25)'  },
  { name: 'Info',      variable: 'info',      light: 'oklch(0.55 0.18 220)' },
];

function makeInitialColor(s: typeof SEMANTIC_COLORS[0]): PaletteColor {
  return recompute({
    id: s.variable,
    name: s.name,
    variable: s.variable,
    light: s.light,
    dark: undefined,         // no dark by default — generated on demand
    darkModeEnabled: false,  // OFF by default
    options: DEFAULT_COLOR_OPTIONS,
    shades: { light: [], dark: [], transparent: [] },
  });
}

const INITIAL_PALETTE: Palette = {
  id: 'default-palette',
  name: 'My Palette',
  colors: SEMANTIC_COLORS.map(makeInitialColor),
};

// ─── Store ───────────────────────────────────────────────────────────────────

interface PaletteState {
  palette: Palette;
  renamePalette: (name: string) => void;
  updateColor: (id: string, updates: Partial<PaletteColor>) => void;
  updateColorOptions: (id: string, options: Partial<ColorOptions>) => void;
  updateAllColorsOptions: (options: Partial<ColorOptions>) => void;
  addColor: (color: Omit<PaletteColor, 'shades' | 'darkModeShades'>) => void;
  removeColor: (id: string) => void;
  loadPreset: (colors: typeof SEMANTIC_COLORS) => void;
  duplicateColor: (id: string) => void;
  importPalette: (name: string, colors: Omit<PaletteColor, 'shades' | 'darkModeShades'>[]) => void;
  reorderColors: (startIndex: number, endIndex: number) => void;
}

export const usePaletteStore = create<PaletteState>()(
  persist(
    (set) => ({
      palette: INITIAL_PALETTE,

      renamePalette: (name) =>
        set((s) => ({ palette: { ...s.palette, name } })),

      reorderColors: (startIndex, endIndex) =>
        set((s) => {
          const colors = [...s.palette.colors];
          const [removed] = colors.splice(startIndex, 1);
          colors.splice(endIndex, 0, removed);
          return {
            palette: {
              ...s.palette,
              colors,
            },
          };
        }),

      updateColor: (id, updates) =>
        set((s) => ({
          palette: {
            ...s.palette,
            colors: s.palette.colors.map((c) => {
              if (c.id !== id) return c;
              const merged: PaletteColor = {
                ...c,
                ...updates,
                options: updates.options
                  ? { ...(c.options ?? DEFAULT_COLOR_OPTIONS), ...updates.options }
                  : (c.options ?? DEFAULT_COLOR_OPTIONS),
              };
              // When enabling dark mode → always generate dark from current light
              if (updates.darkModeEnabled === true) {
                merged.dark = generateDarkVariant(merged.light);
              }
              // When light changes with dark mode active → regenerate dark to stay in sync
              if (updates.light !== undefined && merged.darkModeEnabled && updates.darkModeEnabled !== false) {
                merged.dark = generateDarkVariant(merged.light);
              }
              return recompute(merged);
            }),
          },
        })),

      updateColorOptions: (id, options) =>
        set((s) => ({
          palette: {
            ...s.palette,
            colors: s.palette.colors.map((c) => {
              if (c.id !== id) return c;
              const nextLight = options.outputFormat ? formatColorString(c.light, options.outputFormat) : c.light;
              const nextDark = c.dark && options.outputFormat ? formatColorString(c.dark, options.outputFormat) : c.dark;
              return recompute({
                ...c,
                light: nextLight,
                dark: nextDark,
                options: { ...(c.options ?? DEFAULT_COLOR_OPTIONS), ...options },
              });
            }),
          },
        })),

      updateAllColorsOptions: (options) =>
        set((s) => ({
          palette: {
            ...s.palette,
            colors: s.palette.colors.map((c) => {
              const nextLight = options.outputFormat ? formatColorString(c.light, options.outputFormat) : c.light;
              const nextDark = c.dark && options.outputFormat ? formatColorString(c.dark, options.outputFormat) : c.dark;
              return recompute({
                ...c,
                light: nextLight,
                dark: nextDark,
                options: { ...(c.options ?? DEFAULT_COLOR_OPTIONS), ...options },
              });
            }),
          },
        })),

      addColor: (colorData) =>
        set((s) => ({
          palette: {
            ...s.palette,
            colors: [...s.palette.colors, recompute(colorData as PaletteColor)],
          },
        })),

      removeColor: (id) =>
        set((s) => ({
          palette: {
            ...s.palette,
            colors: s.palette.colors.filter((c) => c.id !== id),
          },
        })),

      loadPreset: (colors) =>
        set((s) => ({
          palette: {
            ...s.palette,
            colors: colors.map(makeInitialColor),
          },
        })),

      duplicateColor: (id) =>
        set((s) => {
          const colorToDup = s.palette.colors.find((c) => c.id === id);
          if (!colorToDup) return {};

          const suffix = '-copy';
          let baseVar = colorToDup.variable;
          if (baseVar.endsWith('-copy')) {
            baseVar = baseVar.replace(/-copy$/, '');
          }
          let newVar = `${baseVar}${suffix}`;

          let counter = 1;
          while (s.palette.colors.some((c) => c.variable === newVar)) {
            newVar = `${baseVar}${suffix}-${counter}`;
            counter++;
          }

          const newColor: PaletteColor = recompute({
            ...colorToDup,
            id: newVar,
            variable: newVar,
            name: `${colorToDup.name} Copy` + (counter > 1 ? ` ${counter - 1}` : ''),
            shades: { light: [], dark: [], transparent: [] },
            darkModeShades: undefined,
          });

          return {
            palette: {
              ...s.palette,
              colors: [...s.palette.colors, newColor],
            },
          };
        }),

      importPalette: (name, colors) =>
        set((s) => ({
          palette: {
            ...s.palette,
            name,
            colors: colors.map((c) => recompute(c as PaletteColor)),
          },
        })),
    }),
    {
      name: 'tokenforge-palette',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // Migrate stale persisted data — rebuild all shades and add missing options
      migrate: (persistedState: unknown, fromVersion) => {
        console.log(`[TokenForge] Migrating palette store v${fromVersion} → v2`);
        const state = (persistedState as any) ?? {};
        const palette: Palette = state.palette ?? INITIAL_PALETTE;
        return {
          ...state,
          palette: {
            ...palette,
            colors: palette.colors.map((c: PaletteColor) =>
              recompute({ ...c, options: c.options ?? DEFAULT_COLOR_OPTIONS })
            ),
          },
        };
      },
    }
  )
);

export { SEMANTIC_COLORS };
