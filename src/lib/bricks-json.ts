import type { Palette } from '../types';

export function generateBricksJSON(palette: Palette) {
  // Use any to avoid complex type checking for the exact Bricks structure
  const json: any = {
    id: palette.id,
    name: palette.name,
    colors: []
  };

  palette.colors.forEach(color => {
    const parentColor: any = {
      id: color.id,
      raw: `var(--${color.variable})`,
      light: color.light,
      darkModeEnabled: color.darkModeEnabled
    };
    if (color.darkModeEnabled && color.dark) {
       parentColor.dark = color.dark;
    }
    json.colors.push(parentColor);

    const pushSteps = (steps: any[]) => {
      steps.forEach(step => {
         const colorNode: any = {
            id: step.id,
            type: step.type,
            raw: step.variable,
            index: step.index,
            parent: color.id,
         };
         colorNode[step.mode] = step.value;
         json.colors.push(colorNode);
      });
    };

    pushSteps(color.shades.light);
    pushSteps(color.shades.dark);
    pushSteps(color.shades.transparent);
    
    if (color.darkModeEnabled && color.darkModeShades) {
       pushSteps(color.darkModeShades.light);
       pushSteps(color.darkModeShades.dark);
       pushSteps(color.darkModeShades.transparent);
    }
  });

  return JSON.stringify(json, null, 2);
}
