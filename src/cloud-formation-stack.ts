import * as AWS from 'aws-sdk';
import { Stack } from 'aws-sdk/clients/cloudformation';
import { PromiseResult } from 'aws-sdk/lib/request';
import * as fs from 'fs';

interface TemplateFile {
  filepath: string;
  url?: never;
}
interface TemplateUrl {
  url: string;
  filepath?: never;
}

type Template = TemplateFile | TemplateUrl;

export type CloudFormationCreateStackOptions = {
  name: string;
  template: Template;
};

export type CloudFormationClientOptions = {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
};

export type CloudFormationStackOptions = {
  stack: CloudFormationCreateStackOptions;
  client: CloudFormationClientOptions;
};

type ErrorOrAwsError = AWS.AWSError | Error;

export class CloudFormationStack {
  private readonly cf: AWS.CloudFormation;
  constructor(private readonly options: CloudFormationStackOptions) {
    this.cf = this.createClient(this.options.client);
  }

  public async deploy(options?: { waitFor?: boolean }): Promise<{ status?: string; stackId?: string; error?: any }> {
    const stack = await this.getStack(this.options.stack.name);
    if (!stack) {
      const resp = await this.create(options);
      return resp;
    }

    const resp = await this.update(options);
    return resp;
  }

  private async create(deployOptions?: {
    waitFor?: boolean;
  }): Promise<{ status?: string; stackId?: string; error?: any }> {
    const { waitFor } = deployOptions || {};

    const options: AWS.CloudFormation.Types.CreateStackInput = {
      StackName: this.options.stack.name,
    };

    if (this.options.stack.template.url) {
      options.TemplateURL = this.options.stack.template.url;
    }

    if (this.options.stack.template.filepath) {
      options.TemplateBody = this.readTemplate(this.options.stack.template.filepath);
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
      console.error(error);

      return {
        status: this.isAwsError(error) ? error.statusCode.toString() : error.message,
        error,
      };
    }
  }

  private async update(options?: { waitFor?: boolean }): Promise<{ status?: string; stackId?: string; error?: any }> {
    const stack = await this.getStack(this.options.stack.name);
    if (!stack) {
      return Promise.resolve({ status: '404' });
    }

    const { waitFor } = options || {};

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
      const stackDesc = await this.cf.describeStacks({ StackName: stackName }).promise();

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

  private waitForStackCreation(): Promise<PromiseResult<AWS.CloudFormation.DescribeStacksOutput, AWS.AWSError>> {
    const cf = this.createClient(this.options.client);
    return cf
      .waitFor('stackCreateComplete', {
        StackName: this.options.stack.name,
      })
      .promise();
  }

  private createClient(options: CloudFormationClientOptions): AWS.CloudFormation {
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
