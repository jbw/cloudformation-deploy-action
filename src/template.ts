export type Template = TemplateFile | TemplateUrl;

export interface TemplateFile {
  filepath: string;
  url?: never;
}

export interface TemplateUrl {
  url: string;
  filepath?: never;
}
