import { expect, expectError } from '@platform/test';

import { fs, t } from '../common';
import { Db } from '../db';

import { linkOneToMany } from '.';

const dir = 'tmp/db';
after(async () => fs.remove('tmp'));

type IUser = { id: string; org?: string };
type IOrg = { id: string; users?: [] };

describe('linkOneToMany', () => {
  beforeEach(async () => fs.remove(dir));

  const ids = {
    user1: 'user-1',
    user2: 'user-2',
    org1: 'org-1',
  };

  const getUserDbKey = (id: string) => `KEY/user/${id}`;
  const getOrgDbKey = (id: string) => `KEY/org/${id}`;

  it('links org/user', async () => {
    const db = await Db.create({ dir });

    const userDbKey = getUserDbKey(ids.user1);
    const orgDbKey = getOrgDbKey(ids.org1);

    await db.put(userDbKey, { id: ids.user1 });
    await db.put(orgDbKey, { id: ids.org1, name: 'Acme' });

    const res = await linkOneToMany<IUser, IOrg>(db, userDbKey, orgDbKey, 'org', 'users');

    expect(res.many.users).to.include(ids.user1);
    expect(res.singular.org).to.eql(ids.org1);

    const user = (await db.get(userDbKey)).value as IUser;
    const org = (await db.get(orgDbKey)).value as IOrg;

    expect(user.org).to.eql(ids.org1);
    expect(org.users).to.include(ids.user1);
  });

  it('links several users', async () => {
    const db = await Db.create({ dir });

    const orgDbKey = getOrgDbKey(ids.org1);
    const userDbKey1 = getUserDbKey(ids.user1);
    const userDbKey2 = getUserDbKey(ids.user2);

    await db.put(orgDbKey, { id: ids.org1, name: 'Acme' });
    await db.put(userDbKey1, { id: ids.user1 });
    await db.put(userDbKey2, { id: ids.user2 });

    await linkOneToMany<IUser, IOrg>(db, userDbKey1, orgDbKey, 'org', 'users');
    await linkOneToMany<IUser, IOrg>(db, userDbKey2, orgDbKey, 'org', 'users');
    await linkOneToMany<IUser, IOrg>(db, userDbKey2, orgDbKey, 'org', 'users'); // NB: repeat

    const org = (await db.get(orgDbKey)).value as IOrg;
    const user1 = (await db.get(userDbKey1)).value as IUser;
    const user2 = (await db.get(userDbKey2)).value as IUser;

    expect(org.users).to.eql(['user-1', 'user-2']);
    expect(user1.org).to.eql(ids.org1);
    expect(user2.org).to.eql(ids.org1);
  });

  describe('throws if model not exist', () => {
    it('neither', async () => {
      const db = await Db.create({ dir });
      const userDbKey = getUserDbKey(ids.user1);
      const orgDbKey = getOrgDbKey(ids.org1);
      await expectError(async () => {
        await linkOneToMany<IUser, IOrg>(db, userDbKey, orgDbKey, 'org', 'users');
      });
    });

    it('no "singular" model', async () => {
      const db = await Db.create({ dir });
      const userDbKey = getUserDbKey(ids.user1);
      const orgDbKey = getOrgDbKey(ids.org1);
      await expectError(async () => {
        await db.put(orgDbKey, { id: ids.org1, name: 'Acme' });
        await linkOneToMany<IUser, IOrg>(db, userDbKey, orgDbKey, 'org', 'users');
      });
    });

    it('no "many" model', async () => {
      const db = await Db.create({ dir });
      const userDbKey = getUserDbKey(ids.user1);
      const orgDbKey = getOrgDbKey(ids.org1);
      await expectError(async () => {
        await db.put(userDbKey, { id: ids.user1 });
        await linkOneToMany<IUser, IOrg>(db, userDbKey, orgDbKey, 'org', 'users');
      });
    });
  });
});
