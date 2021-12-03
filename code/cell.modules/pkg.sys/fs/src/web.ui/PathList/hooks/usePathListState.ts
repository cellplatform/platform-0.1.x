import { useEffect, useState } from 'react';
import { debounceTime } from 'rxjs/operators';

import { Filesystem, t } from '../common';

type FilesystemName = string;
type DirPath = string;

/**
 * Manages keeping a list of paths in sync with the underlying filesystem.
 */
export function usePathListState(args: { bus: t.EventBus; id: FilesystemName; dir?: DirPath }) {
  const { bus, id, dir } = args;

  const [ready, setReady] = useState(false);
  const [files, setFiles] = useState<t.ManifestFile[]>([]);

  useEffect(() => {
    let isDisposed = false;
    const events = Filesystem.Events({ bus, id });
    const fs = events.fs(dir);

    const readPaths = async () => {
      const manifest = await fs.manifest();
      const files = manifest.files;
      setFiles(files);
      return files;
    };
    events.changed$.pipe(debounceTime(50)).subscribe(readPaths);

    /**
     * [Initialize]
     */

    const init = async () => {
      if (isDisposed) return;
      await readPaths();
      setReady(true);
    };

    if (!ready) events.ready().then(init);

    /**
     * [Dispose]
     */
    return () => {
      isDisposed = true;
      events.dispose();
    };
  }, [id, files, dir]); // eslint-disable-line

  return { id, ready, files };
}