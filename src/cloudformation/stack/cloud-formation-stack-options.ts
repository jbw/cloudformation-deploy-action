export type CloudFormationStackOptions = {
  stack: CloudFormationCreateStackOptions;
  client: CloudFormationClientOptions;
};

export type CloudFormationCreateStackOptions = {
  name: string;
  template: Template;
  capabilities?: string[];
  timeout?: number;
  waitFor?: boolean;
  executeChangeSet?: boolean;
  enableRollback?: boolean;
  terminationProtection?: boolean;
  roleArn?: string;
  tags?: { [key: string]: string };
  notificationArn?: string;
  parameterOverrides?: { [key: string]: string };
};

export type CloudFormationClientOptions = {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
};

export type Template = TemplateFile | TemplateUrl;

export interface TemplateFile {
  filepath: string;
  url?: never;
}

export interface TemplateUrl {
  url: string;
  filepath?: never;
}
