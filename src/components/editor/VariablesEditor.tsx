import { useState, useEffect } from 'react';
import { usePaletteStore } from '@/store/paletteStore';
import type { CustomVariable } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2, Copy, Search, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type CategoryFilter = 'all' | 'radius' | 'space' | 'other';

function VariableRow({
  variable,
  onUpdate,
  onRemove,
  onDuplicate,
}: {
  variable: CustomVariable;
  onUpdate: (id: string, updates: Partial<CustomVariable>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [localName, setLocalName] = useState(variable.name);
  const [localValue, setLocalValue] = useState(variable.value);

  // Sync state if store updates externally
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
      // Revert to original if empty
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
    <div className="group grid grid-cols-1 md:grid-cols-[1fr_auto_1.5fr_auto_auto] items-center gap-3 px-4 py-2 border-b border-border/40 hover:bg-muted/30 transition-colors">
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

export function VariablesEditor() {
  const { palette, addVariable, updateVariable, removeVariable, duplicateVariable } = usePaletteStore();
  const variables = palette.variables ?? [];

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [copied, setCopied] = useState(false);

  // Add variable form state
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<'radius' | 'space' | 'other'>('radius');

  // Calculator state
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcUnit, setCalcUnit] = useState<'px' | 'rem'>('px');
  const [calcMinSize, setCalcMinSize] = useState('16');
  const [calcMaxSize, setCalcMaxSize] = useState('24');
  const [calcMinView, setCalcMinView] = useState('360');
  const [calcMaxView, setCalcMaxView] = useState('1280');
  const [calcName, setCalcName] = useState('radius-xl');
  const [calcCategory, setCalcCategory] = useState<'radius' | 'space' | 'other'>('radius');
  const [computedFormula, setComputedFormula] = useState('');

  // Handle calculator formula computation
  useEffect(() => {
    const minS = parseFloat(calcMinSize);
    const maxS = parseFloat(calcMaxSize);
    const minV = parseFloat(calcMinView);
    const maxV = parseFloat(calcMaxView);

    if (isNaN(minS) || isNaN(maxS) || isNaN(minV) || isNaN(maxV) || minV === maxV) {
      setComputedFormula('');
      return;
    }

    const slope = (maxS - minS) / (maxV - minV);
    const intersection = minS - slope * minV;
    const slopeVw = (slope * 100).toFixed(4);
    
    let intersectionPart = '';
    if (Math.abs(intersection) > 0.001) {
      const intersectionSign = intersection >= 0 ? '+' : '-';
      const absIntersectionVal = Math.abs(intersection);
      intersectionPart = ` ${intersectionSign} ${absIntersectionVal.toFixed(2)}${calcUnit}`;
    }

    const formula = `clamp(${minS}${calcUnit}, calc(${slopeVw}vw${intersectionPart}), ${maxS}${calcUnit})`;
    setComputedFormula(formula);
  }, [calcUnit, calcMinSize, calcMaxSize, calcMinView, calcMaxView]);

  const handleAddCalculated = () => {
    if (!calcName.trim() || !computedFormula) return;
    const cleanName = calcName.trim().toLowerCase().replace(/\s+/g, '-').replace(/^--/, '');
    addVariable(cleanName, computedFormula, calcCategory);
    
    // reset/close calculator
    setShowCalculator(false);
  };

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

  const filteredVariables = variables.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.value.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ? true : v.category === filter;
    return matchesSearch && matchesFilter;
  });

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

      {/* Collapsible Calculator Panel */}
      <div className="rounded-xl border border-border/60 bg-card/30 overflow-hidden">
        <button
          onClick={() => setShowCalculator(v => !v)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Responsive Fluid clamp Generator (Slope math)</span>
          </div>
          <span>{showCalculator ? 'Hide Calculator' : 'Show Calculator'}</span>
        </button>

        {showCalculator && (
          <div className="p-4 border-t border-border/50 bg-muted/5 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top duration-200">
            {/* Left side: Inputs */}
            <div className="col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Unit</Label>
                <div className="flex rounded-md border border-input overflow-hidden h-7">
                  <button
                    type="button"
                    onClick={() => {
                      setCalcUnit('px');
                      setCalcMinView('360');
                      setCalcMaxView('1280');
                      setCalcMinSize('16');
                      setCalcMaxSize('24');
                    }}
                    className={cn(
                      "flex-1 text-[11px] font-medium transition-colors",
                      calcUnit === 'px' ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted/30"
                    )}
                  >
                    px
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalcUnit('rem');
                      setCalcMinView('22.5');
                      setCalcMaxView('80');
                      setCalcMinSize('1');
                      setCalcMaxSize('1.5');
                    }}
                    className={cn(
                      "flex-1 text-[11px] font-medium transition-colors",
                      calcUnit === 'rem' ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted/30"
                    )}
                  >
                    rem
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Variable Name</Label>
                <Input
                  value={calcName}
                  onChange={(e) => setCalcName(e.target.value)}
                  placeholder="e.g. radius-xl"
                  className="h-7 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Category</Label>
                <select
                  value={calcCategory}
                  onChange={(e) => setCalcCategory(e.target.value as any)}
                  className="h-7 text-xs rounded bg-background border border-input text-foreground focus:outline-none px-2 py-0 cursor-pointer w-full"
                >
                  <option value="radius">Radius</option>
                  <option value="space">Spacing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Min Size ({calcUnit})</Label>
                <Input
                  type="number"
                  step="any"
                  value={calcMinSize}
                  onChange={(e) => setCalcMinSize(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Max Size ({calcUnit})</Label>
                <Input
                  type="number"
                  step="any"
                  value={calcMaxSize}
                  onChange={(e) => setCalcMaxSize(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="hidden sm:block" />

              <div className="space-y-1">
                <Label className="text-[11px]">Min Viewport ({calcUnit === 'px' ? 'px' : 'rem'})</Label>
                <Input
                  type="number"
                  step="any"
                  value={calcMinView}
                  onChange={(e) => setCalcMinView(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Max Viewport ({calcUnit === 'px' ? 'px' : 'rem'})</Label>
                <Input
                  type="number"
                  step="any"
                  value={calcMaxView}
                  onChange={(e) => setCalcMaxView(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* Right side: Calculation Output */}
            <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-4 space-y-3">
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Generated Formula</div>
                <div className="bg-zinc-950 text-zinc-100 p-2.5 rounded-lg font-mono text-[11px] break-all leading-normal select-all">
                  {computedFormula || 'Please enter valid inputs'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (computedFormula) {
                      await navigator.clipboard.writeText(computedFormula);
                    }
                  }}
                  disabled={!computedFormula}
                  className="flex-1 h-7 text-xs"
                >
                  Copy Formula
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddCalculated}
                  disabled={!calcName.trim() || !computedFormula}
                  className="flex-1 h-7 text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Variable
                </Button>
              </div>
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
            placeholder="Search variables by name or value..."
            className="bg-transparent text-xs text-foreground placeholder-muted-foreground/60 w-full outline-none"
          />
        </div>

        {/* Header Row */}
        <div className="hidden md:grid grid-cols-[1fr_auto_1.5fr_auto_auto] items-center gap-3 px-4 py-2 border-b border-border bg-muted/35 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Variable Name</div>
          <div></div>
          <div>Value</div>
          <div>Category</div>
          <div className="w-12 text-right">Actions</div>
        </div>

        {/* List Content */}
        <div className="divide-y divide-border/40 max-h-[480px] overflow-y-auto scrollbar-thin">
          {filteredVariables.length > 0 ? (
            filteredVariables.map((v) => (
              <VariableRow
                key={v.id}
                variable={v}
                onUpdate={updateVariable}
                onRemove={removeVariable}
                onDuplicate={duplicateVariable}
              />
            ))
          ) : (
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
