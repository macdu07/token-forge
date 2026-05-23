import type { Palette } from '../types';

export function generateTailwindConfig(palette: Palette): string {
  let colors = '      colors: {\n';

  palette.colors.forEach((color) => {
    colors += `        '${color.variable}': {\n`;
    colors += `          DEFAULT: '${color.light}',\n`;
    color.shades.light.forEach((s) => {
      colors += `          'l${s.index + 1}': '${s.value}',\n`;
    });
    color.shades.dark.forEach((s) => {
      colors += `          'd${s.index + 1}': '${s.value}',\n`;
    });
    color.shades.transparent.forEach((s) => {
      colors += `          't${s.index + 1}': '${s.value}',\n`;
    });
    colors += `        },\n`;
  });

  colors += '      },\n';

  let borderRadius = '';
  let spacing = '';
  let otherTheme = '';

  if (palette.variables && palette.variables.length > 0) {
    const radiusVars = palette.variables.filter(v => v.category === 'radius' || v.name.includes('radius'));
    const spaceVars = palette.variables.filter(v => v.category === 'space' || v.name.includes('space') || v.name.includes('gap') || v.name.includes('padding') || v.name.includes('margin'));
    const otherVars = palette.variables.filter(v => !radiusVars.includes(v) && !spaceVars.includes(v));

    if (radiusVars.length > 0) {
      borderRadius = '      borderRadius: {\n';
      radiusVars.forEach(v => {
        const cleanName = v.name.replace(/^--/, '').replace(/^radius-/, '');
        borderRadius += `        '${cleanName}': 'var(--${v.name.replace(/^--/, '')})',\n`;
      });
      borderRadius += '      },\n';
    }

    if (spaceVars.length > 0) {
      spacing = '      spacing: {\n';
      spaceVars.forEach(v => {
        const cleanName = v.name.replace(/^--/, '').replace(/^space-/, '');
        spacing += `        '${cleanName}': 'var(--${v.name.replace(/^--/, '')})',\n`;
      });
      spacing += '      },\n';
    }

    if (otherVars.length > 0) {
      otherTheme = '      // Other custom tokens\n';
      otherVars.forEach(v => {
        const cleanName = v.name.replace(/^--/, '');
        otherTheme += `      // '${cleanName}': 'var(--${cleanName})',\n`;
      });
    }
  }

  return `// TokenForge — Tailwind CSS config
// Paste inside theme.extend in your tailwind.config.js

module.exports = {
  theme: {
    extend: {
${colors}${borderRadius}${spacing}${otherTheme}    },
  },
};
`;
}
