import { CloudFormationStack } from '../src/cloudformation/stack/cloud-formation-stack';
import { CloudFormationStackOptions } from '../src/cloudformation/stack/cloud-formation-stack-options';

const LOCALSTACK_URL = process.env['LOCALSTACK_URL'] ?? 'http://localhost:4566';

describe('deploy', () => {
  it('should deploy', async () => {
    // given
    const timestamp = new Date().getTime().toString();
    const stackName = 'test-stack' + timestamp;
    const options = {
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template.json' },
      },
      client: {
        region: 'us-east-1',
        endpoint: LOCALSTACK_URL,
        accessKeyId: 'accessKeyId',
        secretAccessKey: 'secretAccessKey',
      },
    };

    const stack = CloudFormationStack.createStack(options);

    // when
    const resp = await stack.deploy();

    // then
    expect(resp.stackId).toContain(stackName);
    expect(resp.status).toBe('200');
  });

  it.only('should update', async () => {
    // given
    const timestamp = new Date().getTime().toString();
    const stackName = 'test-stack' + timestamp;
    const options: CloudFormationStackOptions = {
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template.json' },
        waitFor: true,
        deleteFailedChangeSet: false,
      },
      client: {
        region: 'us-east-1',
        endpoint: LOCALSTACK_URL,
        accessKeyId: 'accessKeyId',
        secretAccessKey: 'secretAccessKey',
      },
    };

    // when
    await CloudFormationStack.createStack(options).deploy();
    options.stack.template.filepath = 'test/test-template-update.json';
    const updated = await CloudFormationStack.createStack(options).deploy();

    // then
    expect(updated.stackId).toContain(stackName);
    expect(updated.status).toBe('200');
  }, 500000);
});
