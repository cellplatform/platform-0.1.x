import { expect } from '../test';
import { Mime } from '.';

describe('Mime', () => {
  it('toType', () => {
    const test = (input: string, expected: string) => {
      const res = Mime.toType(input);
      expect(res).to.eql(expected);
    };

    test('foo.yml', 'text/plain');
    test('foo.yaml', 'text/plain');
    test('foo.txt', 'text/plain');

    test('foo.css', 'text/css');
    test('foo.jpg', 'image/jpeg');
    test('foo.jpeg', 'image/jpeg');
    test('foo.gif', 'image/gif');

    test('  foo.js  ', 'application/javascript'); // NB: whitespace.
    test('foo.js', 'application/javascript');
    test('foo.json', 'application/json');
  });

  it('isBinary | isText | isJson', () => {
    const test = (input: string, isBinary: boolean, isText: boolean, isJson: boolean) => {
      expect(Mime.isBinary(input)).to.eql(isBinary);
      expect(Mime.isText(input)).to.eql(isText);
      expect(Mime.isJson(input)).to.eql(isJson);
    };

    test('text/plain', false, true, false);
    test('text/css', false, true, false);
    test('text/html', false, true, false);
    test('text/javascript', false, true, false);
    test('application/javascript', false, true, false);
    test('application/json', false, true, true); // NB: json AND text.

    test('image/jpeg', true, false, false);
    test('image/png', true, false, false);
    test('application/octet-stream', true, false, false);
    test('application/pdf', true, false, false);
  });
});
