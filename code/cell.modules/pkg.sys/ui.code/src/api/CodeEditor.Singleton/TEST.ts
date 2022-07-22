import { expect, is, Test } from '../../test';
import { rx, t } from '../common';
import { CodeEditor } from '..';
import { staticPaths } from '../Configure/Configure.paths';

export default Test.describe.only('CodeEditor.Singleton', (e) => {
  e.it('start', () => {
    const bus = rx.bus();
    const res1 = CodeEditor.start(bus);
    const res2 = CodeEditor.start(bus);
    const res3 = CodeEditor.start(rx.bus());

    expect(res1.id).to.eql(rx.bus.instance(bus));
    expect(res2).to.equal(res1);
    expect(res3).to.not.equal(res1); // NB: Different instance created with new bus.
  });

  e.it('status: not initialized', async () => {
    const bus = rx.bus();
    const events = CodeEditor.start(bus);
    const defaultPaths = staticPaths();

    const res = await events.status.get({ timeout: 10 });

    expect(res.error).to.eql(undefined);
    expect(res.info?.initialized).to.eql(false);
    expect(res.info?.paths).to.eql(defaultPaths);
  });

  e.describe('init', (e) => {
    e.it('initialize with "staticRoot" value', async () => {
      const bus = rx.bus();
      const events = CodeEditor.start(bus);

      const staticRoot = 'https://foo.com/path///';
      const res = await events.init.fire({ staticRoot });

      expect(res.info?.paths.vs).to.eql('https://foo.com/path/static/vs');
      expect(res.info?.paths.types.es).to.eql('https://foo.com/path/static/types.d/lib.es');
      expect(res.info?.paths.types.sys).to.eql('https://foo.com/path/static/types.d/lib.sys');

      const info = (await events.status.get()).info;
      expect(res.info).to.eql(info); // NB: Same as retrieved status.

      console.log('res', res);
    });
  });
});