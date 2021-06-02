import { ENV, paths } from './constants';
import { fs, Uri } from './libs';
import { IConfigFile } from './types';

/**
 * Configuration data.
 */
export class ConfigFile {
  public static path = paths.data({ prod: ENV.isProd }).config;

  public static default(): IConfigFile {
    const { name, version } = ENV.pkg;
    const createdBy = `${name}@${version}`;
    return {
      createdBy,
      refs: { genesis: Uri.toNs().toString() },
    };
  }

  public static async read(): Promise<IConfigFile> {
    const path = ConfigFile.path;

    let file = await fs.file.loadAndParse<IConfigFile>(path);
    if (file) return file;

    file = ConfigFile.default();
    await ConfigFile.write(file);
    return file;
  }

  public static write(data: IConfigFile) {
    const path = ConfigFile.path;
    return fs.file.stringifyAndSave<IConfigFile>(path, data);
  }
}
