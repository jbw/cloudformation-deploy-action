import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

export type AWSWaitForResp = PromiseResult<
  AWS.CloudFormation.DescribeStacksOutput,
  AWS.AWSError
>;
