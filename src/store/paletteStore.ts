import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Palette, PaletteColor, ColorOptions, CustomVariable } from '../types';
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

export const DEFAULT_VARIABLES: CustomVariable[] = [
  { id: 'var-radius-xs', name: 'radius-xs', value: '4px', category: 'radius' },
  { id: 'var-radius-s', name: 'radius-s', value: '8px', category: 'radius' },
  { id: 'var-radius-m', name: 'radius-m', value: '12px', category: 'radius' },
  { id: 'var-radius-l', name: 'radius-l', value: '16px', category: 'radius' },
  { id: 'var-radius-xl', name: 'radius-xl', value: '24px', category: 'radius' },
  { id: 'var-radius-full', name: 'radius-full', value: '9999px', category: 'radius' },
  
  { id: 'var-space-xs', name: 'space-xs', value: 'clamp(0.75rem, calc(0.5rem + 1vw), 1.25rem)', category: 'space' },
  { id: 'var-space-s', name: 'space-s', value: 'clamp(1rem, calc(0.75rem + 1.5vw), 1.75rem)', category: 'space' },
  { id: 'var-space-m', name: 'space-m', value: 'clamp(1.5rem, calc(1rem + 2vw), 2.5rem)', category: 'space' },
  { id: 'var-space-l', name: 'space-l', value: 'clamp(2rem, calc(1.5rem + 3vw), 3.5rem)', category: 'space' },
];

const INITIAL_PALETTE: Palette = {
  id: 'default-palette',
  name: 'My Palette',
  colors: SEMANTIC_COLORS.map(makeInitialColor),
  variables: DEFAULT_VARIABLES,
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
  addVariable: (name: string, value: string, category: 'radius' | 'space' | 'other') => void;
  updateVariable: (id: string, updates: Partial<CustomVariable>) => void;
  removeVariable: (id: string) => void;
  duplicateVariable: (id: string) => void;
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

      addVariable: (name, value, category) =>
        set((s) => {
          const variables = s.palette.variables ?? [];
          const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-');
          const id = `var-${cleanName}-${Date.now()}`;
          const newVar: CustomVariable = {
            id,
            name: cleanName,
            value: value.trim(),
            category,
          };
          return {
            palette: {
              ...s.palette,
              variables: [...variables, newVar],
            },
          };
        }),

      updateVariable: (id, updates) =>
        set((s) => {
          const variables = s.palette.variables ?? [];
          const nextVariables = variables.map((v) => {
            if (v.id !== id) return v;
            const merged = { ...v, ...updates };
            if (updates.name !== undefined) {
              merged.name = updates.name.trim().toLowerCase().replace(/\s+/g, '-');
            }
            if (updates.value !== undefined) {
              merged.value = updates.value.trim();
            }
            return merged;
          });
          return {
            palette: {
              ...s.palette,
              variables: nextVariables,
            },
          };
        }),

      removeVariable: (id) =>
        set((s) => {
          const variables = s.palette.variables ?? [];
          return {
            palette: {
              ...s.palette,
              variables: variables.filter((v) => v.id !== id),
            },
          };
        }),

      duplicateVariable: (id) =>
        set((s) => {
          const variables = s.palette.variables ?? [];
          const varToDup = variables.find((v) => v.id === id);
          if (!varToDup) return {};

          const suffix = '-copy';
          let baseName = varToDup.name;
          if (baseName.endsWith('-copy')) {
            baseName = baseName.replace(/-copy$/, '');
          }
          let newName = `${baseName}${suffix}`;
          let counter = 1;
          while (variables.some((v) => v.name === newName)) {
            newName = `${baseName}${suffix}-${counter}`;
            counter++;
          }

          const newVar: CustomVariable = {
            id: `var-${newName}-${Date.now()}`,
            name: newName,
            value: varToDup.value,
            category: varToDup.category,
          };

          return {
            palette: {
              ...s.palette,
              variables: [...variables, newVar],
            },
          };
        }),
    }),
    {
      name: 'tokenforge-palette',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      // Migrate stale persisted data — rebuild all shades and add missing options
      migrate: (persistedState: unknown, fromVersion) => {
        console.log(`[TokenForge] Migrating palette store v${fromVersion} → v3`);
        const state = (persistedState as any) ?? {};
        const palette = state.palette ?? INITIAL_PALETTE;
        return {
          ...state,
          palette: {
            ...palette,
            colors: (palette.colors ?? []).map((c: PaletteColor) =>
              recompute({ ...c, options: c.options ?? DEFAULT_COLOR_OPTIONS })
            ),
            variables: palette.variables ?? DEFAULT_VARIABLES,
          },
        };
      },
    }
  )
);

export { SEMANTIC_COLORS };
