import { ERROR, t, util } from '../common';
import { downloadFilePreflight } from './handler.download.preflight';

/**
 * Download an HTML file and dynamically rewrite the links.
 */
export const downloadTextFile = async (args: {
  host: string;
  db: t.IDb;
  fs: t.IFileSystem;
  fileUri: string;
  filename?: string;
  matchHash?: string;
  mime?: string;
}) => {
  const { host, db, fs, fileUri, filename, matchHash, mime = 'text/html' } = args;

  try {
    // Perform preliminary argument checks.
    const preflight = await downloadFilePreflight({ host, db, fileUri, filename, matchHash });
    const { error, file, location } = preflight;
    if (error) {
      const { status, message, type } = error;
      return util.toErrorPayload(message, { status, type });
    }
    if (!file || !location) {
      const err = `Failed to retrieve file '${filename}' (${fileUri})`;
      const type = ERROR.HTTP.NOT_FOUND;
      return util.toErrorPayload(err, { status: 404, type });
    }

    // Download the HTML file.
    const res = await fs.read(fileUri);
    const data = res.file?.data.toString();
    if (!res.ok || res.error || !data) {
      const status = res.status;
      const type = res.error ? res.error.type : ERROR.HTTP.FILE;
      const message = res.error ? res.error.message : '';
      const err = `Failed to read HTML file. ${message}`.trim();
      return util.toErrorPayload(err, { status, type });
    }

    // Finish up.
    const headers = { 'content-type': mime };
    return { status: 200, data, headers };
  } catch (err) {
    return util.toErrorPayload(err);
  }
};
