import { VercelHttp } from '.';
import { DEFAULT, expect, nodefs, Http, Filesystem, rx } from '../test';
import { util } from './common';

/**
 * See:
 *    https://vercel.com/docs/api#endpoints
 */
describe('VercelHttp', function () {
  const token = process.env.VERCEL_TEST_TOKEN ?? '';
  const http = Http.create();

  const bus = rx.bus();
  const store = Filesystem.Controller({ bus, driver: nodefs.resolve('dist') });
  const fs = store.fs();

  describe('util', () => {
    it('toUrl', () => {
      expect(util.toUrl(12, '  teams  ')).to.eql('https://api.vercel.com/v12/teams');
      expect(util.toUrl(12, 'teams?123')).to.eql('https://api.vercel.com/v12/teams'); // NB: Strips query-string.
    });

    it('toUrl: query', () => {
      type Q = Record<string, string | number | undefined>;

      const test = (query: Q, expected: string) => {
        const res = util.toUrl(12, 'projects', query);
        expect(res).to.eql(`${'https://api.vercel.com/v12/projects'}${expected}`);
      };

      test({}, '');
      test({ teamId: 'foo' }, '?teamId=foo');
      test({ teamId: 'foo', foo: 123 }, '?teamId=foo&foo=123');

      test({ teamId: undefined }, '');
      test({ teamId: undefined, foo: 123 }, '?foo=123');
    });

    it('toCtx', () => {
      const token = 'abc123';
      const res1 = util.toCtx(fs, http, token);
      const res2 = util.toCtx(fs, http, token, 1234);

      expect(res1.token).to.eql(token);
      expect(res1.Authorization).to.eql(`Bearer ${token}`);
      expect(res1.headers.Authorization).to.eql(res1.Authorization);
    });

    it('toCtx: ctx.url', () => {
      const token = 'abc123';
      const res1 = util.toCtx(fs, http, token);
      const res2 = util.toCtx(fs, http, token, 1234);

      expect(res1.url(1, 'foo')).to.match(new RegExp(`\/v1\/foo$`));
      expect(res1.url(1, 'foo', { bar: 123 })).to.match(/\/foo\?bar=123$/);

      expect(res2.url(1234, 'foo')).to.match(/\/v1234\/foo$/);
      expect(res2.url(456, 'foo', undefined)).to.match(/\/v456\/foo$/);
    });
  });

  it('not authorized', async () => {
    const token = 'abc123';
    const client = VercelHttp({ fs, token });
    const res = await client.teams.list();

    expect(res.ok).to.eql(false);
    expect(res.status).to.eql(403);
    expect(res.error?.code).to.eql('forbidden');
    expect(res.error?.message).to.include('Not authorized');
  });

  it('intercept http', async () => {
    const http = Http.create();
    // const token = 'abc123';
    const client = VercelHttp({ fs, http, token });

    // type HttpLog = { status: number; method: t.HttpMethod; body: t.Json };
    // const after: HttpLog[] = [];

    http.$.subscribe((e) => {
      // console.log('e', e);
    });

    http.res$.subscribe((e) => {
      console.log('-------------------------------------------');
      console.log('🌳 (intercept)', e.method, e.status, e.url);

      // console.log(e.response.json);
      // const { status, method } = e;
      // const body = e.response.json;
      // after.push({ status, method, body });
    });

    const res = await client.teams.list();

    console.log('-------------------------------------------');
    console.log(
      'res',
      res.teams.map((e) => e.name),
    );

    // client.
  });
});
