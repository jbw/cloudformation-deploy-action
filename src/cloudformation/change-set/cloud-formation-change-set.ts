import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

export class CloudFormationChangeSet {
  constructor(private readonly cf: AWS.CloudFormation) {}

  public async create(options: {
    changeSetName: string;
    stackName: string;
    template: string;
    waitFor?: boolean;
    execute?: boolean;
  }) {
    const { changeSetName, stackName, template, waitFor, execute } = options;

    const createChangeSetResp = await this.cf
      .createChangeSet({
        StackName: stackName,
        ChangeSetName: changeSetName,
        TemplateBody: template,
      })
      .promise();

    if (waitFor) {
      console.debug('Waiting for change set creation');

      try {
        const waitForResp = await this.cf
          .waitFor('changeSetCreateComplete', {
            StackName: stackName,
            ChangeSetName: changeSetName,
          })
          .promise();

        if (waitForResp.ExecutionStatus === 'EXECUTE_COMPLETE') {
          console.debug('Change set execution already complete');

          return {
            status: '200',
            stackId: waitForResp.StackId,
          };
        }
      } catch (error) {
        console.error(error);
        console.warn('Change set creation failed, deleting change set');

        await this.delete(changeSetName, stackName);
        return { status: '500', error };
      }
    }

    if (waitFor && execute) {
      console.debug('Executing change set');
      await this.execute(changeSetName, stackName, waitFor);
    }

    return {
      status: '200',
      stackId: createChangeSetResp.StackId,
    };
  }

  public async delete(changeSetName: string, stackName: string) {
    const changeSetStatus = await this.cf
      .describeChangeSet({
        ChangeSetName: changeSetName,
        StackName: stackName,
      })
      .promise();

    // todo add option to delete failed change sets
    if (changeSetStatus.Status === 'FAILED') {
      console.debug('Change set failed. Deleting...');
      await this.cf
        .deleteChangeSet({
          ChangeSetName: changeSetName,
          StackName: stackName,
        })
        .promise();
    }
  }

  public async execute(changeSetName: string, stackName: string, waitFor?: boolean) {
    await this.cf
      .executeChangeSet({
        StackName: stackName,
        ChangeSetName: changeSetName,
      })
      .promise();

    if (waitFor) {
      console.debug('Waiting for stack update to complete...');
      await this.waitForStackCreation(stackName);
    }
  }

  private waitForStackCreation(
    stackName: string,
  ): Promise<PromiseResult<AWS.CloudFormation.DescribeStacksOutput, AWS.AWSError>> {
    return this.cf.waitFor('stackCreateComplete', { StackName: stackName }).promise();
  }
}
