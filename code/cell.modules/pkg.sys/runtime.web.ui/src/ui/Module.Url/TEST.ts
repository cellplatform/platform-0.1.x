import { Test, expect } from '../../test';
import { ModuleUrl } from '.';

export default Test.describe('Module.Url', (e) => {
  e.describe('parseUrl', (e) => {
    e.it('manifest: appends "/index.json" to path', () => {
      const test = (href: string, expected: string) => {
        const url = ModuleUrl.parse(href);
        expect(url.href).to.eql(expected);
        expect(url.manifest).to.eql(expected);
      };

      test('https://domain.com', 'https://domain.com/index.json');
      test('https://domain.com/', 'https://domain.com/index.json');
      test('https://domain.com///', 'https://domain.com/index.json');
      test('https://domain.com/foo', 'https://domain.com/foo/index.json');
    });

    e.it('no entry on href', () => {
      const url = ModuleUrl.parse('https://domain.com/index.json');
      expect(url.entry).to.eql(undefined);
    });

    e.it('entry on href (format path)', () => {
      const url = ModuleUrl.parse('https://domain.com/index.json?entry=foo');
      expect(url.entry).to.eql('./foo');
      expect(url.manifest).to.eql('https://domain.com/index.json');
      expect(url.href).to.eql('https://domain.com/index.json?entry=.%2Ffoo'); // NB: encoded "./" auto added.
    });

    e.it('"?entry=none" on href', () => {
      const url = ModuleUrl.parse('https://domain.com/index.json?entry=none');
      expect(url.entry).to.eql(undefined);
      expect(url.href).to.eql('https://domain.com/index.json');
      expect(url.manifest).to.eql('https://domain.com/index.json');
    });

    e.it('"?entry" on href', () => {
      const test = (query: string) => {
        const url = ModuleUrl.parse(`https://domain.com/index.json?${query}`);
        expect(url.entry).to.eql(undefined);
        expect(url.href).to.eql('https://domain.com/index.json');
        expect(url.manifest).to.eql('https://domain.com/index.json');
      };
      test('entry');
      test('entry=');
    });

    e.it('{entry} on options', () => {
      const url = ModuleUrl.parse('https://domain.com', { entry: 'foo' });
      expect(url.entry).to.eql('./foo');
      expect(url.manifest).to.eql('https://domain.com/index.json');
      expect(url.href).to.eql('https://domain.com/index.json?entry=.%2Ffoo');
    });

    e.it('{entry} on options overrides URL query string', () => {
      const url = ModuleUrl.parse('https://domain.com/index.json?entry=foo', { entry: 'bar' });
      expect(url.entry).to.eql('./bar');
      expect(url.manifest).to.eql('https://domain.com/index.json');
      expect(url.href).to.eql('https://domain.com/index.json?entry=.%2Fbar');
    });

    e.it('error', () => {
      const url = ModuleUrl.parse('https://@#&');
      expect(url.error).to.include('Failed to parse href');
      expect(url.error).to.include('"https://@#&"');
      expect(url.href).to.eql('');
      expect(url.manifest).to.eql('');
      expect(url.entry).to.eql(undefined);
    });
  });
});