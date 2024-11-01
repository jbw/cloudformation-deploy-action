import 'dotenv/config';
import { CloudFormationStack } from '../src/cloudformation/stack/cloud-formation-stack';
import { CloudFormationStackOptions } from '../src/cloudformation/stack/cloud-formation-stack-options';
import { createParameterOverrides } from '../src/createParameterOverrides';

const AWS_ACCESS_KEY_ID = process.env['AWS_ACCESS_KEY_ID'];
const AWS_SECRET_ACCESS_KEY = process.env['AWS_SECRET_ACCESS_KEY'];
const LOCALSTACK_URL = process.env['LOCALSTACK_URL'] ?? 'http://localhost:4566';

describe('deploy', () => {
  it('should create overrides object', async () => {
    // given
    const parameterOverridesFilePath = 'test/parameters.json';

    // when
    const overrides = createParameterOverrides(parameterOverridesFilePath, undefined);

    // then
    expect(overrides).toEqual([
      {
        ParameterKey: 'Environment',
        ParameterValue: 'test',
      },
    ]);
  });

  it('should deploy and not wait for response', async () => {
    // given
    const timestamp = new Date().getTime().toString();
    const stackName = 'test-stack' + timestamp;
    const options = {
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template.json' },
        waitFor: false,
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
    const stackInfo = await stack.getStack(options.stack.name);
    expect(stackInfo?.StackName).toBe(stackName);
    expect(stackInfo?.StackStatus).toBe('CREATE_COMPLETE');
    expect(resp.stackId).toContain(stackName);
    expect(resp.status).toBe('200');
  }, 50000);

  it('should deploy', async () => {
    // given
    const timestamp = new Date().getTime().toString();
    const stackName = 'test-stack' + timestamp;
    const options = {
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template.json' },
        waitFor: true,
        parameterOverrides: [
          {
            ParameterKey: 'Environment',
            ParameterValue: 'dev',
          },
        ],
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

    const stackInfo = await stack.getStack(options.stack.name);

    // then
    expect(resp.stackId).toContain(stackName);
    expect(resp.status).toBe('200');
    expect(stackInfo?.StackName).toBe(stackName);
    expect(stackInfo?.StackStatus).toBe('CREATE_COMPLETE');
    expect(stackInfo?.Parameters).toEqual(options.stack.parameterOverrides);
  }, 500000);

  it('should deploy with session token', async () => {
    // given
    const timestamp = new Date().getTime().toString();
    const stackName = 'test-stack' + timestamp;
    const options: CloudFormationStackOptions = {
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template.json' },
        waitFor: true,
        parameterOverrides: [
          {
            ParameterKey: 'Environment',
            ParameterValue: 'dev',
          },
        ],
      },
      client: {
        region: 'us-east-1',
        endpoint: LOCALSTACK_URL,
        sessionToken: 'test',
        accessKeyId: 'accessKeyId',
        secretAccessKey: 'secretAccessKey',
      },
    };

    const stack = CloudFormationStack.createStack(options);

    // when
    const resp = await stack.deploy();

    const stackInfo = await stack.getStack(options.stack.name);

    // then
    expect(resp.stackId).toContain(stackName);
    expect(resp.status).toBe('200');
    expect(stackInfo?.StackName).toBe(stackName);
    expect(stackInfo?.StackStatus).toBe('CREATE_COMPLETE');
    expect(stackInfo?.Parameters).toEqual(options.stack.parameterOverrides);
  }, 500000);

  it('should update', async () => {
    // given
    const timestamp = new Date().getTime().toString();
    const stackName = 'test-stack-2' + timestamp;
    const options: CloudFormationStackOptions = {
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template.json' },
        waitFor: true,
        deleteFailedChangeSet: false,
        parameterOverrides: [
          {
            ParameterKey: 'Environment',
            ParameterValue: 'dev',
          },
        ],
      },
      client: {
        region: 'us-east-1',
        endpoint: LOCALSTACK_URL,
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    };

    // when
    await CloudFormationStack.createStack(options).deploy();

    options.stack.template.filepath = 'test/test-template-update.json';
    options.stack.parameterOverrides = [
      {
        ParameterKey: 'Environment',
        ParameterValue: 'test',
      },
    ];

    const updated = CloudFormationStack.createStack(options);
    const resp = await updated.deploy();
    const updatedStack = await updated.getStack(options.stack.name);
    const changeSet = await updated.getChangeSet(updatedStack?.ChangeSetId!, options.stack.name);

    // then
    expect(resp.stackId).toContain(stackName);
    expect(resp.status).toBe('200');
    expect(changeSet?.Parameters).toEqual(options.stack.parameterOverrides);
  }, 5000000);

  it('should update and not wait', async () => {
    // given
    const timestamp = new Date().getTime().toString();
    const stackName = 'test-stack-2' + timestamp;
    const options: CloudFormationStackOptions = {
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template.json' },
        waitFor: false,
        deleteFailedChangeSet: false,
        parameterOverrides: [
          {
            ParameterKey: 'Environment',
            ParameterValue: 'dev',
          },
        ],
      },
      client: {
        region: 'us-east-1',
        endpoint: LOCALSTACK_URL,
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    };

    // when
    await CloudFormationStack.createStack(options).deploy();

    options.stack.template.filepath = 'test/test-template-update.json';
    options.stack.parameterOverrides = [
      {
        ParameterKey: 'Environment',
        ParameterValue: 'test',
      },
    ];

    const updated = CloudFormationStack.createStack(options);
    const resp = await updated.deploy();
    const updatedStack = await updated.getStack(options.stack.name);
    const changeSet = await updated.getChangeSet(updatedStack?.ChangeSetId!, options.stack.name);

    // then
    expect(resp.stackId).toContain(stackName);
    expect(resp.status).toBe('200');
    expect(changeSet?.Parameters).toEqual(options.stack.parameterOverrides);
  }, 5000000);
});
