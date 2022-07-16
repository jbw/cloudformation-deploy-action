import * as AWS from 'aws-sdk';
import { Stack } from 'aws-sdk/clients/cloudformation';
import { PromiseResult } from 'aws-sdk/lib/request';
import * as fs from 'fs';

import { CloudFormationClientOptions } from './client-options';
import { CloudFormationStackOptions } from './cloud-formation-stack-options';
import { CloudFormationStackResponse } from './cloud-formation-stack-response';
import { ErrorOrAwsError } from './error-or-aws-error';

export class CloudFormationStack {
  private readonly cf: AWS.CloudFormation;
  constructor(private readonly options: CloudFormationStackOptions) {
    this.cf = this.createClient(this.options.client);
  }

  public async deploy(options?: {
    waitFor?: boolean;
  }): Promise<CloudFormationStackResponse> {
    const stack = await this.getStack(this.options.stack.name);
    return !stack ? this.create(options) : this.update(options);
  }

  private async create(deployOptions?: {
    waitFor?: boolean;
  }): Promise<CloudFormationStackResponse> {
    const { waitFor } = deployOptions || {};

    const options: AWS.CloudFormation.Types.CreateStackInput = {
      StackName: this.options.stack.name,
    };

    if (this.options.stack.template.url) {
      options.TemplateURL = this.options.stack.template.url;
    }

    if (this.options.stack.template.filepath) {
      options.TemplateBody = this.readTemplate(
        this.options.stack.template.filepath,
      );
    }

    try {
      const resp = await this.cf.createStack(options).promise();

      if (waitFor) {
        await this.waitForStackCreation();
      }

      return {
        stackId: resp.StackId,
        status: resp.$response.httpResponse.statusCode.toString(),
      };
    } catch (error: any) {
      return {
        status: this.isAwsError(error)
          ? error.statusCode.toString()
          : error.message.toString(),

        stackId: undefined,
      };
    }
  }

  private async update(options?: {
    waitFor?: boolean;
  }): Promise<CloudFormationStackResponse> {
    const { waitFor } = options || {};

    const stack = await this.getStack(this.options.stack.name);
    if (!stack) {
      return { status: '404' };
    }

    // create change set
    const resp = await this.cf
      .createChangeSet({
        StackName: this.options.stack.name,
        ChangeSetName: this.options.stack.name,
        TemplateBody: this.readTemplate(this.options.stack.template.filepath),
      })
      .promise();

    if (waitFor) {
      await this.cf
        .waitFor('changeSetCreateComplete', {
          StackName: this.options.stack.name,
          ChangeSetName: this.options.stack.name,
        })
        .promise();
    }

    return {
      status: resp.$response.httpResponse.statusCode.toString(),
      stackId: resp.StackId,
    };
  }

  private async getStack(stackName: string): Promise<Stack | undefined> {
    try {
      const stackDesc = await this.cf
        .describeStacks({
          StackName: stackName,
        })
        .promise();

      return stackDesc?.Stacks?.[0];
    } catch (error: any) {
      if (this.isAwsError(error)) {
        if (error.code === 'ValidationError') {
          return undefined;
        }
        throw error;
      }
    }
    return undefined;
  }

  private waitForStackCreation(): Promise<
    PromiseResult<AWS.CloudFormation.DescribeStacksOutput, AWS.AWSError>
  > {
    return this.cf
      .waitFor('stackCreateComplete', { StackName: this.options.stack.name })
      .promise();
  }

  private createClient(
    options: CloudFormationClientOptions,
  ): AWS.CloudFormation {
    const cfOptions: AWS.CloudFormation.Types.ClientConfiguration = {
      region: options.region,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      endpoint: options.endpoint,
    };

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
