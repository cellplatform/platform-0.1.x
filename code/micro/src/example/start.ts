import { micro } from '..';
import { log } from '../common';

const PKG = require('../../package.json') as { name: string; version: string };

const app = micro.init({
  cors: true,
  log: { package: log.white(PKG.name), version: PKG.version },
});

app.router
  .get('/foo', async req => {
    log.info('GET', req.url);
    return {
      status: 200,
      headers: { 'x-foo': 'hello' },
      data: { message: 'hello' },
    };
  })
  .post('/foo', async req => {
    type MyBody = { foo: string | number };
    const body = await req.body.json<MyBody>({ default: { foo: 'DEFAULT_VALUE' } });
    log.info('POST', req.url, body);
    return { data: { method: req.method, body } };
  });

(async () => {
  const service = await app.listen({ port: 8080 });

  log.info('service:');
  log.info('- isRunning:', service.isRunning);
  log.info('- port:     ', service.port);
  log.info();

  // Example: stop the service.
  // setTimeout(() => service.close(), 1500);
})();
