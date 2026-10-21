// Structurally compatible with @iconify/types.

export interface IconifyDimensions {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
}

export interface IconifyTransformations {
  rotate?: number; // quarter turns
  hFlip?: boolean;
  vFlip?: boolean;
}

export interface IconifyOptional extends IconifyDimensions, IconifyTransformations {}

export interface IconifyIcon extends IconifyOptional {
  body: string;
}

export interface IconifyAlias extends IconifyOptional {
  parent: string;
}

export interface IconifyIcons {
  [name: string]: IconifyIcon & { hidden?: boolean };
}

export interface IconifyAliases {
  [name: string]: IconifyAlias & { hidden?: boolean };
}

export interface IconifyInfo {
  name: string;
  total?: number;
  version?: string;
  author: { name: string; url?: string };
  license: { title: string; spdx?: string; url?: string };
  samples?: string[];
  height?: number | number[];
  displayHeight?: number;
  category?: string;
  tags?: string[];
  palette?: boolean;
  hidden?: boolean;
}

export interface IconifyJSON extends IconifyDimensions {
  prefix: string;
  provider?: string;
  icons: IconifyIcons;
  aliases?: IconifyAliases;
  lastModified?: number;
  not_found?: string[];
  info?: IconifyInfo;
  chars?: Record<string, string>;
  categories?: Record<string, string[]>;
  themes?: Record<string, { title: string; prefix?: string; suffix?: string }>;
  prefixes?: Record<string, string>;
  suffixes?: Record<string, string>;
}
