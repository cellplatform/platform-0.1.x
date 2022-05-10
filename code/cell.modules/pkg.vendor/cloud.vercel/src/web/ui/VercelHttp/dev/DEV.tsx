import React from 'react';
import { DevActions, ObjectView } from 'sys.ui.dev';

import { VercelHttp, VercelHttpProps } from '..';
import { TestUtil } from '../../../test';
import { Vercel } from '../../../Vercel';
import { css, cuid, t, value } from '../../common';
import { DevFilesystem } from '../../dev';
import { ModuleInfo } from '../../ModuleInfo';

type Ctx = {
  token: string;
  bus: t.EventBus;
  props: VercelHttpProps;
  http: t.Http;
  fs: t.Fs;
  output?: any;
};

/**
 * Actions
 */
export const actions = DevActions<Ctx>()
  .namespace('ui.VercelHttp')
  .context((e) => {
    if (e.prev) return e.prev;

    const { bus, http, token } = TestUtil;
    const fs = TestUtil.fs.events;
    TestUtil.fs.init();

    const ctx: Ctx = {
      token,
      bus,
      http,
      fs,
      props: {},
    };

    return ctx;
  })

  .init(async (e) => {
    const { ctx, bus } = e;
  })

  .items((e) => {
    e.title('Debug');

    e.button('tmp: deploy', async (e) => {
      const { http, token } = e.ctx;
      const fs = e.ctx.fs.dir('foo');
      const client = Vercel.Http({ token, fs });

      const m = await fs.manifest();
      console.log('m', m);

      console.log('-------------------------------------------');

      // const { http, fs, token } = e.ctx;
      const alias = 'tmp-deploy.db.team';

      /**
       * TODO 🐷
       * Remove need for HTTP to be passed to deploy.
       */

      /**
       * CONFIGURE
       */
      const deployment = Vercel.Deploy({
        http,
        fs,
        token,
        team: 'tdb',
        project: 'tdb-tmp-deploy',
        async beforeUpload(e) {
          console.log('beforeUpload', e);
        },
      });

      console.group('🌳 Deployment');

      const info = await deployment.info();
      console.log('info', info);
      console.log('info.size.toString()', info.files.size.toString());
      console.log('-------------------------------------------');

      /**
       * COMMIT (DEPLOY)
       */
      const res = await deployment.commit(
        {
          target: alias ? 'production' : 'staging',
          regions: ['sfo1'],
          alias,
          // routes: [{ src: '/foo', dest: '/' }],
        },
        { ensureProject: true },
      );

      /**
       * OUTPUT
       */
      const { status } = res;
      const { name, urls } = res.deployment;

      console.log('res', res);

      console.log('-------------------------------------------');
      console.log(status);
      console.log(name);
      console.log(' • ', urls.inspect);
      urls.public.forEach((url) => console.log(' • ', url));
      if (res.error) console.log('error', res.error);
      console.log();
    });

    e.hr();
  })

  .items((e) => {
    e.title('Filesystem');

    const toPath = (count: number) => {
      return count === 0 ? `foo/index.json` : `foo/my-file-${count}.json`;
    };

    e.button('add', async (e) => {
      const msg = cuid().repeat(value.random(1, 50));
      const fs = e.ctx.fs;
      const total = (await fs.manifest()).files.length;
      const path = toPath(total);
      const data = { msg, total };
      fs.json.write(path, data);
    });

    e.hr(1, 0.1);

    e.button('delete: first', async (e) => {
      const fs = e.ctx.fs;
      const first = (await fs.manifest()).files[0];
      if (first) await fs.delete(first.path);
    });

    e.button('delete: last', async (e) => {
      const fs = e.ctx.fs;
      const files = (await fs.manifest()).files;
      const last = files[files.length - 1];
      if (last) await fs.delete(last.path);
    });

    e.button('delete all (clear)', async (e) => {
      const fs = e.ctx.fs;
      const files = (await fs.manifest()).files;
      await Promise.all(files.map((file) => fs.delete(file.path)));
    });

    e.hr();

    e.component((e) => {
      const styles = {
        base: css({
          Flex: 'y-stretch-stretch',
          Margin: [20, 45, 30, 45],
        }),
      };
      return (
        <div {...styles.base}>
          <ModuleInfo style={{ marginBottom: 15 }} fields={['Module', 'Token.API']} />
          <DevFilesystem fs={TestUtil.fs.instance} />
        </div>
      );
    });

    e.hr();
  })

  .items((e) => {
    e.title('Vercel API');

    e.button('GET: /www/user', async (e) => {
      const http = e.ctx.http;

      const url = 'https://api.vercel.com/www/user';
      const res = await http.get(url);

      console.log('-------------------------------------------');
      console.log('res', res);
      console.log('res.json', res.json);

      e.ctx.output = res.json;
    });

    e.hr();

    e.component((e) => {
      return (
        <ObjectView
          name={'output'}
          data={e.ctx.output}
          style={{ MarginX: 15 }}
          fontSize={10}
          expandPaths={['$']}
          expandLevel={5}
        />
      );
    });
  })

  .subject((e) => {
    e.settings({
      host: { background: -0.04 },
      actions: { width: 400 },
      layout: {
        label: '<VercelHttp>',
        position: [150, 80],
        border: -0.1,
        cropmarks: -0.2,
        background: 1,
      },
    });
    e.render(<VercelHttp {...e.ctx.props} />);
  });

export default actions;