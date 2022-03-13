import { t } from '../../common';

type F = t.DroppedFile;

/**
 * HTML5 File-System Types.
 */
type Entry = FileEntry | DirectoryEntry;

type EntryPath = {
  name: string;
  fullPath: string;
};

type FileEntry = EntryPath & {
  isFile: true;
  isDirectory: false;
  file(success: (file: File) => void, fail?: (error: Error) => void): void;
};

type DirectoryEntry = EntryPath & {
  isFile: false;
  isDirectory: true;
  createReader(): DirectoryReader;
};

type DirectoryReader = {
  readEntries(
    success: (results: (FileEntry | DirectoryEntry)[]) => void,
    fail?: (error: Error) => void,
  ): void;
};

type DataTransferItem = {
  getAsString(success: (text: string) => void): void;
};

/**
 * Read out file data from a drag-drop-event.
 */
export async function readDropEvent(e: DragEvent) {
  const files: F[] = [];
  const urls: string[] = [];

  let isDirectory = false;

  if (e.dataTransfer?.items) {
    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      const item = e.dataTransfer.items[i];

      if (item.kind === 'string') {
        const text = await readString(item);
        if (isUrl(text)) {
          urls.push(text);
        }
      } else if (typeof item.webkitGetAsEntry === 'function') {
        /**
         * Webkit advanced file API.
         * NB: This allows reading in full directories.
         */
        const entry = item.webkitGetAsEntry() as Entry | null;
        if (entry === null) {
          throw new Error('Nothing dropped: item.webkitGetAsEntry() is null');
        }

        if (entry.isFile) {
          const file = await readFile(entry);
          files.push(file);
        }

        if (entry.isDirectory) {
          isDirectory = true;
          const dir = await readDir(entry);
          dir.forEach((file) => files.push(file));
        }
      } else {
        /**
         * Standard DOM drop handler.
         */
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            files.push(await toFilePayload(file));
          }
        }
      }
    }
  }

  // Remove root "/".
  files.forEach((file) => (file.path = file.path.replace(/^\//, '')));

  // Process directory name.
  let dir = '';
  if (isDirectory && files.length > 0) {
    dir = files[0].path.substring(0, files[0].path.indexOf('/'));
    files.forEach((file) => (file.path = file.path.substring(dir.length + 1)));
  }

  // Finish up.
  return { dir, files, urls };
}

/**
 * [Helpers]
 */

async function toFilePayload(file: File, name?: string) {
  const filename = name || file.name;
  const mimetype = file.type;
  const data = new Uint8Array(await (file as any).arrayBuffer());
  const payload: F = { path: filename, data, mimetype };
  return payload;
}

function readString(item: DataTransferItem) {
  return new Promise<string>((resolve, reject) => {
    item.getAsString((text) => resolve(text));
  });
}

function readFile(entry: FileEntry) {
  return new Promise<F>((resolve, reject) => {
    entry.file(
      async (file) => resolve(await toFilePayload(file, entry.fullPath)),
      (error) => reject(error),
    );
  });
}

function readDir(entry: DirectoryEntry) {
  return new Promise<F[]>(async (resolve, reject) => {
    try {
      const files = await readEntries(entry);
      const result = await Promise.all(files.map((file) => readFile(file)));
      resolve(result);
    } catch (error: any) {
      reject(error);
    }
  });
}

function readEntries(dir: DirectoryEntry) {
  return new Promise<FileEntry[]>(async (resolve, reject) => {
    const files: FileEntry[] = [];
    dir.createReader().readEntries(
      async (results: (FileEntry | DirectoryEntry)[]) => {
        for (const item of results) {
          if (item.isFile) {
            files.push(item);
          }
          if (item.isDirectory) {
            const children = await readEntries(item);
            children.forEach((file) => files.push(file));
          }
        }
        resolve(files);
      },
      (error: Error) => reject(error),
    );
  });
}

function isUrl(text: string) {
  text = (text || '').trim();
  return text.startsWith('https://') || text.startsWith('http://');
}