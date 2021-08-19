import { Schema, t, isOK } from '../common';
import { FsLocalResolver } from './FsLocal.Resolver';

export * from '../types';

const LocalFile = Schema.File.Path.Local;

/**
 * A "local" filesystem running against the node-js 'fs' api.
 */
export function FsLocal(args: { dir: string; fs: t.INodeFs }): t.IFsLocal {
  const node = args.fs;
  const dir = node.resolve(args.dir);
  const root = dir;

  const fs: t.IFsLocal = {
    type: 'LOCAL',

    /**
     * Root directory of the file system.
     */
    dir,

    /**
     * Convert the given string to an absolute path.
     */
    resolve: FsLocalResolver({ dir }),

    /**
     * Retrieve meta-data of a local file.
     */
    async info(uri: string): Promise<t.IFsInfoLocal> {
      uri = (uri || '').trim();
      const path = fs.resolve(uri).path;
      const location = LocalFile.toAbsoluteLocation({ path, root });
      const readResponse = await this.read(uri);
      const { status, file } = readResponse;
      const exists = status !== 404;
      return {
        uri,
        exists,
        path,
        location,
        hash: file?.hash ?? '',
        bytes: file?.bytes ?? -1,
      };
    },

    /**
     * Read from the local file-system.
     */
    async read(uri: string): Promise<t.IFsReadLocal> {
      uri = (uri || '').trim();
      const path = fs.resolve(uri).path;
      const location = LocalFile.toAbsoluteLocation({ path, root });

      // Ensure the file exists.
      if (!(await node.exists(path))) {
        const error: t.IFsError = {
          type: 'FS/read',
          message: `A file with the URI [${uri}] does not exist.`,
          path,
        };
        return { ok: false, status: 404, uri, error };
      }

      // Load the file.
      try {
        const data = await node.readFile(path);
        const bytes = data.byteLength;
        const file: t.IFsFileData = {
          path,
          location,
          data,
          bytes,
          get hash() {
            return Schema.Hash.sha256(data);
          },
        };
        return { ok: true, status: 200, uri, file };
      } catch (err) {
        const error: t.IFsError = {
          type: 'FS/read',
          message: `Failed to write file at URI [${uri}]. ${err.message}`,
          path,
        };
        return { ok: false, status: 500, uri, error };
      }
    },

    /**
     * Write to the local file-system.
     */
    async write(uri: string, data: Uint8Array): Promise<t.IFsWriteLocal> {
      if (!data) {
        throw new Error(`Cannot write, no data provided.`);
      }

      uri = (uri || '').trim();
      const path = fs.resolve(uri).path;
      const location = LocalFile.toAbsoluteLocation({ path, root });
      const bytes = data.byteLength;
      const file: t.IFsFileData = {
        path,
        location,
        data,
        bytes,
        get hash() {
          return Schema.Hash.sha256(data);
        },
      };

      try {
        await node.ensureDir(node.dirname(path));
        await node.writeFile(path, data);
        return { uri, ok: true, status: 200, file };
      } catch (err) {
        const error: t.IFsError = {
          type: 'FS/write',
          message: `Failed to write [${uri}]. ${err.message}`,
          path,
        };
        return { ok: false, status: 500, uri, file, error };
      }
    },

    /**
     * Delete from the local file-system.
     */
    async delete(uri: string | string[]): Promise<t.IFsDeleteLocal> {
      const uris = (Array.isArray(uri) ? uri : [uri]).map((uri) => (uri || '').trim());
      const paths = uris.map((uri) => fs.resolve(uri).path);
      const locations = paths.map((path) => LocalFile.toAbsoluteLocation({ path, root }));

      try {
        await Promise.all(paths.map((path) => node.remove(path)));
        return { ok: true, status: 200, uris, locations };
      } catch (err) {
        const error: t.IFsError = {
          type: 'FS/delete',
          message: `Failed to delete [${uri}]. ${err.message}`,
          path: paths.join(','),
        };
        return { ok: false, status: 500, uris, locations, error };
      }
    },

    /**
     * Copy a file.
     */
    async copy(sourceUri: string, targetUri: string): Promise<t.IFsCopyLocal> {
      const format = (input: string) => {
        const uri = (input || '').trim();
        const path = fs.resolve(uri).path;
        return { uri, path };
      };

      const source = format(sourceUri);
      const target = format(targetUri);

      const done = (status: number, error?: t.IFsError) => {
        const ok = isOK(status);
        return { ok, status, source: source.uri, target: target.uri, error };
      };

      try {
        await node.ensureDir(node.dirname(target.path));
        await node.copyFile(source.path, target.path);
        return done(200);
      } catch (err) {
        const message = `Failed to copy from [${source.uri}] to [${target.uri}]. ${err.message}`;
        const error: t.IFsError = {
          type: 'FS/copy',
          message,
          path: target.path,
        };
        return done(500, error);
      }
    },
  };

  return fs;
}