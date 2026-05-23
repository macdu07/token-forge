import { usePaletteStore } from '@/store/paletteStore';
import { contrastRatio, wcagLevel } from '@/lib/color-engine';
import { cn } from '@/lib/utils';

const WHITES = ['#ffffff', '#f8f9fa'];
const DARKS  = ['#111111', '#1e1e2e'];

export function ContrastChecker() {
  const { palette } = usePaletteStore();

  const rows = palette.colors.flatMap(color => {
    const samples = [
      { label: color.variable, value: color.light },
      ...color.shades.light.filter((_, i) => i % 3 === 0).map(s => ({ label: `${color.variable}-l-${s.index + 1}`, value: s.value })),
    ];
    return samples;
  });

  const backgrounds = [...WHITES, ...DARKS];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Contrast ratios between your color scales and common backgrounds.
      </p>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium w-40">Color</th>
              {backgrounds.map(bg => (
                <th key={bg} className="py-2 px-2 text-center text-muted-foreground font-medium min-w-24">
                  <div className="flex items-center justify-center gap-1">
                    <div className="h-3.5 w-3.5 rounded-sm ring-1 ring-border" style={{ background: bg }} />
                    <code>{bg}</code>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map(row => (
              <tr key={row.label} className="hover:bg-muted/30 transition-colors">
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-sm ring-1 ring-black/10 shrink-0" style={{ background: row.value }} />
                    <code className="text-[11px]">--{row.label}</code>
                  </div>
                </td>
                {backgrounds.map(bg => {
                  const ratio = contrastRatio(row.value, bg);
                  const level = wcagLevel(ratio);
                  return (
                    <td key={bg} className="py-2 px-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-mono font-medium">{ratio.toFixed(2)}</span>
                        <span className={cn(
                          'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                          level === 'AAA'      && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                          level === 'AA'       && 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                          level === 'AA Large' && 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
                          level === 'Fail'     && 'bg-red-500/15 text-red-600 dark:text-red-400',
                        )}>
                          {level}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
