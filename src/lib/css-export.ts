import type { Palette } from '../types';

export function generateCSS(palette: Palette, darkSelector: string = '.dark', rootSelector: string = ':root'): string {
  let rootCSS = `${rootSelector} {\n`;
  const actualDarkSelector = rootSelector !== ':root'
    ? `${darkSelector} ${rootSelector}, ${rootSelector}${darkSelector}, ${rootSelector} ${darkSelector}`
    : darkSelector;
  let darkCSS = `${actualDarkSelector} {\n`;
  
  let hasDark = false;

  palette.colors.forEach(color => {
    rootCSS += `  --${color.variable}: ${color.light};\n`;
    
    color.shades.light.forEach(step => rootCSS += `  ${step.variable.replace('var(', '').replace(')', '')}: ${step.value};\n`);
    color.shades.dark.forEach(step => rootCSS += `  ${step.variable.replace('var(', '').replace(')', '')}: ${step.value};\n`);
    color.shades.transparent.forEach(step => rootCSS += `  ${step.variable.replace('var(', '').replace(')', '')}: ${step.value};\n`);
    
    rootCSS += '\n';

    if (color.darkModeEnabled && color.darkModeShades) {
       hasDark = true;
       darkCSS += `  --${color.variable}: ${color.dark};\n`;
       color.darkModeShades.light.forEach(step => darkCSS += `  ${step.variable.replace('var(', '').replace(')', '')}: ${step.value};\n`);
       color.darkModeShades.dark.forEach(step => darkCSS += `  ${step.variable.replace('var(', '').replace(')', '')}: ${step.value};\n`);
       color.darkModeShades.transparent.forEach(step => darkCSS += `  ${step.variable.replace('var(', '').replace(')', '')}: ${step.value};\n`);
       darkCSS += '\n';
    }
  });

  rootCSS += `}\n\n`;
  darkCSS += `}\n`;

  return hasDark ? rootCSS + darkCSS : rootCSS;
}
