import { oklch, parse, formatCss, formatHex, hsl } from 'culori';
import type { ColorOptions, ColorStep } from '../types';

/**
 * Given a light-mode base color, generate an appropriate dark-mode variant.
 * Strategy: convert to OKLCH, raise lightness to ~0.75-0.82, reduce chroma slightly.
 * Keeps hue intact so the color family feels consistent.
 */
export function generateDarkVariant(lightColorStr: string): string {
  const parsed = parse(lightColorStr);
  if (!parsed) return lightColorStr;
  const base = oklch(parsed);
  if (!base) return lightColorStr;

  const l = base.l ?? 0.5;
  const c = base.c ?? 0;
  const h = base.h ?? 0;

  let targetL: number;

  // If it's a neutral or near-neutral (low saturation)
  if (c < 0.03) {
    if (l > 0.85) {
      // White/off-white becomes very dark gray/black
      targetL = 0.15;
    } else if (l < 0.25) {
      // Black/dark gray becomes white/off-white
      targetL = 0.95;
    } else {
      // Intermediate gray values are inverted
      targetL = 1 - l;
    }
  } else {
    // For chromatic accent colors:
    if (l > 0.90) {
      // Very light pastel backgrounds become dark backgrounds
      targetL = 0.20;
    } else if (l < 0.20) {
      // Very dark accents become bright accents
      targetL = 0.75;
    } else {
      // Standard accent colors: target a bright but not blown-out value
      targetL = Math.min(0.82, Math.max(0.65, 1 - l + 0.15));
    }
  }

  const darkColor = {
    mode: 'oklch' as const,
    l: targetL,
    c: Math.max(0, c * 0.85), // slightly less saturated
    h: h,
  };
  return formatCss(darkColor);
}

export function toHex(colorStr: string): string {
  try {
    const parsed = parse(colorStr);
    if (!parsed) return '#000000';
    return formatHex(parsed) ?? '#000000';
  } catch (e) {
    return '#000000';
  }
}

export function formatColorString(colorStr: string, format: 'hex' | 'hsl' | 'oklch'): string {
  try {
    const parsed = parse(colorStr);
    if (!parsed) return colorStr;
    
    if (format === 'hex') {
      return formatHex(parsed) ?? colorStr;
    }
    if (format === 'hsl') {
      const h = hsl(parsed);
      return h ? formatCss(h) : formatCss(parsed);
    }
    const o = oklch(parsed);
    return o ? formatCss(o) : formatCss(parsed);
  } catch (e) {
    return colorStr;
  }
}

// Easing functions for interpolation
function applyEasing(t: number, mode: string): number {
  switch (mode) {
    case 'ease-in':  return t * t;
    case 'ease-out': return 1 - (1 - t) * (1 - t);
    case 'perceptual': {
      // Smooth S-curve that feels more natural for color scales
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    default: return t; // linear
  }
}

function formatValue(color: any, format: string): string {
  if (format === 'hex') return formatHex(color) ?? formatCss(color);
  if (format === 'hsl') {
    const h = hsl(color);
    if (!h) return formatCss(color);
    return formatCss(h);
  }
  return formatCss(color);
}

export function generateShades(
  baseColorStr: string,
  type: 'light' | 'dark',
  variableName: string,
  mode: 'light' | 'dark',
  options: ColorOptions
): ColorStep[] {
  const parsed = parse(baseColorStr);
  if (!parsed) return [];

  const base = oklch(parsed);
  if (!base) return [];

  const steps: ColorStep[] = [];
  const suffix = type === 'light' ? 'l' : 'd';

  for (let i = 1; i <= 10; i++) {
    // t goes 0→1 for light (lightest=1, darkest=10 for 'dark' type)
    const t = (i - 1) / 9;
    const eased = applyEasing(t, options.interpolation);

    let l: number;
    if (type === 'light') {
      // step 1 = very light, step 10 = base
      l = 0.98 - (0.98 - (base.l ?? 0.5)) * eased;
    } else {
      // step 1 = base, step 10 = very dark
      l = (base.l ?? 0.5) - ((base.l ?? 0.5) - 0.08) * eased;
    }

    // Chroma adjustment: reduce chroma at extremes for cleaner shades
    const distFromBase = Math.abs(eased - (type === 'light' ? 1 : 0));
    const chromaScale = 1 - options.chromaFactor * distFromBase;
    const c = Math.max(0, (base.c ?? 0) * chromaScale);

    // Optional hue shift across scale
    const h = ((base.h ?? 0) + options.hueShift * eased) % 360;

    const shadeColor = { mode: 'oklch' as const, l, c, h };

    steps.push({
      id: `${variableName}-${mode}-${type}-${i}`,
      type,
      index: i - 1,
      variable: `var(--${variableName}-${suffix}-${i})`,
      value: formatValue(shadeColor, options.outputFormat),
      mode,
    });
  }

  return steps;
}

export function generateTransparentShades(
  baseColorStr: string,
  variableName: string,
  mode: 'light' | 'dark',
  options: ColorOptions
): ColorStep[] {
  // Bricks-compatible alpha steps
  const alphas = [0.09, 0.18, 0.27, 0.36, 0.45, 0.55, 0.64, 0.73, 0.82, 0.91];

  return alphas.map((alpha, idx) => {
    const parsed = parse(baseColorStr);
    if (!parsed) return null;
    parsed.alpha = alpha;
    return {
      id: `${variableName}-${mode}-transparent-${idx + 1}`,
      type: 'transparent' as const,
      index: idx,
      variable: `var(--${variableName}-t-${idx + 1})`,
      value: formatValue(parsed, options.outputFormat),
      mode,
    };
  }).filter(Boolean) as ColorStep[];
}

// Compute relative luminance for WCAG contrast
function relativeLuminance(colorStr: string): number {
  const parsed = parse(colorStr);
  if (!parsed) return 0;
  const h = hsl(parsed);
  if (!h) return 0;
  // Convert to sRGB via culori's formatHex
  const hex = formatHex(parsed) ?? '#000000';
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(color1: string, color2: string): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function wcagLevel(ratio: number): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}
