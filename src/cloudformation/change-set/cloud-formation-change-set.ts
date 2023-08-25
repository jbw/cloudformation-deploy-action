import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { AWSWaitForResp } from '../../aws-wait-for-resp';

export class CloudFormationChangeSet {
  constructor(private readonly cf: AWS.CloudFormation) {}

  public async create(options: {
    template: string;
    waitFor?: boolean;
    execute?: boolean;
    deleteFailedChangeSets?: boolean;
    params: AWS.CloudFormation.CreateChangeSetInput;
  }) {
    const {
      template,
      waitFor,
      execute,
      params: { ChangeSetName: changeSetName, StackName: stackName },
    } = options;

    const createChangeSetResp = await this.cf
      .createChangeSet({
        TemplateBody: template,
        ...options.params,
      })
      .promise();

    if (waitFor) {
      console.debug('Waiting for change set creation');

      try {
        const waitForResp = await this.waitForChangeSetCreation(stackName, changeSetName);

        if (waitForResp.ExecutionStatus === 'EXECUTE_COMPLETE') {
          console.debug('Change set execution already complete');

          return {
            status: waitForResp.$response.httpResponse.statusCode.toString(),
            stackId: waitForResp.StackId,
          };
        }
      } catch (error) {
        await this.delete(changeSetName, stackName);
        throw error;
      }
    }

    if (waitFor && execute) {
      console.debug('Executing change set');
      await this.execute(changeSetName, stackName, waitFor);
    }

    return {
      status: createChangeSetResp.$response.httpResponse.statusCode.toString(),
      stackId: createChangeSetResp.StackId,
    };
  }

  public async delete(changeSetName: string, stackName: string, deleteFailedChangeSets?: boolean) {
    const changeSetStatus = await this.cf
      .describeChangeSet({
        ChangeSetName: changeSetName,
        StackName: stackName,
      })
      .promise();

    if (changeSetStatus.Status === 'FAILED') {
      if (deleteFailedChangeSets) {
        console.debug('Change set failed. Deleting...');
        await this.cf
          .deleteChangeSet({
            ChangeSetName: changeSetName,
            StackName: stackName,
          })
          .promise();
      }
    }
  }

  public async execute(changeSetName: string, stackName: string, waitFor?: boolean) {
    const resp = await this.cf
      .executeChangeSet({
        StackName: stackName,
        ChangeSetName: changeSetName,
      })
      .promise();

    if (resp.$response.error) {
      throw resp.$response.error;
    }

    if (waitFor) {
      console.debug('Waiting for stack update to complete...');
      //await this.waitForStackUpdate(stackName);
      //await this.waitForStackCreation(stackName);
    }
  }

  private waitForStackCreation(stackName: string): Promise<AWSWaitForResp> {
    return this.cf.waitFor('stackCreateComplete', { StackName: stackName }).promise();
  }

  private waitForStackUpdate(stackName: string): Promise<AWSWaitForResp> {
    console.debug('Waiting for stack update...');
    return this.cf.waitFor('stackUpdateComplete', { StackName: stackName }).promise();
  }

  private waitForChangeSetCreation(
    stackName: string,
    changeSetName: string,
  ): Promise<PromiseResult<AWS.CloudFormation.DescribeChangeSetOutput, AWS.AWSError>> {
    return this.cf
      .waitFor('changeSetCreateComplete', {
        StackName: stackName,
        ChangeSetName: changeSetName,
      })
      .promise();
  }
}
