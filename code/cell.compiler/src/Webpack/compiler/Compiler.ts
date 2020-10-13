import { t } from '../common';
import { cell } from './Commpiler.cell';
import { bundle } from './Compiler.bundle';
import { dev } from './Compiler.dev';
import { upload } from './Compiler.upload';
import { watch } from './Compiler.watch';

/**
 * Webpack bundler.
 */
export const Compiler: t.WebpackCompiler = {
  upload,
  bundle,
  watch,
  dev,
  cell,
};
