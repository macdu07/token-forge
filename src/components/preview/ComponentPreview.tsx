import { usePaletteStore } from '@/store/paletteStore';

function colorVar(name: string) {
  return `var(--${name})`;
}

export function ComponentPreview() {
  const { palette } = usePaletteStore();
  const primary = palette.colors.find(c => c.variable === 'primary') || palette.colors[0];
  const neutral = palette.colors.find(c => c.variable === 'neutral') || palette.colors[2] || palette.colors[0];
  const success = palette.colors.find(c => c.variable === 'success');
  const error   = palette.colors.find(c => c.variable === 'error');
  const warning = palette.colors.find(c => c.variable === 'warning');

  if (!primary) return <div className="text-muted-foreground text-sm">No colors in palette.</div>;

  const pv  = primary.variable;
  const nv  = neutral?.variable ?? pv;

  return (
    <div className="space-y-8">
      {/* Buttons */}
      <section className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Buttons</div>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 text-white"
            style={{ background: colorVar(pv) }}>
            Primary
          </button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-80"
            style={{ borderColor: colorVar(pv), color: colorVar(pv) }}>
            Outlined
          </button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: colorVar(`${nv}-l-2`), color: colorVar(nv) }}>
            Ghost
          </button>
          {success && (
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: colorVar(success.variable) }}>
              Success
            </button>
          )}
          {error && (
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: colorVar(error.variable) }}>
              Destructive
            </button>
          )}
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Badges</div>
        <div className="flex flex-wrap gap-2">
          {palette.colors.map(c => (
            <span key={c.id}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{ background: colorVar(`${c.variable}-t-3`), color: colorVar(c.variable) }}
            >
              {c.name}
            </span>
          ))}
        </div>
      </section>

      {/* Alerts */}
      {(success || warning || error) && (
        <section className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alerts</div>
          {success && (
            <div className="flex items-start gap-3 p-4 rounded-lg"
              style={{ background: colorVar(`${success.variable}-t-2`), borderLeft: `3px solid ${colorVar(success.variable)}` }}>
              <div className="text-sm font-medium" style={{ color: colorVar(success.variable) }}>✓ Success</div>
              <p className="text-sm text-muted-foreground">Your changes have been saved successfully.</p>
            </div>
          )}
          {warning && (
            <div className="flex items-start gap-3 p-4 rounded-lg"
              style={{ background: colorVar(`${warning.variable}-t-2`), borderLeft: `3px solid ${colorVar(warning.variable)}` }}>
              <div className="text-sm font-medium" style={{ color: colorVar(warning.variable) }}>⚠ Warning</div>
              <p className="text-sm text-muted-foreground">Please review before proceeding.</p>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg"
              style={{ background: colorVar(`${error.variable}-t-2`), borderLeft: `3px solid ${colorVar(error.variable)}` }}>
              <div className="text-sm font-medium" style={{ color: colorVar(error.variable) }}>✕ Error</div>
              <p className="text-sm text-muted-foreground">Something went wrong. Try again.</p>
            </div>
          )}
        </section>
      )}

      {/* Cards */}
      <section className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cards</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: colorVar(`${nv}-l-3`) }}>
            <div className="h-8 w-8 rounded-lg grid place-items-center text-white text-sm font-bold"
              style={{ background: colorVar(pv) }}>T</div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Card Title</h4>
              <p className="text-xs text-muted-foreground">A description that gives context about this card's content.</p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-1.5 rounded-md text-xs font-medium text-white"
                style={{ background: colorVar(pv) }}>Action</button>
              <button className="flex-1 py-1.5 rounded-md text-xs font-medium border"
                style={{ borderColor: colorVar(`${nv}-l-4`) }}>Cancel</button>
            </div>
          </div>

          <div className="rounded-xl p-5 space-y-3 text-white"
            style={{ background: `linear-gradient(135deg, ${colorVar(pv)}, ${colorVar(`${pv}-d-3`)})` }}>
            <div className="text-xs font-medium opacity-75">Total Revenue</div>
            <div className="text-2xl font-bold">$48,295</div>
            <div className="text-xs opacity-70">↑ 12% from last month</div>
          </div>
        </div>
      </section>

      {/* Color swatches on backgrounds */}
      <section className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Color on backgrounds</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl space-y-2 bg-background border">
            <div className="text-xs text-muted-foreground mb-2">Light background</div>
            {palette.colors.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center gap-2 text-xs">
                <div className="h-5 w-5 rounded" style={{ background: colorVar(c.variable) }} />
                <span style={{ color: colorVar(c.variable) }} className="font-medium">{c.name}</span>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl space-y-2 bg-zinc-950 border border-zinc-800 dark">
            <div className="text-xs text-zinc-500 mb-2">Dark background</div>
            {palette.colors.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center gap-2 text-xs">
                <div className="h-5 w-5 rounded" style={{ background: colorVar(c.variable) }} />
                <span style={{ color: colorVar(c.variable) }} className="font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
