import { open, log, promptConfig } from '../common';

const gray = log.info.gray;

/**
 * Inspect or configure a folder.
 */
export async function dir(args: {
  dir: string;
  configure: boolean;
  local: boolean;
  remote: boolean;
}) {
  // Retrieve (or build) configuration file for the directory.
  const config = await promptConfig({ dir: args.dir, force: args.configure });
  if (!config.isValid) {
    return;
  }

  // Print the target URL.
  const uri = config.target.uri;

  log.info();
  gray(`host:     ${config.data.host}`);
  gray(`target:   cell:${uri.parts.ns}!${log.white(uri.parts.key)}`);
  log.info();

  let printFinalBlankLine = false;

  // Open the local folder.
  if (args.local) {
    open(config.dir);
  } else {
    gray(`• Use ${log.cyan('--local (-l)')} to open folder locally`);
    printFinalBlankLine = true;
  }

  // Open the remote target cell (browser).
  if (args.remote) {
    open(config.target.url);
  } else {
    gray(`• Use ${log.cyan('--remote (-r)')} to open remote target in browser`);
    printFinalBlankLine = true;
  }

  if (printFinalBlankLine) {
    log.info();
  }
}
