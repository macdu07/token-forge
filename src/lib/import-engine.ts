import type { PaletteColor } from '../types';
import { DEFAULT_COLOR_OPTIONS } from '../types';

// Helper to sanitize variable names to valid CSS identifiers
function sanitizeVar(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/^--/, '') // remove leading dashes if present
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');
}

export type ParsedColor = Omit<PaletteColor, 'shades' | 'darkModeShades'>;

export interface ImportResult {
  name: string;
  colors: ParsedColor[];
}

/**
 * Parses a JSON string exported from Bricks Builder.
 * In Bricks JSON:
 * - Parent colors have no `parent` property, and define `raw` (e.g. `var(--primary)`), `light`, and optional `dark`.
 * - Child colors (shades) have a `parent` reference pointing to the parent's `id`.
 */
export function parseBricksJSON(jsonStr: string): ImportResult | null {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') return null;
    
    const paletteName = data.name || 'Bricks Imported';
    const colorsList = data.colors;
    if (!Array.isArray(colorsList)) return null;

    // Filter for parent color nodes (no parent property, has raw variable property)
    const parentNodes = colorsList.filter(c => c && typeof c === 'object' && !c.parent && c.raw);
    if (parentNodes.length === 0) return null;

    const colors: ParsedColor[] = parentNodes.map((node: any) => {
      let variable = '';
      const rawMatch = node.raw.match(/var\(--([^)]+)\)/);
      if (rawMatch) {
        variable = rawMatch[1];
      } else {
        variable = node.id || 'color';
      }
      variable = sanitizeVar(variable);

      const name = node.name || variable.charAt(0).toUpperCase() + variable.slice(1);
      const light = node.light || '#3b82f6';
      const darkModeEnabled = !!node.darkModeEnabled;
      const dark = node.dark || undefined;

      return {
        id: variable,
        name,
        variable,
        light,
        dark,
        darkModeEnabled,
        options: DEFAULT_COLOR_OPTIONS,
      };
    });

    return { name: paletteName, colors };
  } catch (e) {
    console.error('[TokenForge] Error parsing Bricks JSON:', e);
    return null;
  }
}

/**
 * Parses a CSS stylesheet string to extract CSS custom properties.
 * Identifies root variables (for light mode) and variables defined in dark selectors
 * (like .dark, [data-theme="dark"], .bricks-is-frontend.dark) to match their dark bases.
 * Automatically ignores generated shades like -l-*, -d-*, -t-*.
 */
export function parseCSS(cssStr: string): ImportResult | null {
  try {
    // Strip CSS comments to avoid matching commented-out variables
    const cleanCSS = cssStr.replace(/\/\*[\s\S]*?\*\//g, '');

    const colorMap: Record<string, { variable: string; light?: string; dark?: string }> = {};

    // Match property declarations: --variable-name: value;
    const propRegex = /--([a-zA-Z0-9_-]+)\s*:\s*([^;}\n]+)/g;

    // 1. Scan the :root block for light mode colors
    const rootBlockMatch = cleanCSS.match(/:root\s*\{([^}]+)\}/i);
    if (rootBlockMatch) {
      const rootContent = rootBlockMatch[1];
      let match;
      while ((match = propRegex.exec(rootContent)) !== null) {
        const varName = match[1].trim();
        const varValue = match[2].trim();

        // Skip generated shades
        if (/-l-\d+$/.test(varName) || /-d-\d+$/.test(varName) || /-t-\d+$/.test(varName)) {
          continue;
        }

        colorMap[varName] = {
          variable: varName,
          light: varValue,
        };
      }
    }

    // 2. Scan other sections (including general declarations if not inside a :root block)
    // if no :root block was found, search the whole file for custom properties.
    if (!rootBlockMatch) {
      let match;
      propRegex.lastIndex = 0;
      while ((match = propRegex.exec(cleanCSS)) !== null) {
        const varName = match[1].trim();
        const varValue = match[2].trim();

        if (/-l-\d+$/.test(varName) || /-d-\d+$/.test(varName) || /-t-\d+$/.test(varName)) {
          continue;
        }

        colorMap[varName] = {
          variable: varName,
          light: varValue,
        };
      }
    }

    // 3. Scan for dark mode selectors to match dark variants
    // Examples: .dark { ... }, [data-theme="dark"] { ... }, etc.
    const darkBlockRegex = /(?:\.dark|\[data-theme=['"]?dark['"]?\]|\.bricks-is-frontend\.dark)\s*\{([^}]+)\}/gi;
    let darkMatch;
    while ((darkMatch = darkBlockRegex.exec(cleanCSS)) !== null) {
      const darkContent = darkMatch[1];
      let propMatch;
      const innerPropRegex = /--([a-zA-Z0-9_-]+)\s*:\s*([^;}\n]+)/g;
      while ((propMatch = innerPropRegex.exec(darkContent)) !== null) {
        const varName = propMatch[1].trim();
        const varValue = propMatch[2].trim();

        if (/-l-\d+$/.test(varName) || /-d-\d+$/.test(varName) || /-t-\d+$/.test(varName)) {
          continue;
        }

        if (colorMap[varName]) {
          colorMap[varName].dark = varValue;
        } else {
          colorMap[varName] = {
            variable: varName,
            dark: varValue,
          };
        }
      }
    }

    const colors: ParsedColor[] = Object.values(colorMap)
      .filter(c => c.light) // Only import colors that have at least a light variant
      .map(c => {
        const variable = sanitizeVar(c.variable);
        const name = variable.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return {
          id: variable,
          name,
          variable,
          light: c.light!,
          dark: c.dark,
          darkModeEnabled: !!c.dark,
          options: DEFAULT_COLOR_OPTIONS,
        };
      });

    if (colors.length === 0) return null;

    return { name: 'CSS Imported Palette', colors };
  } catch (e) {
    console.error('[TokenForge] Error parsing CSS variables:', e);
    return null;
  }
}

/**
 * Parses a design tokens JSON file (W3C standard or simplified tokens).
 */
export function parseTokenForgeJSON(jsonStr: string): ImportResult | null {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') return null;

    const colors: ParsedColor[] = [];

    for (const [key, val] of Object.entries(data)) {
      if (val && typeof val === 'object') {
        const obj = val as Record<string, any>;
        
        // 1. W3C Design Tokens Community Group format check (e.g. { "primary": { "base": { "$value": "..." } } })
        if (obj.base && typeof obj.base === 'object' && '$value' in obj.base) {
          const light = obj.base.$value;
          const dark = obj['dark-base']?.$value;
          const variable = sanitizeVar(key);
          const name = variable.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          
          colors.push({
            id: variable,
            name,
            variable,
            light,
            dark,
            darkModeEnabled: !!dark,
            options: DEFAULT_COLOR_OPTIONS,
          });
        }
        // 2. Direct name mapping with properties (e.g. { "primary": { "$value": "...", "$type": "color" } })
        else if ('$value' in obj && obj.$type === 'color') {
          const light = obj.$value;
          const variable = sanitizeVar(key);
          const name = variable.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          
          colors.push({
            id: variable,
            name,
            variable,
            light,
            dark: undefined,
            darkModeEnabled: false,
            options: DEFAULT_COLOR_OPTIONS,
          });
        }
      }
    }

    if (colors.length === 0) return null;
    return { name: 'Tokens Imported Palette', colors };
  } catch (e) {
    console.error('[TokenForge] Error parsing Design Tokens JSON:', e);
    return null;
  }
}
