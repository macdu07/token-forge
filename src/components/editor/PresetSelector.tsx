import { useState } from 'react';
import { usePaletteStore } from '@/store/paletteStore';
import { PRESETS } from '@/presets';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';

export function PresetSelector() {
  const { loadPreset, renamePalette } = usePaletteStore();
  const [open, setOpen] = useState(false);

  const handleSelect = (preset: typeof PRESETS[0]) => {
    loadPreset(preset.colors);
    renamePalette(preset.name);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        title="Load a preset"
        onClick={() => setOpen(v => !v)}
      >
        <Layers className="h-3.5 w-3.5" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-72 max-w-[calc(100vw-32px)] rounded-xl border border-border bg-popover shadow-2xl p-2 space-y-1 animate-in slide-in-from-top-2 duration-150">
            <div className="px-2 py-1.5 text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
              Presets
            </div>
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleSelect(preset)}
                className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-accent transition-colors group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{preset.name}</span>
                  <div className="flex gap-0.5">
                    {preset.colors.slice(0, 5).map(c => (
                      <div
                        key={c.variable}
                        className="h-3.5 w-3.5 rounded-sm ring-1 ring-black/10"
                        style={{ background: c.light }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{preset.description}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
