import * as core from "@actions/core";

// Create github action
export async function run() {
  try {
    const name = core.getInput("name");
    core.setOutput("name", name);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}
