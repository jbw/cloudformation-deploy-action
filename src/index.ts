import * as core from '@actions/core';
import fs from 'fs';
import path from 'path';

import { CloudFormationStack } from './cloudformation/stack/cloud-formation-stack';
import { Template } from './cloudformation/stack/cloud-formation-stack-options';

const AWS_ENDPOINT_URL = process.env['AWS_ENDPOINT_URL'];
const AWS_ACCESS_KEY_ID = process.env['AWS_ACCESS_KEY_ID'];
const AWS_SECRET_ACCESS_KEY = process.env['AWS_SECRET_ACCESS_KEY'];
const AWS_REGION = process.env['AWS_DEFAULT_REGION'];
const { GITHUB_WORKSPACE = __dirname } = process.env;

export async function run() {
  try {
    const stackName = core.getInput('stackName');
    const templateFilePath = core.getInput('templateFile');
    const templateUrl = core.getInput('templateUrl');

    const capabilities = core.getInput('capabilities');
    const timeout = core.getInput('timeout');
    const waitFor = core.getInput('wait');
    const executeChangeSet = core.getInput('executeChangeSet');
    const enableRollback = core.getInput('enableRollback');
    const roleArn = core.getInput('roleArn');
    const tags = core.getInput('tags') || '{}';
    const notificationArn = core.getInput('notificationArn');
    const terminationProtection = core.getInput('terminationProtection');
    const parameterOverridesInput = core.getInput('parameterOverrides') || '[]';
    const parameterOverridesFilePath = core.getInput('parameterOverridesFilePath');
    const deleteFailedChangeSet = core.getInput('deleteFailedChangeSet');

    // template filepath takes precedence over url
    const template: Template = templateFilePath
      ? { filepath: path.join(GITHUB_WORKSPACE, templateFilePath) }
      : { url: templateUrl };

    // parameterOverrides filepath takes precedence over url
    const parameterOverrides = parameterOverridesFilePath
      ? loadFile(path.join(GITHUB_WORKSPACE, parameterOverridesFilePath))
      : JSON.parse(parameterOverridesInput);

    const stack = CloudFormationStack.createStack({
      stack: {
        name: stackName,
        template: template,
        capabilities: [...capabilities.split(',').map((cap) => cap.trim())],
        timeout: parseInt(timeout),
        waitFor: new Boolean(waitFor) as boolean,
        executeChangeSet: new Boolean(executeChangeSet) as boolean,
        enableRollback: new Boolean(enableRollback) as boolean,
        terminationProtection: new Boolean(terminationProtection) as boolean,
        roleArn,
        tags: JSON.parse(tags),
        notificationArn,
        parameterOverrides: parameterOverrides,
        deleteFailedChangeSet: new Boolean(deleteFailedChangeSet) as boolean,
      },
      client: {
        region: AWS_REGION,
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        endpoint: AWS_ENDPOINT_URL,
      },
    });

    const stackId = await stack.deploy();

    core.setOutput('stackId', stackId);
  } catch (error) {
    console.error(error);
    core.setFailed('Action failed');
  }

  function loadFile(filepath: string) {
    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
