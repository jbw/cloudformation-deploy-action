import * as AWS from 'aws-sdk';
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
  constructor(private readonly options: CloudFormationStackOptions) {}

  private readTemplate(templateFilePath: string): string {
    return fs.readFileSync(templateFilePath, 'utf8');
  }

  async deploy(deployOptions?: { waitFor?: boolean }): Promise<{ status?: string; stackId?: string; error?: any }> {
    const { waitFor } = deployOptions || {};
    const cf = this.createClient(this.options.client);

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
      const resp = await cf.createStack(options).promise();
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

  isAwsError(error: ErrorOrAwsError): error is AWS.AWSError {
    if ((error as AWS.AWSError).statusCode) {
      return true;
    }
    return false;
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
}
