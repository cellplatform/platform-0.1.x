import { shell } from 'electron';

import { t, Uri } from '../common';
import { System } from '../../main.System';

/**
 * Dev tools menu
 */
export function ServerMenu(args: { bus: t.ElectronMainBus }): t.MenuItem {
  const { bus } = args;
  const events = { system: System.Events({ bus }) };
  const getStatus = () => events.system.status.get();

  const openBrowser = async (path: string) => {
    const status = await getStatus();
    const url = `${status.service.endpoint}/${path.replace(/^\//, '')}`;

    shell.openExternal(url);
  };

  const item: t.MenuItem = {
    type: 'normal',
    label: 'Local',
    submenu: [
      {
        type: 'normal',
        label: 'HTTP Endpoint',
        submenu: [
          { type: 'normal', label: 'local runtime', click: () => openBrowser('/') },
          {
            type: 'normal',
            label: 'genesis cell',
            click: async () => {
              const status = await getStatus();
              const uri = Uri.create.cell(status.ns.genesis, 'A1');
              openBrowser(`/${uri}`);
            },
          },
        ],
      },
      {
        type: 'normal',
        label: 'Logs',
        async click() {
          const path = (await getStatus()).paths.log;
          shell.openPath(path);
        },
      },
    ],
  };
  return item;
}