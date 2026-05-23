import type { Palette } from '../types';

export function generateTailwindConfig(palette: Palette): string {
  let colors = '  colors: {\n';

  palette.colors.forEach((color) => {
    colors += `    '${color.variable}': {\n`;
    colors += `      DEFAULT: '${color.light}',\n`;
    color.shades.light.forEach((s) => {
      colors += `      'l${s.index + 1}': '${s.value}',\n`;
    });
    color.shades.dark.forEach((s) => {
      colors += `      'd${s.index + 1}': '${s.value}',\n`;
    });
    color.shades.transparent.forEach((s) => {
      colors += `      't${s.index + 1}': '${s.value}',\n`;
    });
    colors += `    },\n`;
  });

  colors += '  },\n';

  return `// TokenForge — Tailwind CSS config\n// Paste inside theme.extend in your tailwind.config.js\n\nmodule.exports = {\n  theme: {\n    extend: {\n${colors}    },\n  },\n};\n`;
}
