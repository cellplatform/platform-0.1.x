import { t } from '../common';
import { dir } from './dir';

export type IDirArgs = {
  browser: boolean;
  local: boolean;
  remote: boolean;
};

export const init: t.CliInit = cli => {
  const handler: t.CommandHandler<IDirArgs> = async args => {
    await dir({
      dir: process.cwd(),
      configure: args.remote,
      local: args.local,
      remote: args.remote,
    });
  };

  cli
    .command<IDirArgs>({
      name: 'dir',
      alias: 'd',
      description: 'Inspect and configure a folder',
      handler,
    })
    .option<'boolean'>({
      name: 'configure',
      alias: 'c',
      description: 'Configure the folder settings',
      type: 'boolean',
      default: false,
    })
    .option<'boolean'>({
      name: 'remote',
      alias: 'r',
      description: 'Open remote target in browser',
      type: 'boolean',
      default: false,
    })
    .option<'boolean'>({
      name: 'local',
      alias: 'l',
      description: 'Open local folder',
      type: 'boolean',
      default: false,
    });

  return cli;
};
