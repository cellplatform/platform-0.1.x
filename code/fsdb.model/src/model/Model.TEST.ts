import { filter, map } from 'rxjs/operators';
import { Model } from '.';
import { expect, getTestDb, t, time } from '../test';

type IMyThingProps = { count: number };
type IMyOrgProps = { id: string; name: string };

type IMyThing = t.IModel<IMyThingProps>;
type IMyOrgLinks = { thing: IMyThing; things: IMyThing[] };
type IMyOrgDoc = IMyOrgProps & { ref?: string; refs?: [] };

describe('model', () => {
  let db: t.IDb;
  beforeEach(async () => (db = await getTestDb({ file: false })));

  const org = {
    path: 'ORG/123',
    doc: { id: '123', name: 'MyOrg' },
    initial: { id: '', name: '' },
  };
  const createOrg = async (options: { put?: boolean } = {}) => {
    if (options.put) {
      await db.put(org.path, org.doc);
    }
    return Model.create<IMyOrgProps, IMyOrgDoc>({ db, path: org.path, initial: org.initial });
  };

  describe('typename', () => {
    it('is derived from path', async () => {
      const test = (path: string, result: string) => {
        const model = Model.create<IMyOrgProps>({ db, path, initial: org.initial });
        expect(model.typename).to.eql(result);
      };
      test('ORG', 'ORG');
      test('ORG/1', 'ORG');
      test(' ORG  /1', 'ORG');
    });

    it('is explicitly declared', async () => {
      const test = (typename: string, result: string) => {
        const model = Model.create<IMyOrgProps>({
          db,
          path: org.path,
          initial: org.initial,
          typename,
        });
        expect(model.typename).to.eql(result);
      };
      test('FOO', 'FOO');
      test('  FOO  ', 'FOO');
    });
  });

  describe('load', () => {
    it('not loaded → load → loaded', async () => {
      const model = Model.create<IMyOrgProps>({
        db,
        path: org.path,
        initial: org.initial,
        load: false,
      });

      // Not loaded yet.
      expect(model.path).to.eql(org.path);
      expect(model.exists).to.eql(undefined);
      expect(model.isLoaded).to.eql(false);
      expect(model.isChanged).to.eql(false);
      expect(model.toObject()).to.eql({});

      // Load while there is no data for the model in the DB.
      await model.load();
      expect(model.isLoaded).to.eql(true);
      expect(model.exists).to.eql(false);
      expect(model.doc).to.eql({});
      expect(model.toObject()).to.eql({}); // NB: Default empty object, even though no backing data yet.

      // Load again, with data in DB, but not `force` reload.
      await db.put(org.path, org.doc);
      await model.load();
      expect(model.isLoaded).to.eql(true);
      expect(model.exists).to.eql(false);
      expect(model.doc).to.eql({});
      expect(model.toObject()).to.eql({});

      // Load again after force refresh - data actually loaded now.
      await model.load({ force: true });
      expect(model.isLoaded).to.eql(true);
      expect(model.isChanged).to.eql(false);
      expect(model.exists).to.eql(true);
      expect(model.doc).to.eql(org.doc);
      expect(model.props.id).to.eql(org.doc.id); // Strongly typed.
      expect(model.props.name).to.eql(org.doc.name); // Strongly typed.
      expect(model.toObject()).to.eql(org.doc);
    });

    it('default loading on creation', async () => {
      const model = await createOrg({ put: true });
      expect(model.isLoaded).to.eql(false);

      await time.wait(5);
      expect(model.isLoaded).to.eql(true);
      expect(model.isChanged).to.eql(false);
    });

    it('fires loaded event', async () => {
      const model = Model.create<IMyOrgProps>({
        db,
        path: org.path,
        initial: org.initial,
        load: false,
      });

      const events: t.IModelDataLoaded[] = [];
      model.events$
        .pipe(
          filter(e => e.type === 'MODEL/loaded/data'),
          map(e => e.payload as t.IModelDataLoaded),
        )
        .subscribe(e => events.push(e));

      await model.load();
      await model.load();
      await model.load();
      expect(model.exists).to.eql(false);
      expect(events.length).to.eql(1);
      expect(events[0].withLinks).to.eql(false);

      await db.put(org.path, org.doc);
      await model.load({ force: true, withLinks: true });
      expect(model.exists).to.eql(true);
      expect(events.length).to.eql(2);
      expect(events[1].withLinks).to.eql(true);
    });
  });

  describe('ready (promise)', () => {
    it('resolves promise', async () => {
      await db.put(org.path, org.doc);
      const model = Model.create<IMyOrgProps>({
        db,
        path: org.path,
        initial: org.initial,
        load: false,
      });

      let count = 0;
      model.ready.then(() => count++);
      expect(count).to.eql(0);

      await model.load();
      expect(count).to.eql(1);
    });

    it('returns immediately if already loaded', async () => {
      await db.put(org.path, org.doc);
      const model = Model.create<IMyOrgProps>({
        db,
        path: org.path,
        initial: org.initial,
        load: false,
      });
      await model.load();
      await model.ready;
      expect(model.isLoaded).to.eql(true);
    });

    it('fires after autoload', async () => {
      await db.put(org.path, org.doc);
      const model = await Model.create<IMyOrgProps>({ db, path: org.path, initial: org.initial })
        .ready;
      expect(model.isLoaded).to.eql(true);
    });
  });

  describe('system properties', () => {
    it('timestamps', async () => {
      const model = Model.create<IMyOrgProps>({
        db,
        path: org.path,
        initial: org.initial,
        load: false,
      });
      expect(model.createdAt).to.eql(-1);
      expect(model.modifiedAt).to.eql(-1);

      const now = time.now.timestamp;

      await db.put(org.path, org.doc);
      await model.load();

      expect(model.createdAt).to.be.within(now - 5, now + 10);
      expect(model.modifiedAt).to.be.within(now - 5, now + 10);

      await time.wait(50);
      await db.put(org.path, org.doc);
      await model.load({ force: true });
      expect(model.modifiedAt).to.be.within(now + 45, now + 65);
    });
  });

  describe('props (synthetic object)', () => {
    it('get', async () => {
      const model = await createOrg({ put: true });
      await model.ready;
      expect(model.props.id).to.eql(org.doc.id);
      expect(model.props.name).to.eql(org.doc.name);
    });

    it('caches [props] object', async () => {
      const model = await createOrg();
      const res1 = model.props;
      const res2 = model.props;
      expect(res1).to.equal(res2);
    });

    it('set: isChanged/changes and "changed" event', async () => {
      const model = await createOrg({ put: true });
      await model.ready;

      const events: t.ModelEvent[] = [];
      model.events$.subscribe(e => events.push(e));

      expect(model.isChanged).to.eql(false);
      expect(model.changes.length).to.eql(0);
      expect(model.changes.list).to.eql([]);
      expect(model.changes.map).to.eql({});

      const now = time.now.timestamp;
      model.props.name = 'Acme';

      expect(model.isChanged).to.eql(true);
      expect(model.changes.length).to.eql(1);

      const { list, map } = model.changes;
      expect(map).to.eql({ name: 'Acme' });
      expect(list.length).to.eql(1);
      expect(list[0].field).to.eql('name');
      expect(list[0].value.from).to.eql('MyOrg');
      expect(list[0].value.to).to.eql('Acme');
      expect(list[0].model).to.equal(model);
      expect(list[0].doc.from).to.eql(org.doc);
      expect(list[0].doc.to).to.eql({ ...org.doc, name: 'Acme' });
      expect(list[0].modifiedAt).to.be.within(now - 5, now + 10);
      expect(list[0].kind).to.eql('PROP');

      expect(events.length).to.eql(1);
      expect(events[0].payload).to.equal(model.changes.list[0]);

      model.props.name = 'Foo';

      expect(events.length).to.eql(2);
      expect(events[1].payload).to.equal(model.changes.list[1]);

      expect(model.isChanged).to.eql(true);
      expect(model.changes.length).to.eql(2);
      expect(model.changes.list.length).to.eql(2);
      expect(model.changes.map).to.eql({ name: 'Foo' });

      expect(model.doc).to.eql(org.doc); // No change to underlying doc.
    });

    it('only fires [changed] event when different value is set', async () => {
      const model = await createOrg({ put: true });
      await model.ready;

      const events: t.ModelEvent[] = [];
      model.events$.subscribe(e => events.push(e));

      model.props.name = 'foo';
      expect(events.length).to.eql(1);

      model.props.name = 'foo';
      model.props.name = 'foo';
      model.props.name = 'foo';
      expect(events.length).to.eql(1);
    });
  });

  describe('save', () => {
    it('does not save when nothing changed (but does exist in DB)', async () => {
      const model = await createOrg({ put: true });
      await model.ready;
      expect(model.exists).to.eql(true);

      const res = await model.save();
      expect(res.saved).to.eql(false);
    });

    it('saves when changed (already exists in DB)', async () => {
      const model = await createOrg({ put: true });
      await model.ready;
      expect(model.exists).to.eql(true);

      model.props.name = 'Acme';
      const changes = model.changes;

      const events: t.ModelEvent[] = [];
      model.events$.subscribe(e => events.push(e));

      expect(model.isChanged).to.eql(true);
      const res = await model.save();
      expect(res.saved).to.eql(true);
      expect(model.isChanged).to.eql(false);

      const dbValue = await db.getValue<IMyOrgProps>(org.path);
      expect(dbValue.name).to.eql('Acme');

      expect(events.length).to.eql(1);
      expect(events[0].type).to.eql('MODEL/saved');

      const e = events[0].payload as t.IModelSaved;
      expect(e.model).to.equal(model);
      expect(e.changes).to.eql(changes);
    });

    it('initial save (new instance, default values)', async () => {
      const model = await createOrg({ put: false });

      const res1 = await db.getValue<IMyOrgProps>(org.path);
      expect(res1).to.eql(undefined);

      const res2 = await model.save();
      expect(res2.saved).to.eql(true);

      const res3 = await db.getValue<IMyOrgProps>(org.path);
      expect(res3).to.eql(org.initial);
    });

    it('initial save (changed values)', async () => {
      const model = await createOrg({ put: false });

      const res1 = await db.getValue<IMyOrgProps>(org.path);
      expect(res1).to.eql(undefined);

      model.props.id = '123';
      model.props.name = 'Hello';

      expect(model.doc).to.eql({}); // Underlying doc not updated yet, pending changes only.

      const res2 = await model.save();
      expect(res2.saved).to.eql(true);

      expect(model.doc).to.eql({ id: '123', name: 'Hello' });
      expect(model.props.id).to.eql('123');
      expect(model.props.name).to.eql('Hello');

      expect((await db.getValue<IMyOrgProps>(org.path)).id).to.eql('123');
      expect((await db.getValue<IMyOrgProps>(org.path)).name).to.eql('Hello');
    });
  });

  describe('link (JOIN relationship)', () => {
    beforeEach(async () => {
      await db.putMany([
        { key: 'THING/1', value: { count: 1 } },
        { key: 'THING/2', value: { count: 2 } },
        { key: 'THING/3', value: { count: 3 } },
      ]);
    });

    const links: t.ILinkedModelDefs<IMyOrgLinks> = {
      thing: {
        relationship: '1:1',
        field: 'ref',
        create: ({ path, db }) => Model.create<IMyThingProps>({ db, path, initial: { count: -1 } }),
      },
      things: {
        relationship: '1:*',
        field: 'refs',
        create: ({ path, db }) => Model.create<IMyThingProps>({ db, path, initial: { count: -1 } }),
      },
    };

    const createLinkedOrg = async (
      options: { refs?: string[]; ref?: string; path?: string } = {},
    ) => {
      const { refs, ref, path = org.path } = options;
      await db.put(org.path, { ...org.doc, refs, ref });
      const model = Model.create<IMyOrgProps, IMyOrgDoc, IMyOrgLinks>({
        db,
        path,
        initial: org.initial,
        links,
        load: false,
      });
      return model;
    };

    it('has no links', async () => {
      const model = await createOrg();
      expect(model.links).to.eql({});
    });

    it('links: get when values exist (doc exists)', async () => {
      const model = await createLinkedOrg({
        refs: ['THING/1', 'THING/3'],
        ref: 'THING/2',
      });
      const thing = await model.links.thing;
      const things = await model.links.things;

      expect(thing.toObject()).to.eql({ count: 2 });
      expect(things.map(m => m.toObject())).to.eql([{ count: 1 }, { count: 3 }]);
    });

    it('links: get when no values exists (doc exists)', async () => {
      const model = await createLinkedOrg();
      expect(model.isLoaded).to.eql(false);

      const thing = await model.links.thing;
      const things = await model.links.things;

      expect(thing).to.eql(undefined);
      expect(things).to.eql([]);
      expect(model.isLoaded).to.eql(true);
    });

    it('links: get when underlying doc does not exist', async () => {
      const model = await createLinkedOrg({ path: 'NO_EXIST' });
      await model.load();

      expect(model.isLoaded).to.eql(true);
      expect(model.exists).to.eql(false);

      const thing = await model.links.thing;
      const things = await model.links.things;

      expect(thing).to.eql(undefined);
      expect(things).to.eql([]);
    });

    it('fires link-loaded event', async () => {
      const model = await createLinkedOrg();
      const events: t.IModelLinkLoaded[] = [];
      model.events$
        .pipe(
          filter(e => e.type === 'MODEL/loaded/link'),
          map(e => e.payload as t.IModelLinkLoaded),
        )
        .subscribe(e => events.push(e));

      await model.load();
      expect(events.length).to.eql(0);

      await model.links.thing;
      await model.links.things;

      expect(events.length).to.eql(2);
      expect(events[0].field).to.eql('thing');
      expect(events[1].field).to.eql('things');
    });

    it('caches linked model', async () => {
      const model = await createLinkedOrg({ refs: ['THING/1', 'THING/3'], ref: 'THING/2' });
      await model.load();

      const readLinks = async () => {
        return {
          thing: await model.links.thing,
          things: await model.links.things,
        };
      };

      const res1 = await readLinks();
      const res2 = await readLinks();

      expect(res1.thing.toObject()).to.eql({ count: 2 });
      expect(res1.things.map(m => m.toObject())).to.eql([{ count: 1 }, { count: 3 }]);

      expect(res1.thing).to.equal(res2.thing);
      expect(res1.things).to.equal(res2.things);

      model.reset();
      const res3 = await readLinks();

      // New instances after [reset].
      expect(res3.thing).to.not.equal(res2.thing);
      expect(res3.things).to.not.equal(res2.things);

      expect(res3.thing.toObject()).to.eql({ count: 2 });
      expect(res3.things.map(m => m.toObject())).to.eql([{ count: 1 }, { count: 3 }]);

      await model.load({ force: true });
      const res4 = await readLinks();

      // New instances after force [load].
      expect(res4.thing).to.not.equal(res3.thing);
      expect(res4.things).to.not.equal(res3.things);
    });

    it('gets links via `load` method', async () => {
      const model = await createLinkedOrg({ refs: ['THING/1', 'THING/3'], ref: 'THING/2' });

      const events: t.ModelEvent[] = [];
      model.events$.subscribe(e => events.push(e));
      expect(events.length).to.eql(0);

      await model.load({ withLinks: true });

      expect(events.length).to.eql(3);
      expect(events[0].type).to.eql('MODEL/loaded/link');
      expect(events[1].type).to.eql('MODEL/loaded/link');
      expect(events[2].type).to.eql('MODEL/loaded/data');

      expect((events[2].payload as t.IModelDataLoaded).withLinks).to.eql(true);

      const linkEvents = events as t.IModelLinkLoadedEvent[];
      expect(linkEvents[0].payload.field).to.eql('thing');
      expect(linkEvents[1].payload.field).to.eql('things');
    });

    it('change 1:1', async () => {
      const model = await createLinkedOrg();
      expect(model.changes.map).to.eql({});
      expect((await db.getValue<any>(org.path)).ref).to.eql(undefined);

      /**
       * Link
       */
      const thing = model.links.thing;
      thing.link('THING/2');
      thing.link('THING/2');
      thing.link('THING/2');

      expect(model.changes.length).to.eql(1); // Called 3-times, only one change registered.
      expect(model.isChanged).to.eql(true);
      expect(model.changes.map).to.eql({ ref: 'THING/2' });
      expect(model.changes.list[0].kind).to.eql('LINK');

      expect((await model.links.thing).path).to.eql('THING/2'); // Before save.

      await model.save();
      expect(model.isChanged).to.eql(false);

      expect((await db.getValue<any>(org.path)).ref).to.eql('THING/2');
      expect((await model.links.thing).path).to.eql('THING/2'); // After save.

      /**
       * Unlink
       */
      thing.unlink();
      thing.unlink();
      thing.unlink();

      expect(await model.links.thing).to.eql(undefined); // Immediate - before save.

      expect(model.changes.length).to.eql(1);
      expect(model.isChanged).to.eql(true);
      expect(model.changes.map).to.eql({ ref: undefined });
      expect(model.changes.list[0].kind).to.eql('LINK');

      await model.save();
      expect(model.isChanged).to.eql(false);
      expect(await model.links.thing).to.eql(undefined); // After save.

      expect((await db.getValue<any>(org.path)).ref).to.eql(undefined);

      /**
       * Switch links
       */
      thing.link('THING/2');
      expect((await model.links.thing).path).to.eql('THING/2');

      thing.link('THING/1');
      expect((await model.links.thing).path).to.eql('THING/1');

      thing.link('THING/3');
      expect((await model.links.thing).path).to.eql('THING/3');

      expect(model.changes.length).to.eql(3);

      expect((await db.getValue<any>(org.path)).ref).to.eql(undefined);
      await model.save();
      expect((await db.getValue<any>(org.path)).ref).to.eql('THING/3');
    });

    it('change 1:*', async () => {
      const model = await createLinkedOrg();
      expect(model.changes.map).to.eql({});
      expect((await db.getValue<any>(org.path)).refs).to.eql(undefined);

      /**
       * Link
       */
      const things = model.links.things;
      things.link(['THING/2']);
      things.link(['THING/2']);
      things.link(['THING/2']);

      expect(model.changes.length).to.eql(1); // Called 3-times, only one change registered.
      expect(model.isChanged).to.eql(true);
      expect(model.changes.map).to.eql({ refs: ['THING/2'] });
      expect(model.changes.list[0].kind).to.eql('LINK');

      expect((await model.links.things).map(m => m.path)).to.eql(['THING/2']);

      things.link(['THING/2', 'THING/1']); // Existing ref not duplicated. Change registered.
      expect(model.changes.length).to.eql(2);
      expect((await model.links.things).map(m => m.path)).to.eql(['THING/2', 'THING/1']);

      things.link(['THING/2', 'THING/1']); // No change.
      things.link(['THING/1', 'THING/2']); // No change.
      things.link(['THING/1']); // No change.
      things.link(['THING/2']); // No change.
      things.link([]); // No change.
      expect(model.changes.length).to.eql(2);

      things.link(['THING/3']);
      expect(model.changes.length).to.eql(3);

      /**
       * Save
       */
      expect((await db.getValue<any>(org.path)).refs).to.eql(undefined);
      expect((await model.save()).saved).to.eql(true);
      expect((await model.save()).saved).to.eql(false);
      expect((await db.getValue<any>(org.path)).refs).to.eql(['THING/2', 'THING/1', 'THING/3']);
      expect(model.doc.refs).to.eql(['THING/2', 'THING/1', 'THING/3']);
      expect(model.isChanged).to.eql(false);
      expect((await model.links.things).map(m => m.path)).to.eql(['THING/2', 'THING/1', 'THING/3']);

      /**
       * Unlink: single
       */
      things.unlink(['THING/2']);
      expect(model.changes.length).to.eql(1);
      expect(model.changes.map).to.eql({ refs: ['THING/1', 'THING/3'] });
      expect((await model.links.things).map(m => m.path)).to.eql(['THING/1', 'THING/3']);

      expect(model.doc.refs).to.eql(['THING/2', 'THING/1', 'THING/3']); // Change not commited yet.

      await model.save();
      expect(model.doc.refs).to.eql(['THING/1', 'THING/3']);
      expect((await db.getValue<any>(org.path)).refs).to.eql(['THING/1', 'THING/3']);

      /**
       * Unlink: all (clear)
       */
      things.unlink();
      things.unlink();
      things.unlink();
      expect(model.changes.length).to.eql(1);
      expect(model.changes.map).to.eql({ refs: undefined });
      expect(await model.links.things).to.eql([]);

      expect(model.doc.refs).to.eql(['THING/1', 'THING/3']); // Change not commited yet.
      expect((await db.getValue<any>(org.path)).refs).to.eql(['THING/1', 'THING/3']);

      await model.save();
      expect((await db.getValue<any>(org.path)).refs).to.eql(undefined);
      expect(await model.links.things).to.eql([]);
      expect(model.isChanged).to.eql(false);
    });
  });
});
