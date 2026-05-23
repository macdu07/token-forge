import { useState } from 'react';
import { usePaletteStore } from '@/store/paletteStore';
import { DEFAULT_COLOR_OPTIONS } from '@/types';
import type { ColorOptions } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, ChevronDown, ChevronUp, Settings2, Copy, FileUp } from 'lucide-react';
import { PresetSelector } from '@/components/editor/PresetSelector';
import { ImportModal } from '@/components/editor/ImportModal';
import { cn } from '@/lib/utils';
import { toHex } from '@/lib/color-engine';

function ColorOptionsPanel({ id, options }: { id: string; options: ColorOptions }) {
  const { updateColorOptions } = usePaletteStore();
  return (
    <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Interpolation</Label>
        <select
          value={options.interpolation}
          onChange={(e: any) => updateColorOptions(id, { interpolation: e.target.value })}
          className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="linear">Linear</option>
          <option value="ease-in">Ease In</option>
          <option value="ease-out">Ease Out</option>
          <option value="perceptual">Perceptual</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Output Format</Label>
        <select
          value={options.outputFormat}
          onChange={(e: any) => updateColorOptions(id, { outputFormat: e.target.value })}
          className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="oklch">OKLCH</option>
          <option value="hsl">HSL</option>
          <option value="hex">HEX</option>
        </select>
      </div>
      <div className="col-span-2 space-y-1">
        <div className="flex justify-between">
          <Label className="text-[11px] text-muted-foreground">Chroma Factor</Label>
          <span className="text-[11px] text-muted-foreground">{options.chromaFactor.toFixed(2)}</span>
        </div>
        <input
          type="range" min="0" max="0.5" step="0.01"
          value={options.chromaFactor}
          onChange={(e: any) => updateColorOptions(id, { chromaFactor: parseFloat(e.target.value) })}
          className="w-full accent-primary h-1.5"
        />
      </div>
      <div className="col-span-2 space-y-1">
        <div className="flex justify-between">
          <Label className="text-[11px] text-muted-foreground">Hue Shift</Label>
          <span className="text-[11px] text-muted-foreground">{options.hueShift}°</span>
        </div>
        <input
          type="range" min="-30" max="30" step="1"
          value={options.hueShift}
          onChange={(e: any) => updateColorOptions(id, { hueShift: parseInt(e.target.value) })}
          className="w-full accent-primary h-1.5"
        />
      </div>
    </div>
  );
}

export function ColorEditor() {
  const { palette, updateColor, addColor, removeColor, duplicateColor } = usePaletteStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newVar, setNewVar] = useState('');
  const [newLight, setNewLight] = useState('#3b82f6');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const toggleExpand = (id: string) => setExpanded(e => e === id ? null : id);
  const toggleAdvanced = (id: string) => setShowAdvanced(e => e === id ? null : id);

  const handleAdd = () => {
    if (!newName.trim() || !newVar.trim()) return;
    addColor({
      id: newVar.toLowerCase().replace(/\s+/g, '-'),
      name: newName.trim(),
      variable: newVar.toLowerCase().replace(/\s+/g, '-'),
      light: newLight,
      darkModeEnabled: false,
      options: DEFAULT_COLOR_OPTIONS,
    });
    setNewName(''); setNewVar(''); setNewLight('#3b82f6'); setShowAdd(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Colors</h2>
        <div className="flex items-center gap-1">
          <PresetSelector />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowImport(true)} title="Import palette">
            <FileUp className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAdd(v => !v)} title="Add color">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Name</Label>
              <Input placeholder="Success" className="h-7 text-xs" value={newName} onChange={(e: any) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Variable</Label>
              <Input placeholder="success" className="h-7 text-xs font-mono" value={newVar} onChange={(e: any) => setNewVar(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Color</Label>
            <div className="flex gap-2">
              <input type="color" value={toHex(newLight)} onChange={(e: any) => setNewLight(e.target.value)} className="h-7 w-10 rounded border cursor-pointer bg-transparent p-0.5" />
              <Input placeholder="#3b82f6 or oklch(...)" className="h-7 text-xs font-mono flex-1" value={newLight} onChange={(e: any) => setNewLight(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs flex-1" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {palette.colors.map((color) => (
          <div
            key={color.id}
            className={cn(
              "rounded-lg border transition-all duration-150",
              expanded === color.id
                ? "border-border bg-card shadow-sm"
                : "border-transparent bg-card/60 hover:bg-card hover:border-border/60"
            )}
          >
            {/* Color row */}
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer"
              onClick={() => toggleExpand(color.id)}
            >
              <div
                className="h-5 w-5 rounded-md shadow-sm ring-1 ring-black/10 shrink-0"
                style={{ background: color.light }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{color.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono truncate">--{color.variable}</div>
              </div>
              {color.darkModeEnabled && (
                <div className="h-4 w-4 rounded-sm ring-1 ring-black/10 shrink-0" style={{ background: color.dark || '#000' }} />
              )}
              {expanded === color.id
                ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              }
            </div>

            {/* Expanded controls */}
            {expanded === color.id && (
              <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Variable name</Label>
                    <Input value={color.variable} className="h-7 text-xs font-mono" onChange={(e: any) => updateColor(color.id, { variable: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Display name</Label>
                    <Input value={color.name} className="h-7 text-xs" onChange={(e: any) => updateColor(color.id, { name: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Light base</Label>
                  <div className="flex gap-2">
                    <input type="color" value={toHex(color.light)} onChange={(e: any) => updateColor(color.id, { light: e.target.value })} className="h-7 w-10 rounded border cursor-pointer bg-transparent p-0.5 shrink-0" />
                    <Input value={color.light} className="h-7 text-xs font-mono" onChange={(e: any) => updateColor(color.id, { light: e.target.value })} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs cursor-pointer" htmlFor={`dm-${color.id}`}>Enable dark mode</Label>
                  <Switch id={`dm-${color.id}`} checked={color.darkModeEnabled} onCheckedChange={(v: boolean) => updateColor(color.id, { darkModeEnabled: v })} />
                </div>

                {color.darkModeEnabled && (
                  <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
                    <Label className="text-[11px] text-muted-foreground">Dark base</Label>
                    <div className="flex gap-2">
                      <input type="color" value={toHex(color.dark || '#ffffff')} onChange={(e: any) => updateColor(color.id, { dark: e.target.value })} className="h-7 w-10 rounded border cursor-pointer bg-transparent p-0.5 shrink-0" />
                      <Input value={color.dark || ''} className="h-7 text-xs font-mono" onChange={(e: any) => updateColor(color.id, { dark: e.target.value })} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => toggleAdvanced(color.id)}
                  >
                    <Settings2 className="h-3 w-3" />
                    {showAdvanced === color.id ? 'Hide' : 'Show'} advanced options
                  </button>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => duplicateColor(color.id)} title="Duplicate color">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeColor(color.id)} title="Delete color">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {showAdvanced === color.id && (
                  <ColorOptionsPanel id={color.id} options={color.options} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <ImportModal open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
