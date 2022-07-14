import AWSMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import { CloudFormationStack } from '../src/cloud-formation-stack';
AWSMock.setSDKInstance(AWS);

describe('deploy', () => {
  it('should deploy', async () => {
    // given
    AWSMock.mock('CloudFormation', 'createStack', (params: any, callback: any) => {
      callback(null, {
        StackId: 'stackId',
      });
    });

    const stack = new CloudFormationStack({
      stack: {
        name: 'test-stack',
      },
      client: {
        region: 'us-east-1',
      },
    });

    // when
    const stackId = await stack.deploy();

    // then
    expect(stackId).toBe('stackId');
  });
});
