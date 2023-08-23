import 'dotenv/config';
import { CloudFormationStack } from '../src/cloudformation/stack/cloud-formation-stack';
import { CloudFormationStackOptions } from '../src/cloudformation/stack/cloud-formation-stack-options';
import { createParameterOverrides } from '../src/index';

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
    const updatedStack = await updated.getStack();

    // then
    expect(resp.stackId).toContain(stackName);
    expect(resp.status).toBe('200');
    expect(updatedStack?.Parameters).toEqual(options.stack.parameterOverrides);
  }, 500000);
});
