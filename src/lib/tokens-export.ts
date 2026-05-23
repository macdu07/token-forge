import type { Palette } from '../types';

// W3C Design Tokens Community Group format (https://design-tokens.github.io/community-group/)
export function generateTokens(palette: Palette): string {
  const tokens: Record<string, any> = {};

  palette.colors.forEach((color) => {
    const group: Record<string, any> = {};

    group['base'] = {
      $value: color.light,
      $type: 'color',
      $description: `Base color for ${color.variable}`,
    };

    color.shades.light.forEach((s) => {
      group[`l${s.index + 1}`] = { $value: s.value, $type: 'color' };
    });
    color.shades.dark.forEach((s) => {
      group[`d${s.index + 1}`] = { $value: s.value, $type: 'color' };
    });
    color.shades.transparent.forEach((s) => {
      group[`t${s.index + 1}`] = { $value: s.value, $type: 'color' };
    });

    if (color.darkModeEnabled && color.dark) {
      group['dark-base'] = {
        $value: color.dark,
        $type: 'color',
        $description: `Dark mode base for ${color.variable}`,
      };
    }

    tokens[color.variable] = group;
  });

  if (palette.variables && palette.variables.length > 0) {
    palette.variables.forEach(v => {
      const cleanName = v.name.replace(/^--/, '');
      let type = 'dimension';
      if (v.category === 'radius') type = 'borderRadius';
      if (v.category === 'space') type = 'spacing';

      tokens[cleanName] = {
        $value: v.value,
        $type: type,
      };
    });
  }

  return JSON.stringify(tokens, null, 2);
}
