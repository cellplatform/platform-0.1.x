import { filter } from 'rxjs/operators';

import { constants, log, micro, t, util, value } from './common';
import * as router from './router';
import { prepareResponse } from './server.global';

export { Config } from './config';
export { logger } from './logger';

const { PKG } = constants;

/**
 * Initializes a new server instance.
 */
export function init(args: {
  db: t.IDb;
  fs: t.IFileSystem;
  title?: string;
  deployedAt?: number | string;
  // log?: Array<'ROUTES'>;
  logger?: t.ILog;
  prod?: boolean;
}) {
  const { db, title, fs } = args;
  const logger = args.logger || log;
  // const logTypes = args.log || [];
  const base = util.fs.resolve('.');
  const root = fs.root.startsWith(base) ? fs.root.substring(base.length) : fs.root;
  const deployedAt =
    typeof args.deployedAt === 'string' ? value.toNumber(args.deployedAt) : args.deployedAt;

  // Log uncaught exceptions.
  process.on('uncaughtException', err => {
    logger.error('UNCAUGHT EXCEPTION');
    logger.error(err.message);
    logger.info();
  });

  // Setup the micro-service.
  const deps = PKG.dependencies || {};
  const app = micro.init({
    cors: true,
    logger,
    log: {
      module: `${log.white(PKG.name)}@${PKG.version}`,
      schema: log.green(deps['@platform/cell.schema']),
      fs: `[${fs.type === 'LOCAL' ? 'local' : fs.type}]${root}`,
    },
  });

  // Routes.
  router.init({
    title,
    db,
    fs,
    router: app.router,
    deployedAt,
  });

  // Make common checks/adjustments to responses
  // before they are sent over the wire.
  app.response$.subscribe(prepareResponse);

  // Finish up.
  return app;
}
