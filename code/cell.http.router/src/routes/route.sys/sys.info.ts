import { constants, fs, routes, t, id, defaultValue, Schema } from '../common';

/**
 * Root information.
 */
export function init(args: { router: t.IRouter; name?: string; deployedAt?: number }) {
  const { router } = args;

  /**
   * GET: /, /.sys
   */
  router.get(routes.SYS.INFO, async (req) => {
    const NOW_REGION = fs.env.value('NOW_REGION');
    const region = NOW_REGION ? `cloud:${NOW_REGION}` : 'local:device';

    const name = args.name || 'Untitled';
    const deployedAt = args.deployedAt;
    const system = constants.getSystem().system;
    const host = req.headers.host || '-';

    const data: t.IResGetSysInfo = {
      name,
      host,
      system,
      region,
      deployedAt,
    };
    data.hash = Schema.hash.sha256(data);

    return { status: 200, data };
  });

  /**
   * GET: /uid
   */
  router.get(routes.SYS.UID, async (req) => {
    const query = req.query as t.IReqQuerySysUid;
    const length = Math.min(100, defaultValue(query.total, 10));
    const ids = Array.from({ length }).map(() => id.cuid());
    const data: t.IResGetSysUid = ids;
    return { status: 200, data };
  });
}
