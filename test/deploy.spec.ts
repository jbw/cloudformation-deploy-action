import { CloudFormationStack } from '../src/cloud-formation-stack';

describe('deploy', () => {
  it('should deploy', async () => {
    // given

    // create timestamp
    const timestamp = new Date().getTime();
    const stackName = 'test-stack' + timestamp;
    const stack = new CloudFormationStack({
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template.json' },
      },
      client: {
        region: 'us-east-1',
        endpoint: 'http://localhost:4566',
        accessKeyId: 'accessKeyId',
        secretAccessKey: 'secretAccessKey',
      },
    });

    // when
    const resp = await stack.deploy();

    // then
    expect(resp.stackId).toContain(stackName);
    expect(resp.status).toBe('200');
  });

  it('should update', async () => {
    // given

    // create timestamp
    const timestamp = new Date().getTime();
    const stackName = 'test-stack' + timestamp;
    const stack = new CloudFormationStack({
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template.json' },
      },
      client: {
        region: 'us-east-1',
        endpoint: 'http://localhost:4566',
        accessKeyId: 'accessKeyId',
        secretAccessKey: 'secretAccessKey',
      },
    });

    // when
    const resp = await stack.deploy({ waitFor: true });

    const updateResp = await stack.deploy({ waitFor: true });

    // then
    expect(resp.stackId).toContain(stackName);
    expect(resp.status).toBe('200');
    expect(updateResp.stackId).toContain(stackName);
    expect(updateResp.status).toBe('200');
  }, 160000);
});
