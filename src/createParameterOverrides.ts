import fs from 'fs';
import path from 'path';

export function createParameterOverrides(parameterOverridesFilePath?: string, parameterOverridesString?: string) {
  function loadFile(filepath: string) {
    if (!fs.existsSync(filepath)) {
      throw new Error(`File ${filepath} does not exist`);
    }

    const data = fs.readFileSync(filepath, 'utf8');

    if (!data) {
      throw new Error(`File ${filepath} is empty`);
    }

    return JSON.parse(data);
  }

  if (parameterOverridesFilePath) {
    return loadFile(path.join(parameterOverridesFilePath));
  } else if (parameterOverridesString) {
    return JSON.parse(parameterOverridesString);
  }
}
