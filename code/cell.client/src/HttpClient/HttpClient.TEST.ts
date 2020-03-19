import { expect, Http, t } from '../test';
import { HttpClient } from '..';

/**
 * NOTE:
 *    Tests aginst the actual service using this client
 *    can be found in the [cell.http] module.
 */

describe('client', () => {
  describe('create', () => {
    it('parses host => origin', () => {
      const test = (host: string | number, expected: string) => {
        const res = HttpClient.create(host);
        expect(res.origin).to.eql(expected);
      };

      test(80, 'http://localhost');
      test(1234, 'http://localhost:1234');
      test('1234', 'http://localhost:1234');
      test('localhost:8080', 'http://localhost:8080');
      test('https://localhost:8080', 'http://localhost:8080');

      test('https://domain.com', 'https://domain.com');
      test('https://domain.com:1234', 'https://domain.com:1234');
      test('domain.com:1234', 'https://domain.com:1234');
    });

    it('takes host from object', () => {
      const client = HttpClient.create({ host: 1234 });
      expect(client.origin).to.eql('http://localhost:1234');
    });

    it('uses given [IHttp] client', () => {
      const http = Http.create({ headers: { foo: 'hello' } });
      const client = HttpClient.create({ http });
      const clientHttp = (client as any).http as t.IHttp;
      expect(clientHttp).to.equal(http);
      expect(clientHttp.headers.foo).to.eql('hello');
    });
  });

  it('client.ns', () => {
    const uri = 'ns:foo';
    const client = HttpClient.create();
    const ns = client.ns(uri);
    expect(ns.toString()).to.eql(uri);
  });

  it('client.ns (without "ns:" prefix)', () => {
    const client = HttpClient.create();
    const ns = client.ns('foo');
    expect(ns.toString()).to.eql('ns:foo'); // NB: prepended with "ns:"
  });

  it('client.cell', () => {
    const uri = 'cell:foo!A1';
    const client = HttpClient.create();
    const cell = client.cell(uri);
    expect(cell.toString()).to.eql(uri);
  });

  it('client.file', () => {
    const uri = 'file:foo:123';
    const client = HttpClient.create();
    const file = client.file(uri);
    expect(file.toString()).to.eql(uri);
  });
});
