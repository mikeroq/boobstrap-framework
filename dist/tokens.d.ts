export interface DesignToken { readonly $value: string; readonly $extensions: Readonly<Record<string, string>>; }
export type TokenGroups = Readonly<Record<string, Readonly<Record<string, DesignToken | string>>>>;
export const tokens: TokenGroups;
export const modes: Readonly<Record<string, Readonly<Record<string, string>>>>;
declare const artifact: { readonly tokens: TokenGroups; readonly modes: typeof modes };
export default artifact;
