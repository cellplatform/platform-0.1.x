import { ts } from '../ts.def';
import { ERROR, R, Schema, t, constants, defaultValue } from './common';
import { fetcher } from './util';

type ITypeClientArgs = {
  ns: string; // "ns:<uri>"
  fetch: t.ISheetFetcher;
};

const fromClient = (client: string | t.IHttpClient) => {
  const fetch = fetcher.fromClient({ client });
  return {
    create: (ns: string) => TypeClient.create({ fetch, ns }),
    load: (ns: string) => TypeClient.load({ fetch, ns }),
  };
};

/**
 * The type-system for a namespace.
 */
export class TypeClient implements t.ITypeClient {
  public static create = (args: ITypeClientArgs) => new TypeClient(args) as t.ITypeClient;
  public static load = (args: ITypeClientArgs) => TypeClient.create(args).load();
  public static client = fromClient;

  /**
   * [Lifecycle]
   */
  private constructor(args: ITypeClientArgs) {
    const ns = args.ns.includes(':') ? args.ns : `ns:${args.ns}`;
    // const ns = args.ns;
    const uri = Schema.uri.parse<t.INsUri>(ns);

    if (uri.error) {
      const message = `Invalid namespace URI (${args.ns}). ${uri.error.message}`;
      this.error(message);
    }
    if (uri.parts.type !== 'NS') {
      const message = `Invalid namespace URI. Must be "ns", given: [${args.ns}]`;
      this.error(message);
    }

    this.uri = uri.toString();
    this.fetch = args.fetch;
  }

  /**
   * [Fields]
   */
  private readonly fetch: t.ISheetFetcher;
  public readonly uri: string;
  public typename: string;
  public errors: t.IError[] = [];
  public types: t.ITypeDef[] = [];

  /**
   * [Properties]
   */
  public get ok() {
    return this.errors.length === 0;
  }

  /**
   * [Methods]
   */

  public async load(): Promise<t.ITypeClient> {
    const self = this as t.ITypeClient;
    if (!this.ok) {
      return self;
    }
    this.errors = []; // NB: Reset any prior errors.

    // Retrieve namespace.
    const ns = this.uri;
    const columnsResponse = await this.fetch.getColumns({ ns });
    const { columns } = columnsResponse;

    if (columnsResponse.error) {
      this.error(columnsResponse.error.message);
      return self;
    }

    const typeResponse = await this.fetch.getType({ ns });
    if (typeResponse.error) {
      this.error(typeResponse.error.message);
      return self;
    }

    // Parse type details.
    this.typename = (typeResponse.type?.typename || '').trim();
    this.types = await this.readColumns({ columns });

    // Finish up.
    return this;
  }

  public typescript(args: t.ITypeClientTypescriptArgs = {}) {
    const typename = this.typename;
    const types = this.types;
    const header = defaultValue(args.header, true) ? this.typescriptHeader() : undefined;
    return ts.toDeclaration({ typename, types, header });
  }
  private typescriptHeader() {
    return `
/**
 * Generated by [${constants.PKG.name}] for CellOS namespace:
 * 
 *      ${this.uri}
 * 
 * Notes: 
 * 
 *    - Do NOT manually edit this file.
 *    - Do check this file into source control.
 *    - Import the [.d.ts] file within your consuming module
 *      that uses [TypedSheet]'s to operate on the namespace
 *      programatically with strong-typing.
 * 
 */`.substring(1);
  }

  public save(fs: t.IFs) {
    const typescript = async (dir: string, options: { filename?: string } = {}) => {
      const data = this.typescript();

      // Prepare paths.
      await fs.ensureDir(dir);
      let path = fs.join(dir, options.filename || this.typename);
      path = path.endsWith('.d.ts') ? path : `${path}.d.ts`;

      // Save file.
      await fs.writeFile(path, data);
      return { path, data };
    };

    return { typescript };
  }

  /**
   * [Internal]
   */

  private error(message: string, options: { errorType?: string; children?: t.IError[] } = {}) {
    const type = options.errorType || ERROR.TYPE.NS;
    const children = options.children;
    const error: t.IError = { message, type, children };
    this.errors.push(error);
    return error;
  }

  private async readColumns(args: { columns: t.IColumnMap }): Promise<t.ITypeDef[]> {
    const wait = Object.keys(args.columns)
      .map(column => ({
        column,
        prop: args.columns[column]?.props?.prop as t.CellTypeProp,
      }))
      .filter(({ prop }) => Boolean(prop))
      .map(async ({ column, prop }) => {
        const { name, target } = prop;
        const type = (prop.type || '').trim();
        const res: t.ITypeDef = { column, prop: name, type, target };
        return type.startsWith('=') ? this.readRef(res) : res;
      });
    return R.sortBy(R.prop('column'), await Promise.all(wait));
  }

  private async readRef(def: t.ITypeDef): Promise<t.ITypeDef> {
    const { type } = def;
    if (typeof type === 'object' || !type.startsWith('=')) {
      return def;
    }

    const ns = type.substring(1);
    if (!Schema.uri.is.ns(ns)) {
      const err = `The referenced type in column '${def.column}' is not a namespace.`;
      this.error(err);
      return def;
    }

    // Retrieve the referenced namespace.
    const fetch = this.fetch;
    const nsType = await TypeClient.load({ fetch, ns });
    if (!nsType.ok) {
      const msg = `The referenced type in column '${def.column}' (${ns}) could not be retrieved.`;
      const children = nsType.errors;
      const error = this.error(msg, { children, errorType: ERROR.TYPE.NS_NOT_FOUND });
      return { ...def, error };
    }

    // Build the reference.
    const { uri, typename, types: columns } = nsType;
    return { ...def, type: { uri, typename, types: columns } };
  }
}
