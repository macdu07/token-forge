import { useState, useEffect } from 'react';
import { ColorEditor } from '@/components/editor/ColorEditor';
import { PaletteRamp } from '@/components/preview/PaletteRamp';
import { ComponentPreview } from '@/components/preview/ComponentPreview';
import { ContrastChecker } from '@/components/preview/ContrastChecker';
import { ExportPanel } from '@/components/export/ExportPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePaletteStore } from '@/store/paletteStore';
import { Pencil, Check } from 'lucide-react';
import { generateCSS } from '@/lib/css-export';

function PaletteName() {
  const { palette, renamePalette } = usePaletteStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(palette.name);

  const commit = () => {
    if (draft.trim()) renamePalette(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e: any) => setDraft(e.target.value)}
          onKeyDown={(e: any) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="text-sm font-semibold bg-transparent border-b border-primary outline-none w-40"
        />
        <button onClick={commit} className="text-muted-foreground hover:text-foreground transition-colors">
          <Check className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(palette.name); setEditing(true); }}
      className="flex items-center gap-1.5 text-sm font-semibold hover:text-muted-foreground transition-colors group truncate max-w-[150px] sm:max-w-xs"
    >
      <span className="truncate">{palette.name}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
    </button>
  );
}

function App() {
  const { palette } = usePaletteStore();
  const [activeTab, setActiveTab] = useState(() => {
    return (typeof window !== 'undefined' && window.innerWidth < 1024) ? 'editor' : 'ramps';
  });

  useEffect(() => {
    const css = generateCSS(palette, '.dark', '.palette-preview-container');
    let styleTag = document.getElementById('token-forge-dynamic-palette');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'token-forge-dynamic-palette';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = css;
  }, [palette]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="h-14 border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center px-4 sm:px-6 gap-4 h-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <svg 
              className="h-7 w-7 filter drop-shadow-sm" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="tf-header-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="50%" stopColor="#EC4899" />
                  <stop offset="100%" stopColor="#F97316" />
                </linearGradient>
              </defs>
              <path 
                d="M 22,40 L 42,40 C 46.4,40 50,43.6 50,48 L 50,74 C 50,78.4 46.4,82 42,82 C 37.6,82 34,78.4 34,74" 
                stroke="url(#tf-header-grad)" 
                strokeWidth="10" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <path 
                d="M 50,74 L 50,32 C 50,27.6 53.6,24 58,24 L 78,24 M 50,54 L 72,54" 
                stroke="url(#tf-header-grad)" 
                strokeWidth="10" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
            <span className="text-sm font-semibold tracking-tight hidden sm:block">TokenForge</span>
          </div>

          <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

          {/* Palette name */}
          <PaletteName />

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1">
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full flex min-h-[calc(100vh-56px)] px-4 sm:px-6">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 border-r border-border/60 bg-background/60 flex-col hidden lg:flex">
          <div className="flex-1 overflow-y-auto scrollbar-thin py-4 pr-4">
            <ColorEditor />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-y-auto scrollbar-thin">
          <div className="py-6 lg:pl-6 w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-6 w-full overflow-x-auto scrollbar-none">
                <TabsList className="h-8 w-full justify-start overflow-x-auto scrollbar-none flex-nowrap whitespace-nowrap lg:justify-start">
                  <TabsTrigger value="editor" className="text-xs h-7 lg:hidden shrink-0">Colors</TabsTrigger>
                  <TabsTrigger value="ramps" className="text-xs h-7 shrink-0">Color Ramps</TabsTrigger>
                  <TabsTrigger value="components" className="text-xs h-7 shrink-0">Components</TabsTrigger>
                  <TabsTrigger value="contrast" className="text-xs h-7 shrink-0">Contrast</TabsTrigger>
                  <TabsTrigger value="export" className="text-xs h-7 shrink-0">Export</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="editor" className="m-0 focus-visible:outline-none lg:hidden">
                <ColorEditor />
              </TabsContent>

              <TabsContent value="ramps" className="m-0 focus-visible:outline-none palette-preview-container">
                <PaletteRamp />
              </TabsContent>

              <TabsContent value="components" className="m-0 focus-visible:outline-none palette-preview-container">
                <ComponentPreview />
              </TabsContent>

              <TabsContent value="contrast" className="m-0 focus-visible:outline-none palette-preview-container">
                <ContrastChecker />
              </TabsContent>

              <TabsContent value="export" className="m-0 focus-visible:outline-none">
                <ExportPanel />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
