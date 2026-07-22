export type ThemeKind = "dark" | "light";

export interface TextMateRule {
  name?: string;
  scope: string | string[];
  settings: {
    foreground?: string;
    background?: string;
    fontStyle?: string;
  };
}

export type SemanticStyle =
  | string
  | {
      foreground?: string;
      fontStyle?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
    };

export interface ColorTheme {
  $schema: string;
  name: string;
  type: ThemeKind;
  semanticHighlighting: true;
  colors: Record<string, string>;
  tokenColors: TextMateRule[];
  semanticTokenColors: Record<string, SemanticStyle>;
}

export interface Palette {
  kind: ThemeKind;
  bg: string;
  bgElevated: string;
  bgMuted: string;
  bgSubtle: string;
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  border: string;
  accent: string;
  accentHover: string;
  accentContrast: string;
  secondary: string;
  secondarySoft: string;
  selection: string;
  selectionInactive: string;
  lineHighlight: string;
  red: string;
  orange: string;
  yellow: string;
  green: string;
  cyan: string;
  blue: string;
  purple: string;
  pink: string;
  comment: string;
  variable: string;
  property: string;
  string: string;
  number: string;
  keyword: string;
  type: string;
  fn: string;
  tag: string;
  punctuation: string;
  syntax: {
    comment: string;
    variable: string;
    property: string;
    string: string;
    number: string;
    constant: string;
    builtInConstant: string;
    keyword: string;
    storage: string;
    type: string;
    fn: string;
    tag: string;
    punctuation: string;
    parameter: string;
    languageVariable: string;
  };
}
