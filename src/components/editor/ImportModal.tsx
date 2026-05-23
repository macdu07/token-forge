import React, { useState } from 'react';
import { usePaletteStore } from '@/store/paletteStore';
import { parseBricksJSON, parseCSS, parseTokenForgeJSON, type ParsedColor } from '@/lib/import-engine';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload, CheckCircle2, AlertCircle, FileJson, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

type ImportType = 'bricks' | 'css' | 'tokens';

export function ImportModal({ open, onClose }: ImportModalProps) {
  const { importPalette } = usePaletteStore();
  const [activeTab, setActiveTab] = useState<ImportType>('bricks');
  const [inputText, setInputText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{ name: string; colors: ParsedColor[] } | null>(null);

  if (!open) return null;

  const handleParse = (text: string, type: ImportType = activeTab) => {
    setError(null);
    setParsedData(null);
    
    if (!text.trim()) {
      return;
    }

    let result: { name: string; colors: ParsedColor[] } | null = null;
    
    if (type === 'bricks') {
      result = parseBricksJSON(text);
      if (!result) {
        setError('Invalid Bricks JSON. Ensure it is a valid palette exported from Bricks containing a "colors" array.');
      }
    } else if (type === 'css') {
      result = parseCSS(text);
      if (!result) {
        setError('No valid CSS custom properties (variables) found. Make sure they are declared like --name: value;');
      }
    } else if (type === 'tokens') {
      result = parseTokenForgeJSON(text);
      if (!result) {
        setError('Invalid Design Tokens JSON. Ensure it is a valid W3C Design Token Community Group format color object.');
      }
    }

    if (result && result.colors.length > 0) {
      setParsedData(result);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    handleParse(text);
  };

  const handleTabChange = (val: string) => {
    const type = val as ImportType;
    setActiveTab(type);
    setInputText('');
    setFileName('');
    setError(null);
    setParsedData(null);
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInputText(text);
      handleParse(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!parsedData || parsedData.colors.length === 0) return;
    importPalette(parsedData.name, parsedData.colors);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div>
            <h3 className="text-base font-semibold">Import Palette</h3>
            <p className="text-xs text-muted-foreground">Load an existing color system into TokenForge</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content area */}
        <div className="p-6 overflow-y-auto scrollbar-thin space-y-5">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-3 h-9 w-full">
              <TabsTrigger value="bricks" className="text-xs">
                <FileJson className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                Bricks JSON
              </TabsTrigger>
              <TabsTrigger value="css" className="text-xs">
                <Hash className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                CSS Code
              </TabsTrigger>
              <TabsTrigger value="tokens" className="text-xs">
                <FileJson className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                Tokens JSON
              </TabsTrigger>
            </TabsList>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "mt-4 border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-colors duration-150",
                dragOver ? "border-primary bg-primary/5" : "border-border/80 hover:border-primary/50 hover:bg-accent/40"
              )}
              onClick={() => document.getElementById('import-file-input')?.click()}
            >
              <input
                id="import-file-input"
                type="file"
                accept={activeTab === 'css' ? '.css,.txt' : '.json'}
                onChange={handleFileInput}
                className="hidden"
              />
              <Upload className="h-6 w-6 text-muted-foreground mb-2" />
              <span className="text-xs font-medium">
                {fileName ? fileName : 'Drag & drop your file here, or click to browse'}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1">
                {activeTab === 'css' ? 'Supports .css, .txt files' : 'Supports .json files'}
              </span>
            </div>

            {/* Manual Paste */}
            <div className="mt-4 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Or paste raw text / code below:</Label>
              <textarea
                value={inputText}
                onChange={handleTextChange}
                placeholder={
                  activeTab === 'css'
                    ? ':root {\n  --primary: #3b82f6;\n  --secondary: #8b5cf6;\n}'
                    : activeTab === 'bricks'
                    ? '{\n  "name": "My Bricks Palette",\n  "colors": [...]\n}'
                    : '{\n  "primary": {\n    "base": {\n      "$value": "#3b82f6",\n      "$type": "color"\n    }\n  }\n}'
                }
                className="w-full h-32 text-xs rounded-xl border border-input bg-background p-3 font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-none scrollbar-thin"
              />
            </div>
          </Tabs>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Visual Preview */}
          {parsedData && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3 animate-in slide-in-from-top-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Ready to Import: "{parsedData.name}" ({parsedData.colors.length} base colors detected)</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin pr-1">
                {parsedData.colors.map((color) => (
                  <div
                    key={color.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-500/10 bg-emerald-500/10 text-[10px]"
                  >
                    <div
                      className="h-3 w-3 rounded-sm ring-1 ring-black/10 shrink-0"
                      style={{ background: color.light }}
                    />
                    <span className="font-mono text-emerald-800 dark:text-emerald-300 font-medium">--{color.variable}</span>
                    {color.darkModeEnabled && (
                      <div className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold ml-0.5">DM</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/40 border-t border-border/50 flex justify-end gap-2 shrink-0">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={!parsedData || parsedData.colors.length === 0}
            onClick={handleImport}
          >
            Import Palette
          </Button>
        </div>

      </div>
    </div>
  );
}
