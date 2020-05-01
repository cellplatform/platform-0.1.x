import { constants, t } from '../common';

const SYS = constants.SYS;
const NS = SYS.NS;

type TypeDefs = { [key: string]: t.ITypeDefPayload };

export const DEFS: TypeDefs = {
  [NS.TYPE.APP]: {
    columns: {
      A: { props: { def: { prop: 'SysApp.title', type: 'string', default: 'CellOS' } } },
      B: {
        props: {
          def: {
            prop: 'SysApp.windowDefs',
            type: `${NS.TYPE.WINDOW_DEF}/SysAppWindowDef[]`,
            target: 'ref',
          },
        },
      },
      C: {
        props: {
          def: {
            prop: 'SysApp.windows',
            type: `${NS.TYPE.WINDOW}/SysAppWindow[]`,
            target: 'ref',
          },
        },
      },
    },
  },
  [NS.TYPE.WINDOW_DEF]: {
    columns: {
      A: { props: { def: { prop: 'SysAppWindowDef.kind', type: 'string', default: '' } } },
      B: { props: { def: { prop: 'SysAppWindowDef.width', type: 'number', default: 1200 } } },
      C: { props: { def: { prop: 'SysAppWindowDef.height', type: 'number', default: 800 } } },
    },
  },
  [NS.TYPE.WINDOW]: {
    columns: {
      A: { props: { def: { prop: 'SysAppWindow.id', type: 'string', default: '' } } },
      B: { props: { def: { prop: 'SysAppWindow.kind', type: 'string', default: '' } } },
      C: { props: { def: { prop: 'SysAppWindow.title', type: 'string', default: 'Untitled' } } },
      D: { props: { def: { prop: 'SysAppWindow.width', type: 'number', default: -1 } } },
      E: { props: { def: { prop: 'SysAppWindow.height', type: 'number', default: -1 } } },
      F: { props: { def: { prop: 'SysAppWindow.x', type: 'number' } } },
      G: { props: { def: { prop: 'SysAppWindow.y', type: 'number' } } },
    },
  },
};
