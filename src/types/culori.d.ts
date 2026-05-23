declare module 'culori' {
  export function parse(color: string): any;
  export function oklch(color: any): any;
  export function hsl(color: any): any;
  export function formatCss(color: any): string;
  export function formatHex(color: any): string | undefined;
  export function formatHex8(color: any): string | undefined;
}
