import * as core from "@actions/core";

// Create github action
export async function run() {
  const name = core.getInput("message");
  if (name) {
    core.debug(`Hello ${name}!`);

    return core.setOutput("outputMessage", name);
  }

  core.setFailed("No message provided");
}

run();
