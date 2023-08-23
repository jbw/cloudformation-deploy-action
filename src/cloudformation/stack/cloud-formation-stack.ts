import * as AWS from 'aws-sdk';
import { Stack } from 'aws-sdk/clients/cloudformation';
import * as fs from 'fs';

import { CredentialsOptions } from 'aws-sdk/lib/credentials';
import { AWSWaitForResp } from '../../aws-wait-for-resp';
import { ErrorOrAwsError } from '../../error-or-aws-error';
import { CloudFormationChangeSet } from '../change-set/cloud-formation-change-set';
import {
  CloudFormationClientOptions,
  CloudFormationCreateStackOptions,
  CloudFormationStackOptions,
} from './cloud-formation-stack-options';
import { CloudFormationStackResponse } from './cloud-formation-stack-response';

export class CloudFormationStack {
  constructor(
    private readonly stackOptions: CloudFormationCreateStackOptions,
    private readonly cf: AWS.CloudFormation,
    private readonly changeSet: CloudFormationChangeSet,
  ) {}

  public static createStack(options: CloudFormationStackOptions): CloudFormationStack {
    const client = this.createClient(options.client);
    return new CloudFormationStack(options.stack, client, new CloudFormationChangeSet(client));
  }

  public async deploy(): Promise<CloudFormationStackResponse> {
    const stack = await this.getStack();
    return !stack ? this.create() : this.update(stack);
  }

  private async create(): Promise<CloudFormationStackResponse> {
    const { waitFor } = this.stackOptions || {};

    const createStackInput = this.buildStackInput();

    try {
      const resp = await this.cf.createStack(createStackInput).promise();

      if (waitFor) await this.waitForStackCreation();

      return {
        stackId: resp.StackId,
        status: resp.$response.httpResponse.statusCode.toString(),
      };
    } catch (error: AWS.AWSError | Error | unknown) {
      return {
        status: this.isAwsError(error) ? error?.statusCode?.toString() : (error as Error).message.toString(),
        stackId: undefined,
      };
    }
  }

  private async update(stack: Stack): Promise<CloudFormationStackResponse> {
    console.debug('Updating stack...');
    const { waitFor } = this.stackOptions || {};

    if (!stack) return { status: '404' };

    const stackName = stack.StackName;
    const changeSetName = `${stackName}-changeset`;
    const input = this.buildChangeSetInput(stackName, changeSetName);

    await this.changeSet.create({
      template: this.readTemplate(this.stackOptions.template.filepath!),
      waitFor,
      execute: true,
      params: input,
    });

    return {
      status: '200',
      stackId: stack.StackId,
    };
  }

  public async getStack(): Promise<Stack | undefined> {
    try {
      const stackDesc = await this.cf.describeStacks({ StackName: this.stackOptions.name }).promise();

      return stackDesc?.Stacks?.[0];
    } catch (error: unknown) {
      if (this.isAwsError(error)) {
        if (error.code === 'ValidationError') return undefined;
      }
      throw error;
    }
  }

  private buildChangeSetInput(stackName: string, changeSetName: string): AWS.CloudFormation.Types.CreateChangeSetInput {
    const options: AWS.CloudFormation.Types.CreateChangeSetInput = {
      StackName: stackName,
      ChangeSetName: changeSetName,
    };

    if (this.stackOptions.template.url) {
      options.TemplateURL = this.stackOptions.template.url;
    }

    if (this.stackOptions.template.filepath) {
      options.TemplateBody = this.readTemplate(this.stackOptions.template.filepath);
    }

    if (this.stackOptions.capabilities) {
      options.Capabilities = this.stackOptions.capabilities;
    }

    if (this.stackOptions.roleArn) {
      options.RoleARN = this.stackOptions.roleArn;
    }

    if (this.stackOptions.parameterOverrides) {
      options.Parameters = this.stackOptions.parameterOverrides;
    }

    if (this.stackOptions.tags) {
      options.Tags = this.stackOptions.tags;
    }

    if (this.stackOptions.notificationArn) {
      options.NotificationARNs = [this.stackOptions.notificationArn];
    }

    return options;
  }

  private buildStackInput(): AWS.CloudFormation.Types.CreateStackInput {
    const options: AWS.CloudFormation.Types.CreateStackInput = {
      StackName: this.stackOptions.name,
    };

    if (this.stackOptions.template.url) {
      options.TemplateURL = this.stackOptions.template.url;
    }

    if (this.stackOptions.template.filepath) {
      options.TemplateBody = this.readTemplate(this.stackOptions.template.filepath);
    }

    if (this.stackOptions.capabilities) {
      options.Capabilities = this.stackOptions.capabilities;
    }

    if (this.stackOptions.roleArn) {
      options.RoleARN = this.stackOptions.roleArn;
    }

    if (this.stackOptions.parameterOverrides) {
      options.Parameters = this.stackOptions.parameterOverrides;
    }

    if (this.stackOptions.tags) {
      options.Tags = this.stackOptions.tags;
    }

    if (this.stackOptions.notificationArn) {
      options.NotificationARNs = [this.stackOptions.notificationArn];
    }

    if (this.stackOptions.enableRollback) {
      options.OnFailure = 'ROLLBACK';
    } else {
      options.OnFailure = 'DO_NOTHING';
    }

    if (this.stackOptions.terminationProtection) {
      options.EnableTerminationProtection = true;
    }

    if (this.stackOptions.timeout) {
      options.TimeoutInMinutes = this.stackOptions.timeout;
    }

    return options;
  }

  private waitForStackCreation(): Promise<AWSWaitForResp> {
    console.debug('Waiting for stack creation...');
    return this.cf.waitFor('stackCreateComplete', { StackName: this.stackOptions.name }).promise();
  }

  private static createClient(options: CloudFormationClientOptions): AWS.CloudFormation {
    const cfOptions: AWS.CloudFormation.Types.ClientConfiguration = {
      region: options.region,
      endpoint: options.endpoint,
    };

    if (options.accessKeyId && options.secretAccessKey) {
      cfOptions.credentials = {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      } as CredentialsOptions;
    }

    return new AWS.CloudFormation(cfOptions);
  }

  private isAwsError(error: ErrorOrAwsError): error is AWS.AWSError {
    if ((error as AWS.AWSError).statusCode) {
      return true;
    }
    return false;
  }

  private readTemplate(templateFilePath: string): string {
    return fs.readFileSync(templateFilePath, 'utf8');
  }
}
