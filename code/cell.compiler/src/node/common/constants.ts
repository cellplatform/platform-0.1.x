import { fs } from './libs';

const CONFIG = {
  parent: () => undefined,
  name: '',
  dir: 'dist',
  mode: 'production',
  port: 3000,
  target: 'web',
  entry: {},
};

export const PATH = {
  cachedir: fs.resolve('./node_modules/.cache/cell.compiler'),
};

export const FILE = {
  JSON: { INDEX: 'index.json' },
  JS: {
    REMOTE_ENTRY: 'remoteEntry.js',
    ENTRY: {
      WEB: 'index.html',
      NODE: 'main.js',
    },
  },
};

const WEBPACK = { rules: [], plugins: [] };
export const DEFAULT = {
  CONFIG,
  WEBPACK,
  BASE: 'base', // Base confirmation name.
  FILE,
};
