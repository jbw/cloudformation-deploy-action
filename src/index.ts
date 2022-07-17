import * as core from '@actions/core';

import { CloudFormationStack } from './cloud-formation-stack';

export async function run() {
  try {
    const stackName = core.getInput('stackName');

    const stack = CloudFormationStack.createStack({
      stack: {
        name: stackName,
        template: { filepath: 'test/test-template.json' },
      },
      client: {
        region: 'us-east-1',
      },
    });

    const stackId = await stack.deploy({ waitFor: true });

    core.setOutput('stackId', stackId);
  } catch (error) {
    console.error(error);
    core.setFailed('Action failed');
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
