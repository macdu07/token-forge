import { useState, useEffect } from 'react';
import { usePaletteStore } from '@/store/paletteStore';
import type { CustomVariable } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, Search, Plus } from 'lucide-react';
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
          className="bg-transparent font-mono text-xs text-foreground outline-none border-b border-transparent focus:border-primary/50 py-0.5 w-full hover:bg-muted/40 focus:bg-muted/65 px-1.5 rounded transition-colors truncate focus:truncate-none"
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

  // Add variable form state
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<'radius' | 'space' | 'other'>('radius');

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newName.trim() || !newValue.trim()) return;

    // clean name
    const cleanName = newName.trim().toLowerCase().replace(/\s+/g, '-').replace(/^--/, '');
    addVariable(cleanName, newValue.trim(), newCategory);

    // reset fields
    setNewName('');
    setNewValue('');
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

        {/* Filter Pills */}
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
