export type PaletteName = "rose" | "violet" | "blue" | "teal" | "amber";
export type RadiusPreset = "small" | "normal" | "large" | "rounded" | "square";

export interface CompileOptions {
  /** Dictionary of custom CSS variable overrides (e.g. { '--bs-color-primary': '#6366f1' }) */
  tokens?: Record<string, string>;
  /** Palettes to include in output, or false to omit extra palette modes */
  palettes?: PaletteName[] | false;
  /** Radius scale presets to include, or false to omit extra radius modes */
  radii?: RadiusPreset[] | false;
  /** Components to include (e.g. ['button', 'card', 'dialog']), or 'all' */
  components?: string[] | "all";
  /** Utilities to include (e.g. ['spacing', 'layout']), or 'all' */
  utilities?: string[] | "all";
  /** Custom responsive breakpoint values to inline into media queries (e.g. { sm: '40rem', md: '48rem' }) */
  breakpoints?: Record<string, string>;
  /** Whether to wrap framework rules in CSS @layer bs.* blocks. Default true. */
  layers?: boolean;
  /** Whether to include @media (prefers-color-scheme: light) auto-detection. Default true. */
  autoColorScheme?: boolean;
  /** Whether to inline static token values and omit CSS custom properties. Default false. */
  static?: boolean;
  /** Whether to minify output CSS with esbuild. Default false. */
  minify?: boolean;
  /** Custom banner string or true for default banner comment */
  banner?: string | boolean;
  /** File path to write compiled CSS artifact */
  outFile?: string;
  /** Optional source directory override (defaults to src/) */
  srcDir?: string;
}

export interface CompileStats {
  rawBytes: number;
  minifiedBytes: number | null;
  gzipBytes: number;
  brotliBytes: number;
  classCount: number;
  componentsCount: number;
  utilitiesCount: number;
}

export interface CompileResult {
  css: string;
  minifiedCss: string | null;
  map: string | null;
  stats: CompileStats;
}

export declare const ALL_PALETTES: readonly PaletteName[];
export declare const ALL_RADII: readonly RadiusPreset[];
export declare const ALL_COMPONENTS: readonly string[];
export declare const ALL_UTILITIES: readonly string[];

export declare function filterTokensCss(
  sourceCss: string,
  options?: {
    palettes?: PaletteName[] | false;
    radii?: RadiusPreset[] | false;
    autoColorScheme?: boolean;
    tokens?: Record<string, string>;
  },
): string;

export declare function inlineBreakpoints(css: string, breakpoints?: Record<string, string>): string;

export declare function parseRootTokens(tokensCss: string): Record<string, string>;

export declare function substituteStaticValues(css: string, tokenMap: Record<string, string>): string;

export declare function compileCss(options?: CompileOptions): Promise<CompileResult>;

export declare function defineConfig(config: CompileOptions): CompileOptions;

export interface CustomDataProperty {
  name: string;
  description?: string;
  syntax?: string;
  values?: Array<{ name: string; description?: string }>;
}

export interface CustomDataAttribute {
  name: string;
  description?: string;
  valueSet?: string;
  values?: Array<{ name: string; description?: string }>;
}

export interface CustomDataResult {
  cssCustomData: {
    version: number;
    properties: CustomDataProperty[];
    pseudoClasses?: Array<{ name: string; description?: string }>;
  };
  htmlCustomData: {
    version: number;
    globalAttributes: CustomDataAttribute[];
  };
  vsCodeSettings: Record<string, string[]>;
}

export declare function generateCustomData(options?: { rootDir?: string }): Promise<CustomDataResult>;

export interface InitOptions {
  cwd?: string;
  framework?: "vanilla" | "alpine" | "react" | "vue" | "svelte";
  palette?: string;
  radius?: string;
  layers?: boolean;
  autoColorScheme?: boolean;
  components?: string[] | "all";
  utilities?: string[] | "all";
  generateVsCode?: boolean;
  writeConfigFile?: boolean;
  format?: "json" | "js" | "mjs" | "ts";
}

export interface InitResult {
  filesCreated: string[];
  config: CompileOptions | null;
}

export declare function initProject(options?: InitOptions): Promise<InitResult>;

