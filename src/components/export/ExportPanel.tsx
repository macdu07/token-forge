import { usePaletteStore } from '@/store/paletteStore';
import { generateCSS } from '@/lib/css-export';
import { generateBricksJSON } from '@/lib/bricks-json';
import { generateSCSS } from '@/lib/scss-export';
import { generateTailwindConfig } from '@/lib/tailwind-export';
import { generateTokens } from '@/lib/tokens-export';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, Check, Info } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function CodeBlock({ content, filename, type }: { content: string; filename: string; type: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        <Button size="sm" className="h-7 text-xs gap-1.5" onClick={download}>
          <Download className="h-3.5 w-3.5" /> Download
        </Button>
      </div>
      <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-lg text-xs overflow-auto font-mono max-h-[500px] scrollbar-thin leading-relaxed">
        {content}
      </pre>
    </div>
  );
}

export function ExportPanel() {
  const { palette } = usePaletteStore();
  const [darkSelector, setDarkSelector] = useState('.dark');

  const css      = generateCSS(palette, darkSelector);
  const scss     = generateSCSS(palette, darkSelector);
  const bricks   = generateBricksJSON(palette);
  const tailwind = generateTailwindConfig(palette);
  const tokens   = generateTokens(palette);

  return (
    <div className="space-y-4">
      {/* Dark mode selector setting */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
        <div className="flex items-center gap-1.5 shrink-0">
          <Label className="text-xs text-muted-foreground">Dark mode selector</Label>
          <div className="group relative flex items-center">
            <Info className="h-3.5 w-3.5 text-muted-foreground/75 hover:text-foreground cursor-help transition-colors" />
            <div className="absolute left-0 top-6 z-50 w-72 rounded-lg border border-border bg-popover p-2.5 shadow-md text-[11px] leading-relaxed text-muted-foreground hidden group-hover:block animate-in fade-in duration-100">
              Defines the CSS selector that wraps dark mode color variables in the exported stylesheets. Use <code>.dark</code> or <code>[data-theme="dark"]</code> to match your site's dark mode toggle class or attribute.
            </div>
          </div>
        </div>
        <Input
          value={darkSelector}
          onChange={(e: any) => setDarkSelector(e.target.value)}
          className="h-7 text-xs font-mono max-w-[220px]"
          placeholder=".dark, [data-theme='dark'], ..."
        />
        <div className="flex gap-1 ml-auto">
          {['.dark', '[data-theme="dark"]', '.bricks-is-frontend.dark'].map(s => (
            <button key={s} onClick={() => setDarkSelector(s)}
              className="text-[11px] px-2 py-1 rounded border border-border hover:bg-accent transition-colors font-mono">
              {s}
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="css">
        <TabsList className="h-8 text-xs">
          <TabsTrigger value="css" className="text-xs h-7">CSS</TabsTrigger>
          <TabsTrigger value="scss" className="text-xs h-7">SCSS</TabsTrigger>
          <TabsTrigger value="bricks" className="text-xs h-7">Bricks JSON</TabsTrigger>
          <TabsTrigger value="tailwind" className="text-xs h-7">Tailwind</TabsTrigger>
          <TabsTrigger value="tokens" className="text-xs h-7">Tokens</TabsTrigger>
          <TabsTrigger value="guide" className="text-xs h-7">Import Guide</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="css" className="m-0">
            <CodeBlock content={css} filename={`${palette.name.toLowerCase().replace(/\s/g,'-')}-tokens.css`} type="text/css" />
          </TabsContent>
          <TabsContent value="scss" className="m-0">
            <CodeBlock content={scss} filename={`${palette.name.toLowerCase().replace(/\s/g,'-')}-tokens.scss`} type="text/plain" />
          </TabsContent>
          <TabsContent value="bricks" className="m-0">
            <CodeBlock content={bricks} filename={`${palette.name.toLowerCase().replace(/\s/g,'-')}-bricks.json`} type="application/json" />
          </TabsContent>
          <TabsContent value="tailwind" className="m-0">
            <CodeBlock content={tailwind} filename="tailwind.config.js" type="text/javascript" />
          </TabsContent>
          <TabsContent value="tokens" className="m-0">
            <CodeBlock content={tokens} filename={`${palette.name.toLowerCase().replace(/\s/g,'-')}-tokens.json`} type="application/json" />
          </TabsContent>
          <TabsContent value="guide" className="m-0">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h3 className="text-base font-semibold mt-0">Importing into Bricks Builder</h3>
              <ol className="text-sm space-y-3 text-muted-foreground list-decimal pl-4">
                <li>Download the <strong className="text-foreground">Bricks JSON</strong> file using the tab above.</li>
                <li>In your WordPress admin, go to <strong className="text-foreground">Bricks → Settings → Custom Fields</strong> (or navigate directly to the Bricks builder).</li>
                <li>Open the <strong className="text-foreground">Color Manager</strong> from the left panel toolbar.</li>
                <li>Click the <strong className="text-foreground">Import</strong> button (↑ icon) and select your downloaded JSON file.</li>
                <li>Your color palette and all variants will appear grouped by color name.</li>
                <li>The CSS variables are automatically available as <code className="text-foreground">--{'{variable}'}</code>, <code className="text-foreground">--{'{variable}'}-l-1</code> through <code className="text-foreground">--{'{variable}'}-l-10</code>, etc.</li>
              </ol>

              <h3 className="text-base font-semibold mt-6">Importing CSS variables</h3>
              <p className="text-sm text-muted-foreground">Paste the CSS output into your theme's custom CSS field in WordPress, or enqueue it as a stylesheet. The variables will cascade to all child elements.</p>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs mt-4">
                <strong>Note:</strong> The Bricks JSON format may vary between Bricks versions. If import fails, try the CSS approach instead — it works universally.
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
