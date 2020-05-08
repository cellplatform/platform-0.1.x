import { debounceTime } from 'rxjs/operators';
import { Client, log, Observable, t, Uri, coord } from '../common';

/**
 * Monitor the [sys] cells.
 */
export function monitor(args: { ctx: t.IContext }) {
  const { ctx } = args;
  const { client, sheet } = ctx;
  client.changes.watch(sheet);

  const saver = Client.saveMonitor({ client, debounce: 300 });
  const { saved$ } = saver;
  saveLogger({ ctx, saved$ });
}

/**
 * [Helpers]
 */

function saveLogger(args: { ctx: t.IContext; saved$: Observable<t.ITypedSheetSaved> }) {
  const { ctx, saved$ } = args;
  const pool = ctx.sheet.pool;

  const findType = (ns: string, key: string) => {
    const sheet = pool.sheet(ns);
    const column = coord.cell.toColumnKey(key);
    if (sheet) {
      for (const item of sheet.types) {
        for (const type of item.columns) {
          if (type.column === column) {
            return type;
          }
        }
      }
    }
    return undefined;
  };

  // Models saved.
  saved$.subscribe(e => {
    const prefix = e.ok ? log.blue('SAVED') : log.red('SAVED (error)');
    log.info(prefix);

    if (e.changes.ns) {
      const ns = e.sheet.uri.id;
      log.info.gray(`  ${log.green('ns')}:${ns}`);
    }

    const cells = e.changes.cells || {};

    Object.keys(cells).forEach(key => {
      const change = cells[key];
      const ns = change.ns;
      const type = findType(ns, change.key);
      const prop = type ? type.prop : '';
      const cell = log.gray(`${log.green('cell')}:${ns}:${log.green(change.key)}`);
      log.info(`  ${cell} ${prop}`);
    });
  });

  // Divider
  saved$.pipe(debounceTime(800)).subscribe(() => log.info.gray('━'.repeat(60)));
}
