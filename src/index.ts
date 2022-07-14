import * as core from '@actions/core';
import { CloudFormationStack } from './cloud-formation-stack';

// Create github action
export async function run() {
  try {
    const stackName = core.getInput('stackName');

    const stack = new CloudFormationStack({
      stack: {
        name: stackName,
      },
      client: {
        region: 'us-east-1',
      },
    });

    const stackId = await stack.deploy();

    core.setOutput('stackId', stackId);
  } catch (error) {
    console.error(error);
    core.setFailed('No message provided');
  }
}

run();
