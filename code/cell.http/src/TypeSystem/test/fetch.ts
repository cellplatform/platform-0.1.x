import { TypeSystem } from '..';
import { Schema, t } from '../common';

type M = 'getType' | 'getColumns' | 'getCells';

/**
 * Generate a stub data [fetch] object using the provided
 * type-defs and cells object as source data.
 *
 * NOTE:
 *    This by-passes talking to the HTTP=>DB systems and
 *    thereby allows tests of the TypeSystem to run in a
 *    decoupled manner.
 */
export const testFetch = (data: {
  defs: { [ns: string]: t.ITypeDefPayload };
  cells?: t.ICellMap;
  before?: (args: { method: M; args: any }) => void;
}) => {
  const before = (method: M, args: any) => {
    if (data.before) {
      data.before({ method, args });
    }
  };

  const getType: t.FetchSheetType = async args => {
    before('getType', args);
    const ns = data.defs[args.ns]?.ns;
    const type = ns?.type as t.INsType;
    const exists = Boolean(type);
    return { exists, type };
  };

  const getColumns: t.FetchSheetColumns = async args => {
    before('getColumns', args);
    const def = data.defs[args.ns];
    const columns = def?.columns || {};
    return { columns };
  };

  const getCells: t.FetchSheetCells = async args => {
    before('getCells', args);
    const cells = data.cells || {};
    const rows = Schema.coord.cell.max.row(Object.keys(cells));
    const total = { rows };
    return { cells, total };
  };

  return TypeSystem.fetcher.fromFuncs({ getType, getColumns, getCells });
};

/**
 * Generate a stub data [fetch] object, to operate against an:
 *  - instance (sheet)
 *  - type-def (sheet)
 */
export const testInstanceFetch = async <T>(args: {
  instance: string;
  implements: string;
  defs: { [ns: string]: t.ITypeDefPayload };
  rows: T[];
}) => {
  const typeClient = await TypeSystem.Type.load({
    ns: args.implements,
    fetch: testFetch({ defs: args.defs }),
  });
  const cells = TypeSystem.objectToCells<T>(typeClient).rows(0, args.rows);
  const def: t.ITypeDefPayload = {
    ns: { type: { implements: args.implements } },
    columns: {},
  };
  return testFetch({
    cells,
    defs: { ...args.defs, [args.instance]: def },
  });
};
