import type { ColorStep } from '@/types';
import { usePaletteStore } from '@/store/paletteStore';
import { cn } from '@/lib/utils';

function Swatch({ step, className }: { step: ColorStep; className?: string }) {
  return (
    <div
      className={cn('group relative flex-1 h-14 first:rounded-l-lg last:rounded-r-lg transition-all hover:flex-[1.4] cursor-default', className)}
      style={{ backgroundColor: step.value }}
      title={`${step.variable}: ${step.value}`}
    >
      <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity px-1 pb-1">
        <span className="text-[8px] font-mono leading-none bg-black/50 text-white px-1 py-0.5 rounded block truncate">
          {step.index + 1}
        </span>
      </div>
    </div>
  );
}

function Ramp({ steps, label }: { steps: ColorStep[]; label: string }) {
  if (!steps.length) return null;
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-medium text-muted-foreground tracking-wide uppercase">{label}</div>
      <div className="flex w-full rounded-lg overflow-hidden ring-1 ring-border/40">
        {steps.map(s => <Swatch key={s.id} step={s} />)}
      </div>
    </div>
  );
}

export function PaletteRamp() {
  const { palette } = usePaletteStore();

  return (
    <div className="space-y-10">
      {palette.colors.map(color => (
        <div key={color.id}>
          <div className="flex items-baseline gap-2 mb-4">
            <div className="h-4 w-4 rounded-md ring-1 ring-black/10" style={{ background: color.light }} />
            <h3 className="font-semibold">{color.name}</h3>
            <code className="text-xs text-muted-foreground">--{color.variable}</code>
            <span className="ml-auto text-[11px] text-muted-foreground font-mono">{color.options.outputFormat.toUpperCase()}</span>
          </div>

          <div className={cn('grid gap-6', color.darkModeEnabled ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1')}>
            {/* Light mode */}
            <div className="space-y-3 p-4 rounded-xl bg-card/60 border border-border/60">
              {color.darkModeEnabled && (
                <div className="text-xs font-medium text-muted-foreground pb-1 border-b border-border/40">Light mode</div>
              )}
              <Ramp steps={color.shades.light} label="Lighter shades" />
              <Ramp steps={color.shades.dark} label="Darker shades" />
              <div className="relative">
                <div className="absolute inset-0 rounded-lg"
                  style={{ background: 'repeating-conic-gradient(#aaa 0% 25%, transparent 0% 50%) 0 0 / 10px 10px', opacity: 0.2 }}
                />
                <Ramp steps={color.shades.transparent} label="Transparent" />
              </div>
            </div>

            {/* Dark mode */}
            {color.darkModeEnabled && color.darkModeShades && (
              <div className="space-y-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800 dark">
                <div className="text-xs font-medium text-zinc-400 pb-1 border-b border-zinc-800">Dark mode</div>
                <Ramp steps={color.darkModeShades.light} label="Lighter shades" />
                <Ramp steps={color.darkModeShades.dark} label="Darker shades" />
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg"
                    style={{ background: 'repeating-conic-gradient(#555 0% 25%, transparent 0% 50%) 0 0 / 10px 10px', opacity: 0.3 }}
                  />
                  <Ramp steps={color.darkModeShades.transparent} label="Transparent" />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
