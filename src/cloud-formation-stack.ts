import * as AWS from 'aws-sdk';

export type CloudFormationCreateStackOptions = {
  name: string;
};

export type CloudFormationClientOptions = {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

export type CloudFormationStackOptions = {
  stack: CloudFormationCreateStackOptions;
  client: CloudFormationClientOptions;
};

export class CloudFormationStack {
  constructor(private readonly options: CloudFormationStackOptions) {}

  async deploy(): Promise<string> {
    const cf = this.createClient(this.options.client);

    const options: AWS.CloudFormation.Types.CreateStackInput = {
      StackName: this.options.stack.name,
    };

    const resp = await cf.createStack(options).promise();

    return resp.StackId;
  }

  private createClient(options: CloudFormationClientOptions): AWS.CloudFormation {
    const cfOptions: AWS.CloudFormation.Types.ClientConfiguration = {
      region: options.region,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    };

    return new AWS.CloudFormation(cfOptions);
  }
}
