import { CloudFormationClientOptions } from './client-options';
import { CloudFormationCreateStackOptions } from './create-stack-options';

export type CloudFormationStackOptions = {
  stack: CloudFormationCreateStackOptions;
  client: CloudFormationClientOptions;
};
