import type { Palette } from '../types';

export function generateSCSS(palette: Palette, darkSelector = '.dark'): string {
  let root = `// TokenForge — SCSS Variables\n// Generated: ${new Date().toISOString()}\n\n// Light mode\n`;
  let dark = `\n// Dark mode\n${darkSelector} {\n`;
  let hasDark = false;

  palette.colors.forEach((color) => {
    root += `$${color.variable}: ${color.light};\n`;
    color.shades.light.forEach((s) => root += `$${color.variable}-l-${s.index + 1}: ${s.value};\n`);
    color.shades.dark.forEach((s) => root += `$${color.variable}-d-${s.index + 1}: ${s.value};\n`);
    color.shades.transparent.forEach((s) => root += `$${color.variable}-t-${s.index + 1}: ${s.value};\n`);
    root += '\n';

    if (color.darkModeEnabled && color.darkModeShades) {
      hasDark = true;
      dark += `  $${color.variable}: ${color.dark};\n`;
      color.darkModeShades.light.forEach((s) => dark += `  $${color.variable}-l-${s.index + 1}: ${s.value};\n`);
      color.darkModeShades.dark.forEach((s) => dark += `  $${color.variable}-d-${s.index + 1}: ${s.value};\n`);
      color.darkModeShades.transparent.forEach((s) => dark += `  $${color.variable}-t-${s.index + 1}: ${s.value};\n`);
      dark += '\n';
    }
  });

  // Add custom variables
  if (palette.variables && palette.variables.length > 0) {
    root += `// Custom Variables\n`;
    palette.variables.forEach((v) => {
      const cleanName = v.name.replace(/^--/, '');
      root += `$${cleanName}: ${v.value};\n`;
    });
    root += '\n';
  }

  dark += '}\n';
  return hasDark ? root + dark : root;
}
