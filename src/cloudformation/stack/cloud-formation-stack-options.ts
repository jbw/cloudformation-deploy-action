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
  tags?: { Key: string; Value: string }[];
  notificationArn?: string;
  parameterOverrides?: { ParameterKey: string; ParameterValue: string }[];
  deleteFailedChangeSet?: boolean;
};

export type CloudFormationClientOptions = {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  sessionToken?: string;
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
