import { Template } from './template';

export type CloudFormationCreateStackOptions = {
  name: string;
  template: Template;
};
