import { useState, useEffect } from 'react';
import { usePaletteStore } from '@/store/paletteStore';
import type { CustomVariable } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2, Copy, Search, Plus, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type CategoryFilter = 'all' | 'radius' | 'space' | 'other';

const SIZE_ORDER = ['5xs', '4xs', '3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl'];

type ScaleConfig = {
  scaleRatio: number;
  scaleUnit: 'px' | 'rem';
  scaleBaseName: string;
  scaleBaseMinSize: string;
  scaleBaseMaxSize: string;
};

// ─── Math & Parsing Helpers ──────────────────────────────────────────────────

function isScalingVariable(name: string): boolean {
  const parts = name.split('-');
  if (parts.length < 2) return false;
  const size = parts[parts.length - 1];
  return SIZE_ORDER.includes(size);
}

function getVariableSizeIndex(name: string): number {
  const parts = name.split('-');
  const size = parts[parts.length - 1];
  const idx = SIZE_ORDER.indexOf(size);
  return idx !== -1 ? idx : 99;
}

function getNextSizeName(currentName: string, direction: 'larger' | 'smaller'): string {
  const parts = currentName.split('-');
  if (parts.length < 2) return currentName + (direction === 'larger' ? '-large' : '-small');
  
  const prefix = parts.slice(0, parts.length - 1).join('-');
  const size = parts[parts.length - 1];
  
  let nextSize = size;
  
  if (direction === 'larger') {
    if (size === '3xs') nextSize = '2xs';
    else if (size === '2xs') nextSize = 'xs';
    else if (size === 'xs') nextSize = 's';
    else if (size === 's') nextSize = 'm';
    else if (size === 'm') nextSize = 'l';
    else if (size === 'l') nextSize = 'xl';
    else if (size === 'xl') nextSize = '2xl';
    else if (size.endsWith('xl')) {
      const num = parseInt(size.replace('xl', ''), 10);
      nextSize = isNaN(num) ? '2xl' : `${num + 1}xl`;
    } else if (size.endsWith('xs')) {
      const num = parseInt(size.replace('xs', ''), 10);
      if (num <= 2) nextSize = 'xs';
      else nextSize = `${num - 1}xs`;
    } else {
      nextSize = size + '-l';
    }
  } else { // smaller
    if (size === 'm') nextSize = 's';
    else if (size === 's') nextSize = 'xs';
    else if (size === 'xs') nextSize = '2xs';
    else if (size === '2xs') nextSize = '3xs';
    else if (size.endsWith('xs')) {
      const num = parseInt(size.replace('xs', ''), 10);
      nextSize = isNaN(num) ? '2xs' : `${num + 1}xs`;
    } else if (size.endsWith('xl')) {
      const num = parseInt(size.replace('xl', ''), 10);
      if (num <= 2) nextSize = 'xl';
      else nextSize = `${num - 1}xl`;
    } else if (size === 'l') nextSize = 'm';
    else if (size === 'xl') nextSize = 'l';
    else {
      nextSize = size + '-s';
    }
  }
  
  return `${prefix}-${nextSize}`;
}

function parseClampMinMax(clampStr: string): { min: number; max: number; unit: 'px' | 'rem' | 'other' } {
  const fixedMatch = clampStr.trim().match(/^([\d.]+)(px|rem|%|vw|vh)$/);
  if (fixedMatch) {
    const val = parseFloat(fixedMatch[1]);
    const u = fixedMatch[2] as any;
    return { min: val, max: val, unit: u === 'px' || u === 'rem' ? u : 'other' };
  }

  const regex = /clamp\(\s*([\d.]+)(px|rem)\s*,\s*[^,]+\s*,\s*([\d.]+)(px|rem)\s*\)/i;
  const match = clampStr.match(regex);
  if (match) {
    return {
      min: parseFloat(match[1]),
      max: parseFloat(match[3]),
      unit: match[2].toLowerCase() as any,
    };
  }

  const numbers = clampStr.match(/[\d.]+/g);
  if (numbers && numbers.length >= 2) {
    const unit = clampStr.includes('rem') ? 'rem' : 'px';
    return {
      min: parseFloat(numbers[0]),
      max: parseFloat(numbers[numbers.length - 1]),
      unit,
    };
  }

  return { min: 8, max: 12, unit: 'px' };
}

function computeFluidClampFormula({
  minSize,
  maxSize,
  minViewportPx,
  maxViewportPx,
  unit,
  remBase,
}: {
  minSize: number;
  maxSize: number;
  minViewportPx: number;
  maxViewportPx: number;
  unit: 'px' | 'rem';
  remBase: 10 | 16;
}): string {
  const minV = unit === 'rem' ? minViewportPx / remBase : minViewportPx;
  const maxV = unit === 'rem' ? maxViewportPx / remBase : maxViewportPx;

  const slope = (maxSize - minSize) / (maxV - minV);
  const intersection = minSize - slope * minV;
  const slopeVw = (slope * 100).toFixed(4);
  
  let intersectionPart = '';
  if (Math.abs(intersection) > 0.001) {
    const intersectionSign = intersection >= 0 ? '+' : '-';
    const absIntersectionVal = Math.abs(intersection);
    intersectionPart = ` ${intersectionSign} ${absIntersectionVal.toFixed(4)}${unit}`;
  }

  return `clamp(${minSize}${unit}, calc(${slopeVw}vw${intersectionPart}), ${maxSize}${unit})`;
}

// ─── VariableRow subcomponent ───────────────────────────────────────────────

function VariableRow({
  variable,
  onUpdate,
  onRemove,
  onDuplicate,
  isTimeline,
}: {
  variable: CustomVariable;
  onUpdate: (id: string, updates: Partial<CustomVariable>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  isTimeline: boolean;
}) {
  const [localName, setLocalName] = useState(variable.name);
  const [localValue, setLocalValue] = useState(variable.value);

  useEffect(() => {
    setLocalName(variable.name);
  }, [variable.name]);

  useEffect(() => {
    setLocalValue(variable.value);
  }, [variable.value]);

  const handleBlur = () => {
    const trimmedName = localName.trim().toLowerCase().replace(/\s+/g, '-');
    const trimmedValue = localValue.trim();
    if (trimmedName && trimmedValue && (trimmedName !== variable.name || trimmedValue !== variable.value)) {
      onUpdate(variable.id, { name: trimmedName, value: trimmedValue });
    } else {
      setLocalName(variable.name);
      setLocalValue(variable.value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={cn(
      "group grid grid-cols-1 md:grid-cols-[1fr_auto_1.5fr_auto_auto] items-center gap-3 py-2 border-b border-border/40 hover:bg-muted/30 transition-colors",
      isTimeline ? "pl-11 pr-4" : "px-4"
    )}>
      {/* Bullet Dot for Timeline */}
      {isTimeline && (
        <div className="absolute left-[15px] top-0 bottom-0 flex items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/35 border-2 border-background group-hover:bg-primary group-hover:scale-110 transition-all" />
        </div>
      )}

      {/* Variable Name input */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-muted-foreground/60 font-mono text-xs select-none">--</span>
        <input
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent font-mono text-xs text-foreground outline-none border-b border-transparent focus:border-primary/50 py-0.5 w-full hover:bg-muted/40 focus:bg-muted/65 px-1.5 rounded transition-colors"
          placeholder="variable-name"
        />
      </div>

      {/* Equals Sign */}
      <div className="hidden md:block text-muted-foreground/50 font-mono text-xs select-none px-1">=</div>

      {/* Variable Value input */}
      <div className="min-w-0">
        <input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent font-mono text-xs text-foreground outline-none border-b border-transparent focus:border-primary/50 py-0.5 w-full hover:bg-muted/40 focus:bg-muted/65 px-1.5 rounded transition-colors truncate focus:outline-none focus:w-full"
          placeholder="value (e.g. 8px, clamp(...))"
          title={localValue}
        />
      </div>

      {/* Category Select */}
      <div className="flex items-center">
        <select
          value={variable.category}
          onChange={(e) => onUpdate(variable.id, { category: e.target.value as any })}
          className="h-6 text-[10px] rounded bg-muted/60 border border-border/50 text-muted-foreground hover:text-foreground focus:outline-none px-1.5 cursor-pointer"
        >
          <option value="radius">Radius</option>
          <option value="space">Spacing</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => onDuplicate(variable.id)}
          title="Duplicate Variable"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(variable.id)}
          title="Delete Variable"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main VariablesEditor component ─────────────────────────────────────────

export function VariablesEditor() {
  const { palette, addVariable, updateVariable, removeVariable, duplicateVariable } = usePaletteStore();
  const variables = palette.variables ?? [];

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('radius');
  const [copied, setCopied] = useState(false);

  // Global settings state
  const [remBase, setRemBase] = useState<10 | 16>(16);
  const [minViewportPx, setMinViewportPx] = useState(360);
  const [maxViewportPx, setMaxViewportPx] = useState(1280);

  // Add variable form state
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<'radius' | 'space' | 'other'>('radius');

  // Collapsible panel state
  const [showScalePanel, setShowScalePanel] = useState(false);
  const [scaleCategory, setScaleCategory] = useState<'radius' | 'space' | 'other'>('radius');

  // Independent configs state keyed by category
  const [configs, setConfigs] = useState<Record<'radius' | 'space' | 'other', ScaleConfig>>({
    radius: {
      scaleRatio: 1.25,
      scaleUnit: 'px',
      scaleBaseName: 'm',
      scaleBaseMinSize: '8',
      scaleBaseMaxSize: '12',
    },
    space: {
      scaleRatio: 1.25,
      scaleUnit: 'rem',
      scaleBaseName: 'm',
      scaleBaseMinSize: '24',
      scaleBaseMaxSize: '36',
    },
    other: {
      scaleRatio: 1.25,
      scaleUnit: 'px',
      scaleBaseName: 'm',
      scaleBaseMinSize: '16',
      scaleBaseMaxSize: '24',
    },
  });

  const updateConfig = (key: keyof ScaleConfig, value: any) => {
    setConfigs((prev) => ({
      ...prev,
      [scaleCategory]: {
        ...prev[scaleCategory],
        [key]: value,
      },
    }));
  };

  // Sync scale panel category selection when the active filter pill shifts
  useEffect(() => {
    if (filter === 'space') {
      setScaleCategory('space');
    } else if (filter === 'radius') {
      setScaleCategory('radius');
    } else if (filter === 'other') {
      setScaleCategory('other');
    }
  }, [filter]);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newName.trim() || !newValue.trim()) return;

    const cleanName = newName.trim().toLowerCase().replace(/\s+/g, '-').replace(/^--/, '');
    addVariable(cleanName, newValue.trim(), newCategory);

    setNewName('');
    setNewValue('');
  };

  const handleCopyFiltered = async () => {
    const varsToCopy = filter === 'all'
      ? variables
      : variables.filter((v) => v.category === filter);

    if (varsToCopy.length === 0) return;

    const text = varsToCopy
      .map((v) => {
        const prefix = v.name.startsWith('--') ? '' : '--';
        return `${prefix}${v.name}: ${v.value};`;
      })
      .join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate size on bounds (first/last + click) using category-specific configs
  const handleGenerateSize = (baseVar: CustomVariable, direction: 'larger' | 'smaller') => {
    const nextName = getNextSizeName(baseVar.name, direction);

    if (variables.some((v) => v.name === nextName)) {
      alert(`The variable --${nextName} already exists!`);
      return;
    }

    // Get config specific to this variable's category
    const categoryConfig = configs[baseVar.category];
    const { scaleRatio, scaleUnit } = categoryConfig;

    let { min, max, unit: baseUnit } = parseClampMinMax(baseVar.value);
    
    // Convert units if needed
    if (baseUnit === 'rem' && scaleUnit === 'px') {
      min = min * remBase;
      max = max * remBase;
      baseUnit = 'px';
    } else if (baseUnit === 'px' && scaleUnit === 'rem') {
      min = min / remBase;
      max = max / remBase;
      baseUnit = 'rem';
    }

    let nextMin = direction === 'larger' ? min * scaleRatio : min / scaleRatio;
    let nextMax = direction === 'larger' ? max * scaleRatio : max / scaleRatio;

    // Formatting precision
    if (scaleUnit === 'rem') {
      nextMin = parseFloat(nextMin.toFixed(4));
      nextMax = parseFloat(nextMax.toFixed(4));
    } else {
      nextMin = parseFloat(nextMin.toFixed(2));
      nextMax = parseFloat(nextMax.toFixed(2));
    }

    const computedVal = computeFluidClampFormula({
      minSize: nextMin,
      maxSize: nextMax,
      minViewportPx,
      maxViewportPx,
      unit: scaleUnit,
      remBase,
    });

    addVariable(nextName, computedVal, baseVar.category);
  };

  // Regenerate scale of active category using its specific configs
  const handleRegenerateScale = () => {
    const currentConfig = configs[scaleCategory];
    const { scaleRatio, scaleUnit, scaleBaseName, scaleBaseMinSize, scaleBaseMaxSize } = currentConfig;

    const baseMin = parseFloat(scaleBaseMinSize);
    const baseMax = parseFloat(scaleBaseMaxSize);

    if (isNaN(baseMin) || isNaN(baseMax)) {
      alert('Please write valid numbers for the base values.');
      return;
    }

    const baseIndex = SIZE_ORDER.indexOf(scaleBaseName);
    if (baseIndex === -1) return;

    const targetSizes = ['xs', 's', 'm', 'l', 'xl', '2xl'];

    // 1. Delete existing scaling variables of this category
    const scaleVarsToDelete = variables.filter(
      (v) => v.category === scaleCategory && isScalingVariable(v.name)
    );
    scaleVarsToDelete.forEach((v) => removeVariable(v.id));

    // 2. Generate new scale variables
    targetSizes.forEach((size) => {
      const idx = SIZE_ORDER.indexOf(size);
      const diff = idx - baseIndex;
      
      let nextMinPx = diff >= 0 ? baseMin * Math.pow(scaleRatio, diff) : baseMin / Math.pow(scaleRatio, -diff);
      let nextMaxPx = diff >= 0 ? baseMax * Math.pow(scaleRatio, diff) : baseMax / Math.pow(scaleRatio, -diff);

      // Convert to rem if scaleUnit is 'rem'
      let finalMin = scaleUnit === 'rem' ? nextMinPx / remBase : nextMinPx;
      let finalMax = scaleUnit === 'rem' ? nextMaxPx / remBase : nextMaxPx;

      finalMin = parseFloat(finalMin.toFixed(scaleUnit === 'rem' ? 4 : 2));
      finalMax = parseFloat(finalMax.toFixed(scaleUnit === 'rem' ? 4 : 2));

      const formula = computeFluidClampFormula({
        minSize: finalMin,
        maxSize: finalMax,
        minViewportPx,
        maxViewportPx,
        unit: scaleUnit,
        remBase,
      });

      const varName = `${scaleCategory}-${size}`;
      addVariable(varName, formula, scaleCategory);
    });

    setShowScalePanel(false);
  };

  // Filter variables
  const categoryVariables = filter === 'all'
    ? variables
    : variables.filter((v) => v.category === filter);

  const searchFiltered = categoryVariables.filter(
    (v) => v.name.toLowerCase().includes(search.toLowerCase()) || v.value.toLowerCase().includes(search.toLowerCase())
  );

  // Divide into timeline scaling variables and fixed variables
  const isTimelineActive = filter === 'radius' || filter === 'space' || filter === 'other';
  let scalingVars: CustomVariable[] = [];
  let fixedVars: CustomVariable[] = [];

  if (isTimelineActive) {
    scalingVars = searchFiltered.filter((v) => isScalingVariable(v.name));
    fixedVars = searchFiltered.filter((v) => !isScalingVariable(v.name));

    // Sort scaling variables based on SIZE_ORDER index
    scalingVars.sort((a, b) => getVariableSizeIndex(a.name) - getVariableSizeIndex(b.name));
  } else {
    fixedVars = searchFiltered;
  }

  const firstVar = scalingVars[0];
  const lastVar = scalingVars[scalingVars.length - 1];

  return (
    <div className="space-y-4">
      {/* Title & Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            Variables
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-mono font-normal">
              {variables.length}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage CSS custom properties (tokens) for borders, spaces, and layout.
          </p>
        </div>

        {/* Filter Pills & Copy button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'radius', 'space', 'other'] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-md border font-medium capitalize transition-all",
                  filter === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted/30"
                )}
              >
                {cat === 'space' ? 'spacing' : cat}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFiltered}
            className="text-xs h-7 gap-1.5 px-2.5 border-border/80"
            title="Copy filtered CSS variables list"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : `Copy ${filter === 'all' ? 'All' : filter === 'space' ? 'Spacing' : filter.charAt(0).toUpperCase() + filter.slice(1)}`}
          </Button>
        </div>
      </div>

      {/* Global Environment settings bar */}
      <div className="p-3 bg-muted/20 border border-border/60 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase font-semibold text-muted-foreground/75 tracking-wider">REM Base Size</Label>
          <select
            value={remBase}
            onChange={(e) => setRemBase(parseInt(e.target.value) as any)}
            className="h-7 w-full text-xs rounded bg-background border border-input focus:outline-none px-2 cursor-pointer focus:ring-1 focus:ring-ring"
          >
            <option value="16">16px (Default Browser)</option>
            <option value="10">10px (62.5% html reset)</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase font-semibold text-muted-foreground/75 tracking-wider">Min Viewport (px)</Label>
          <Input
            type="number"
            value={minViewportPx}
            onChange={(e) => setMinViewportPx(parseInt(e.target.value) || 360)}
            className="h-7 text-xs bg-background border-input"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase font-semibold text-muted-foreground/75 tracking-wider">Max Viewport (px)</Label>
          <Input
            type="number"
            value={maxViewportPx}
            onChange={(e) => setMaxViewportPx(parseInt(e.target.value) || 1280)}
            className="h-7 text-xs bg-background border-input"
          />
        </div>
      </div>

      {/* Collapsible Regenerate Scale Panel */}
      <div className="rounded-xl border border-border/60 bg-card/30 overflow-hidden">
        <button
          onClick={() => setShowScalePanel(v => !v)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Fluid Scale Generator (Generate entire scale from base)</span>
          </div>
          <span>{showScalePanel ? 'Hide Scale Tool' : 'Show Scale Tool'}</span>
        </button>

        {showScalePanel && (
          <div className="p-4 border-t border-border/50 bg-muted/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in slide-in-from-top duration-200">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Scale Category</Label>
              <select
                value={scaleCategory}
                onChange={(e) => setScaleCategory(e.target.value as any)}
                className="h-7 w-full text-xs rounded bg-background border border-input focus:outline-none px-2 cursor-pointer w-full focus:ring-1 focus:ring-ring"
              >
                <option value="radius">Radius Variables</option>
                <option value="space">Spacing Variables</option>
                <option value="other">Other Variables</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Scale Ratio</Label>
              <select
                value={configs[scaleCategory].scaleRatio}
                onChange={(e) => updateConfig('scaleRatio', parseFloat(e.target.value))}
                className="h-7 w-full text-xs rounded bg-background border border-input focus:outline-none px-2 cursor-pointer w-full focus:ring-1 focus:ring-ring"
              >
                <option value="1.125">1.125 — Major Second</option>
                <option value="1.200">1.200 — Minor Third</option>
                <option value="1.250">1.250 — Major Third</option>
                <option value="1.333">1.333 — Perfect Fourth</option>
                <option value="1.414">1.414 — Augmented Fourth</option>
                <option value="1.500">1.500 — Perfect Fifth</option>
                <option value="1.618">1.618 — Golden Ratio</option>
                <option value="2.000">2.000 — Double</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Base Unit</Label>
              <select
                value={configs[scaleCategory].scaleUnit}
                onChange={(e) => updateConfig('scaleUnit', e.target.value as any)}
                className="h-7 w-full text-xs rounded bg-background border border-input focus:outline-none px-2 cursor-pointer w-full focus:ring-1 focus:ring-ring"
              >
                <option value="px">Pixels (px)</option>
                <option value="rem">Rem (rem)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Base Size Name</Label>
              <select
                value={configs[scaleCategory].scaleBaseName}
                onChange={(e) => updateConfig('scaleBaseName', e.target.value)}
                className="h-7 w-full text-xs rounded bg-background border border-input focus:outline-none px-2 cursor-pointer w-full focus:ring-1 focus:ring-ring"
              >
                {SIZE_ORDER.map(sz => (
                  <option key={sz} value={sz}>{sz.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Mobile Base Size (px)</Label>
              <Input
                type="number"
                step="any"
                value={configs[scaleCategory].scaleBaseMinSize}
                onChange={(e) => updateConfig('scaleBaseMinSize', e.target.value)}
                className="h-7 text-xs bg-background border-input"
                placeholder="e.g. 8"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Desktop Base Size (px)</Label>
              <Input
                type="number"
                step="any"
                value={configs[scaleCategory].scaleBaseMaxSize}
                onChange={(e) => updateConfig('scaleBaseMaxSize', e.target.value)}
                className="h-7 text-xs bg-background border-input"
                placeholder="e.g. 12"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 md:col-span-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-border/40 pt-3 mt-2 gap-3">
              <p className="text-[11px] text-muted-foreground max-w-xl leading-relaxed">
                <strong>Attention:</strong> This will generate responsive scales from <strong>xs</strong> to <strong>2xl</strong> based on the category settings, replacing previous scaling tokens of this category. Special tokens like <strong>full</strong> and <strong>50</strong> will remain unaffected.
              </p>
              <Button
                size="sm"
                onClick={handleRegenerateScale}
                className="h-8 gap-1 shadow-sm px-4 shrink-0 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                <Plus className="h-4 w-4" />
                Generate Scale
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border/60 bg-card/45 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar (Search) */}
        <div className="px-4 py-2.5 border-b border-border/60 bg-muted/20 flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search variables in ${filter === 'all' ? 'all' : filter === 'space' ? 'spacing' : filter}...`}
            className="bg-transparent text-xs text-foreground placeholder-muted-foreground/60 w-full outline-none"
          />
        </div>

        {/* Header Row */}
        <div className={cn(
          "hidden md:grid grid-cols-[1fr_auto_1.5fr_auto_auto] items-center gap-3 py-2 border-b border-border bg-muted/35 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
          isTimelineActive ? "pl-11 pr-4" : "px-4"
        )}>
          <div>Variable Name</div>
          <div></div>
          <div>Value</div>
          <div>Category</div>
          <div className="w-12 text-right">Actions</div>
        </div>

        {/* List Content */}
        <div className="divide-y divide-border/40 max-h-[520px] overflow-y-auto scrollbar-thin relative">
          
          {/* Active timeline connectors */}
          {isTimelineActive && scalingVars.length > 0 && (
            <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border/60 pointer-events-none" />
          )}

          {/* 1. TIMELINE SCALING VARIABLES */}
          {isTimelineActive && scalingVars.length > 0 && (
            <div className="flex flex-col">
              
              {/* Scale Generator: TOP (Smaller boundary) */}
              {firstVar && (
                <div className="pl-11 relative py-2 border-b border-border/20 flex items-center hover:bg-muted/10 group/top">
                  <div className="absolute left-[10px] top-0 bottom-0 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleGenerateSize(firstVar, 'smaller')}
                      className="w-5 h-5 rounded bg-amber-500 hover:bg-amber-600 text-black flex items-center justify-center transition-all shadow-sm hover:scale-105"
                      title={`Generate smaller size: --${getNextSizeName(firstVar.name, 'smaller')}`}
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[3px]" />
                    </button>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono font-medium pl-1 select-none">
                    Generate smaller size: <span className="text-foreground/80">--{getNextSizeName(firstVar.name, 'smaller')}</span>
                  </div>
                </div>
              )}

              {/* Variable Rows */}
              {scalingVars.map((v) => (
                <VariableRow
                  key={v.id}
                  variable={v}
                  onUpdate={updateVariable}
                  onRemove={removeVariable}
                  onDuplicate={duplicateVariable}
                  isTimeline={true}
                />
              ))}

              {/* Scale Generator: BOTTOM (Larger boundary) */}
              {lastVar && (
                <div className="pl-11 relative py-2 border-b border-border/20 flex items-center hover:bg-muted/10 group/bottom">
                  <div className="absolute left-[10px] top-0 bottom-0 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleGenerateSize(lastVar, 'larger')}
                      className="w-5 h-5 rounded bg-amber-500 hover:bg-amber-600 text-black flex items-center justify-center transition-all shadow-sm hover:scale-105"
                      title={`Generate larger size: --${getNextSizeName(lastVar.name, 'larger')}`}
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[3px]" />
                    </button>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono font-medium pl-1 select-none">
                    Generate larger size: <span className="text-foreground/80">--{getNextSizeName(lastVar.name, 'larger')}</span>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 2. FLAT LIST (NON-TIMELINE OR FIXED VARIABLES) */}
          {fixedVars.length > 0 && (
            <div className="flex flex-col">
              {isTimelineActive && scalingVars.length > 0 && (
                <div className="px-4 py-1.5 bg-muted/20 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 border-b border-border/40 select-none">
                  Fixed Variables (Not scaled)
                </div>
              )}
              {fixedVars.map((v) => (
                <VariableRow
                  key={v.id}
                  variable={v}
                  onUpdate={updateVariable}
                  onRemove={removeVariable}
                  onDuplicate={duplicateVariable}
                  isTimeline={false}
                />
              ))}
            </div>
          )}

          {searchFiltered.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {search || filter !== 'all' ? 'No variables match the active filters.' : 'No variables defined yet.'}
            </div>
          )}
        </div>

        {/* Add New Variable Footer */}
        <form onSubmit={handleAdd} className="bg-muted/20 border-t border-border px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1.5fr_auto_auto] items-center gap-3">
            {/* Input Name */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-muted-foreground/60 font-mono text-xs select-none">--</span>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New variable name (e.g. radius-2xl)"
                className="h-7 text-xs font-mono bg-background border-border/80 w-full focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            {/* equals */}
            <div className="hidden md:block text-muted-foreground/40 font-mono text-xs select-none px-1">=</div>

            {/* Input Value */}
            <div className="min-w-0">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Value (e.g. 32px or clamp(...))"
                className="h-7 text-xs font-mono bg-background border-border/80 w-full focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            {/* Select Category */}
            <div>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="h-7 text-xs rounded bg-background border border-border/80 text-muted-foreground focus:outline-none px-2 py-0 cursor-pointer w-full"
              >
                <option value="radius">Radius</option>
                <option value="space">Spacing</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Action */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newName.trim() || !newValue.trim()}
                className="h-7 px-3 text-xs gap-1.5 shadow-sm shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Variable
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
