import { ERROR, expect, fs, R, testFetch, TYPE_DEFS, t } from '../test';
import { TypeSystem } from '..';
import { TypeClient } from '.';

describe('TypeClient', () => {
  const fetch = testFetch({ defs: TYPE_DEFS });

  it('TypeSystem.Type === TypeClient', () => {
    expect(TypeSystem.Type).to.equal(TypeClient);
  });

  describe('load', () => {
    it('"ns:foo"', async () => {
      const res = await TypeClient.load({ ns: 'ns:foo', fetch });
      expect(res.uri).to.eql('ns:foo');
      expect(res.typename).to.eql('MyRow');
      expect(res.errors).to.eql([]);
      expect(res.columns.map(c => c.column)).to.eql(['A', 'B', 'C']);
    });

    it('"foo" (without "ns:" prefix)', async () => {
      const res = await TypeClient.load({ ns: 'foo', fetch });
      expect(res.uri).to.eql('ns:foo');
      expect(res.typename).to.eql('MyRow');
      expect(res.errors).to.eql([]);
      expect(res.columns.map(c => c.column)).to.eql(['A', 'B', 'C']);
    });
  });

  describe('errors', () => {
    it('error: malformed URI', async () => {
      const type = await TypeClient.load({ ns: 'ns:not-valid', fetch });
      expect(type.ok).to.eql(false);
      expect(type.errors.length).to.eql(1);
      expect(type.errors[0].message).to.include(`invalid "ns" identifier`);
      expect(type.errors[0].type).to.eql(ERROR.TYPE.DEF);
    });

    it('error: not a "ns" uri', async () => {
      const type = await TypeClient.load({ ns: 'cell:foo!A1', fetch });
      expect(type.ok).to.eql(false);
      expect(type.errors.length).to.eql(1);
      expect(type.errors[0].message).to.include(`Must be "ns"`);
      expect(type.errors[0].type).to.eql(ERROR.TYPE.DEF);
    });

    it('error: failure while loading', async () => {
      const fetch = testFetch({
        defs: TYPE_DEFS,
        before: e => {
          throw new Error('Derp!');
        },
      });
      const type = await TypeClient.load({ ns: 'foo', fetch });
      expect(type.ok).to.eql(false);
      expect(type.errors.length).to.eql(1);
      expect(type.errors[0].message).to.include(`Failed while loading type for`);
      expect(type.errors[0].message).to.include(`Derp!`);
      expect(type.errors[0].type).to.eql(ERROR.TYPE.DEF);
    });

    it('error: 404 type definition not found', async () => {
      const type = await TypeClient.load({ ns: 'foo.no.exist', fetch });
      expect(type.ok).to.eql(false);
      expect(type.errors.length).to.eql(1);
      expect(type.errors[0].message).to.include(`does not exist`);
      expect(type.errors[0].type).to.eql(ERROR.TYPE.DEF_NOT_FOUND);
    });

    it('error: 404 type definition in column reference not found', async () => {
      const defs = R.clone(TYPE_DEFS);
      delete defs['ns:foo.color']; // NB: Referenced type ommited.

      const fetch = testFetch({ defs });
      const type = await TypeClient.load({ ns: 'foo', fetch });

      expect(type.ok).to.eql(false);
      expect(type.errors.length).to.eql(1);

      expect(type.errors[0].message).to.include(`The referenced type in column 'C'`);
      expect(type.errors[0].message).to.include(`could not be read`);
      expect(type.errors[0].type).to.eql(ERROR.TYPE.REF);
    });

    it('error: circular-reference (ns.implements self)', async () => {
      const defs = R.clone(TYPE_DEFS);
      const ns = 'ns:foo';
      const t = defs[ns].ns.type;
      if (t) {
        t.implements = ns; // NB: Implement self.
      }
      const type = await TypeClient.load({ ns, fetch: testFetch({ defs }) });

      expect(type.ok).to.eql(false);
      expect(type.errors.length).to.eql(1);
      expect(type.errors[0].message).to.include(`cannot implement itself (circular-ref)`);
      expect(type.errors[0].type).to.eql(ERROR.TYPE.CIRCULAR_REF);
    });

    it('error: circular-reference (column, self)', async () => {
      const defs = R.clone(TYPE_DEFS);
      const columns = defs['ns:foo'].columns || {};
      const ns = 'ns:foo';
      if (columns.C?.props?.prop) {
        columns.C.props.prop.type = `${ns}`;
      }
      const type = await TypeClient.load({ ns, fetch: testFetch({ defs }) });

      expect(type.ok).to.eql(false);
      expect(type.errors.length).to.eql(1);
      expect(type.errors[0].message).to.include(`The referenced type in column 'C'`);
      expect(type.errors[0].message).to.include(`contains a circular reference`);
      expect(type.errors[0].type).to.eql(ERROR.TYPE.CIRCULAR_REF);
    });

    it('error: circular-reference (column, within ref)', async () => {
      const defs = {
        'ns:foo.one': {
          ns: { type: { typename: 'One' } },
          columns: {
            A: { props: { prop: { name: 'two', type: 'ns:foo.two' } } },
          },
        },
        'ns:foo.two': {
          ns: { type: { typename: 'Two' } },
          columns: {
            A: { props: { prop: { name: 'two', type: 'ns:foo.one' } } },
          },
        },
      };
      const ns = 'ns:foo.one';
      const type = await TypeClient.load({ ns, fetch: testFetch({ defs }) });

      expect(type.ok).to.eql(false);
      expect(type.errors.length).to.eql(1);
      expect(type.errors[0].type).to.eql(ERROR.TYPE.CIRCULAR_REF);
    });
  });

  describe('types', () => {
    it('empty: (no types / no columns)', async () => {
      const test = async (defs: { [key: string]: t.ITypeDefPayload }, length: number) => {
        const fetch = testFetch({ defs });
        const res = await TypeClient.load({ ns: 'foo', fetch });
        expect(res.columns.length).to.eql(length);
      };

      const defs1 = R.clone(TYPE_DEFS);
      const defs2 = R.clone(TYPE_DEFS);

      delete defs1['ns:foo'].columns;
      defs2['ns:foo'].columns = {};

      await test(TYPE_DEFS, 3);
      await test(defs1, 0);
      await test(defs2, 0);
    });

    describe('types: REF', () => {
      it('REF object-type, n-level deep ("ns:xxx")', async () => {
        const fetch = testFetch({ defs: TYPE_DEFS });
        const res = await TypeClient.load({ ns: 'foo', fetch });

        const A = res.columns[0];
        const B = res.columns[1];
        const C = res.columns[2];

        expect(A.type.kind).to.eql('VALUE');
        expect(A.type.typename).to.eql('string');

        expect(B.type.kind).to.eql('VALUE');
        expect(B.type.typename).to.eql('boolean');

        expect(C.type.kind).to.eql('REF');
        expect(C.type.typename).to.eql('MyColor');

        if (C.type.kind === 'REF') {
          expect(C.type.kind).to.eql('REF');
          expect(C.type.uri).to.eql('ns:foo.color');
        }
      });

      it('REF optional property', async () => {
        const fetch = testFetch({ defs: TYPE_DEFS });
        const res = await TypeClient.load({ ns: 'foo', fetch });

        const A = res.columns[0];
        const B = res.columns[1];
        const C = res.columns[2];

        expect(A.prop).to.eql('title');
        expect(B.prop).to.eql('isEnabled');
        expect(C.prop).to.eql('color');

        expect(A.optional).to.eql(false);
        expect(B.optional).to.eql(false);
        expect(C.optional).to.eql(true);
      });

      it.skip('REF array (2..n references)', () => {}); // tslint:disable-line

      it.skip('REF => VALUE/ENUM (column URI)', () => {}); // tslint:disable-line
    });

    it.skip('array types', () => {
      //
    });

    it.skip('primitives (string | number | boolean | null | undefined)', async () => {
      // export type Json = string | number | boolean | null | undefined ;
    });
  });

  describe('typescript', () => {
    describe('declaration', () => {
      it('toString: with header (default)', async () => {
        const def = await TypeClient.load({ ns: 'foo', fetch });
        const res = TypeClient.typescript(def).toString();

        expect(res).to.include('Generated by');
        expect(res).to.include('"ns:foo"');
        expect(res).to.include('export declare type MyRow');
        expect(res).to.include('export declare type MyColor');
      });

      it('toString: no header', async () => {
        const def = await TypeClient.load({ ns: 'foo', fetch });
        const res = TypeClient.typescript(def, { header: false }).toString();

        expect(res).to.not.include('Generated by');
        expect(res).to.include('export declare type MyRow');
        expect(res).to.include('export declare type MyColor');
      });
    });

    describe('save file (.d.ts)', () => {
      const fetch = testFetch({ defs: TYPE_DEFS });

      it('save for local tests', async () => {
        const def = await TypeClient.load({ ns: 'foo', fetch });
        const ts = TypeClient.typescript(def);
        const dir = fs.join(__dirname, '../test/.d.ts');
        await ts.save(fs, dir);
      });

      it('dir (filename inferred from type)', async () => {
        const def = await TypeClient.load({ ns: 'foo', fetch });
        const ts = TypeClient.typescript(def);
        const dir = fs.resolve('tmp/d');
        const res = await ts.save(fs, dir);

        expect(res.path.endsWith('/d/MyRow.d.ts')).to.eql(true);
        expect(res.data).to.eql(ts.declaration); // NB: same as `ts.toString()`

        const file = await fs.readFile(fs.join(dir, 'MyRow.d.ts'));
        expect(file.toString()).to.eql(ts.toString()); // NB: same as `ts.declaration`
      });

      it('filename (explicit)', async () => {
        const def = await TypeClient.load({ ns: 'foo', fetch });
        const ts = TypeClient.typescript(def);

        const dir = fs.resolve('tmp/d');
        const res1 = await ts.save(fs, dir, { filename: 'Foo.txt' }); // NB: ".d.ts" automatically added.
        const res2 = await ts.save(fs, dir, { filename: 'Foo.d.ts' });

        expect(res1.path.endsWith('/d/Foo.txt.d.ts')).to.eql(true);
        expect(res2.path.endsWith('/d/Foo.d.ts')).to.eql(true);

        const file1 = await fs.readFile(fs.join(dir, 'Foo.txt.d.ts'));
        const file2 = await fs.readFile(fs.join(dir, 'Foo.d.ts'));

        expect(file1.toString()).to.eql(ts.toString());
        expect(file2.toString()).to.eql(ts.toString());
      });
    });
  });
});
