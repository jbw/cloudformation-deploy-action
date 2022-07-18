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

  it('should update', async () => {
    // given
    const timestamp = new Date().getTime().toString();
    const stackName = 'test-stack' + timestamp;
    const options: CloudFormationStackOptions = {
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template.json' },
        waitFor: true,
      },
      client: {
        region: 'us-east-1',
        endpoint: LOCALSTACK_URL,
        accessKeyId: 'accessKeyId',
        secretAccessKey: 'secretAccessKey',
      },
    };

    const stack = CloudFormationStack.createStack(options);

    options.stack.template.filepath = 'test/test-template-update.json';
    const stack2 = CloudFormationStack.createStack(options);

    // when
    const resp = await stack.deploy();
    const updateResp = await stack2.deploy();

    // then
    expect(resp.stackId).toContain(stackName);
    expect(resp.status).toBe('200');
    expect(updateResp.stackId).toContain(stackName);
    expect(updateResp.status).toBe('200');
  }, 500000);

  it('should handle changesets already executed', async () => {
    // given
    const timestamp = new Date().getTime().toString();
    const stackName = 'test-stack' + timestamp;
    const options: CloudFormationStackOptions = {
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template.json' },
        waitFor: true,
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
    await stack.deploy();
    await stack.deploy();
    const resp = await stack.deploy();

    // then
    expect(resp.stackId).toContain(stackName);
    expect(resp.status).toBe('200');
  }, 500000);

  it('should clean up empty change sets', async () => {
    // given
    const timestamp = new Date().getTime().toString();
    const stackName = 'test-stack' + timestamp;
    const options: CloudFormationStackOptions = {
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template-changeset-test.json' },
        waitFor: true,
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
    // run the same stack twice - should be 0 changes
    await stack.deploy();

    // then
    expect(resp.stackId).toContain(stackName);
    expect(resp.status).toBe('200');
  }, 500000);

  it('should clean up change sets when an error occurs', async () => {
    // given
    const timestamp = new Date().getTime().toString();
    const stackName = 'test-stack' + timestamp;
    const options: CloudFormationStackOptions = {
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template-changeset-test.json' },
        waitFor: true,
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

    options.stack.template.filepath = 'test/test-template-empty.json';
    await stack.deploy();

    // then
    expect(resp.stackId).toContain(stackName);
    expect(resp.status).toBe('200');
  }, 500000);
});
