import { Subject } from 'rxjs';

import { NAME, ROOT_DIR, t } from './common';
import { FsDriver } from './FsDriver';
import { FsIndexer } from './FsIndexer';
import { IndexedDb } from './IndexedDb';

/**
 * A filesystem driver running against the browser [IndexedDB] store.
 */
export const FsDriverLocal = (args: { name?: string }) => {
  const dir = ROOT_DIR;

  return IndexedDb.create<t.FsIndexedDb>({
    name: args.name || 'fs',
    version: 1,

    /**
     * Initialize the database schema.
     */
    schema(req, e) {
      const db = req.result;
      const store = {
        paths: db.createObjectStore(NAME.STORE.PATHS, { keyPath: 'path' }),
        files: db.createObjectStore(NAME.STORE.FILES, { keyPath: 'hash' }),
      };
      store.paths.createIndex(NAME.INDEX.DIRS, ['dir']);
      store.paths.createIndex(NAME.INDEX.HASH, ['hash']);
    },

    /**
     * The database driver API implementation.
     */
    store(db) {
      const dispose$ = new Subject<void>();
      const dispose = () => {
        db.close();
        dispose$.next();
      };

      const { name, version } = db;
      let driver: t.FsDriverLocal | undefined;
      let index: t.FsIndexer | undefined;

      /**
       * API.
       */
      const api: t.FsIndexedDb = {
        dispose$: dispose$.asObservable(),
        dispose,
        name,
        version,
        get driver() {
          return driver || (driver = FsDriver({ dir, db }));
        },
        get index() {
          const fs = api.driver;
          return index || (index = FsIndexer({ dir, db, fs }));
        },
      };
      return api;
    },
  });
};
