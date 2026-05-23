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
          <TabsTrigger value="guide" className="text-xs h-7">Integration Guide</TabsTrigger>
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
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-5">
              <div>
                <h3 className="text-sm font-semibold mt-0 text-foreground">CSS Custom Properties (Variables)</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Copy or download the CSS output and add it to your project's main stylesheet (inside the <code>:root</code> selector). The variables are enqueued globally, cascading automatically across all components, layout systems, and utility classes.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">Tailwind CSS Integration</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Incorporate the Tailwind configuration object in your <code>tailwind.config.js</code> file under <code>theme.extend.colors</code>. This maps your design tokens directly to Tailwind utility classes, allowing for syntax like <code>bg-primary</code>, <code>text-secondary-l-2</code>, etc.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">WordPress &amp; Page Builders (Bricks Builder, etc.)</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  For <strong>Bricks Builder</strong>, download the <strong className="text-foreground">Bricks JSON</strong> file. Navigate to the Bricks builder color editor, click the Import icon, and select the JSON. Alternatively, pasting the generated CSS in the Custom CSS field or your child theme's stylesheet works universally across Gutenberg, Elementor, and Divi.
                </p>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] mt-2.5 leading-normal">
                  <strong>Note:</strong> Bricks JSON structure may vary by builder version. If import issues arise, the CSS stylesheet is the recommended universal alternative.
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
