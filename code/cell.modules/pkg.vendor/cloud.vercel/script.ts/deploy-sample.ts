import { Vercel, t } from 'vendor.cloud.vercel/lib/node';

const token = process.env.VERCEL_TEST_TOKEN;

/**
 * https://vercel.com/docs/cli#project-configuration/routes
 *
 * Route regex:
 *    https://www.npmjs.com/package/path-to-regexp
 *
 */
async function deploy(team: string, project: string, dir: string, alias?: string) {
  const beforeUpload: t.VercelHttpBeforeFileUpload = async (e) => {
    if (e.path.endsWith('main.js')) {
      e.modify('console.log("hello");');
    }
  };

  const deployment = Vercel.Deploy({ token, dir, team, project, beforeUpload });
  const info = await deployment.info();

  console.log();
  console.log('deploying:');
  console.log(' • size:  ', info.files.toString());
  console.log(' • alias: ', alias);
  console.log();

  const res = await deployment.commit(
    {
      target: alias ? 'production' : 'staging',
      regions: ['sfo1'],
      alias,
      // routes: [{ src: '/foo', dest: '/' }],
    },
    { ensureProject: true },
  );

  const status = res.status;
  const name = res.deployment.name;

  console.log(res.deployment);
  console.log('-------------------------------------------');
  console.log(status);
  console.log(name);
  if (res.error) console.log('error', res.error);
  console.log();

  return { status, name };
}

// DEV
// deploy('tdb', 'db-dev', 'dist/node', 'dev.db.team');
deploy('tdb', 'db-dev', 'dist/node');