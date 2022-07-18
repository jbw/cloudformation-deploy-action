import { Template } from './template';

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
