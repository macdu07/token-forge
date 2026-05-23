export type Interpolation = 'linear' | 'ease-in' | 'ease-out' | 'perceptual';
export type OutputFormat = 'oklch' | 'hsl' | 'hex';

export type ColorOptions = {
  interpolation: Interpolation;
  outputFormat: OutputFormat;
  chromaFactor: number; // 0-1, how much chroma decreases toward extremes
  hueShift: number;     // degrees of hue shift across the scale
};

export type ColorStep = {
  id: string;
  type: 'light' | 'dark' | 'transparent';
  index: number;
  variable: string;
  value: string;
  mode: 'light' | 'dark';
};

export type PaletteColor = {
  id: string;
  name: string;
  variable: string;
  light: string;
  dark?: string;
  darkModeEnabled: boolean;
  options: ColorOptions;
  shades: {
    light: ColorStep[];
    dark: ColorStep[];
    transparent: ColorStep[];
  };
  darkModeShades?: {
    light: ColorStep[];
    dark: ColorStep[];
    transparent: ColorStep[];
  };
};

export type CustomVariable = {
  id: string;
  name: string;      // e.g. "radius-s"
  value: string;     // e.g. "8px" or "clamp(...)"
  category: 'radius' | 'space' | 'other';
};

export type Palette = {
  id: string;
  name: string;
  colors: PaletteColor[];
  variables?: CustomVariable[];
};

export const DEFAULT_COLOR_OPTIONS: ColorOptions = {
  interpolation: 'perceptual',
  outputFormat: 'oklch',
  chromaFactor: 0.15,
  hueShift: 0,
};
