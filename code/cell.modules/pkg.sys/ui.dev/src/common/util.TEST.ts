import { expect, t } from '../test';
import { Format } from './util';
import { DevActions } from '..';

describe('util: Format', () => {
  describe('toEdges', () => {
    it('0', () => {
      const res = Format.toEdges(0);
      expect(res).to.eql({ top: 0, right: 0, bottom: 0, left: 0 });
    });

    it('[10, 20]', () => {
      const res = Format.toEdges([10, 20]);
      expect(res).to.eql({ top: 10, right: 20, bottom: 10, left: 20 });
    });

    it('[1, 2, 3, 4]', () => {
      const res = Format.toEdges([1, 2, 3, 4]);
      expect(res).to.eql({ top: 1, right: 2, bottom: 3, left: 4 });
    });
  });

  describe('toActionsArray', () => {
    type A = t.Actions;
    const actions1 = DevActions().namespace('one');
    const actions2 = DevActions().namespace('two');
    const actions3 = import('../test/sample-3/DEV');

    it('undefined', async () => {
      expect(await Format.toActionsArray()).to.eql([]);
    });

    it('single', async () => {
      const res = await Format.toActionsArray(actions1);
      expect(res).to.eql([actions1]);
      expect((res[0] as A).toObject().namespace).to.eql('one');
    });

    it('[array]', async () => {
      const res = await Format.toActionsArray([actions1, actions2]);
      expect(res).to.eql([actions1, actions2]);
      expect((res[0] as A).toObject().namespace).to.eql('one');
      expect((res[1] as A).toObject().namespace).to.eql('two');
    });

    it('dynamic import', async () => {
      const res = await Format.toActionsArray(actions3);
      expect((res[0] as A).toObject().namespace).to.eql('test/sample-3');
    });

    it('dynamic import [array]', async () => {
      const res = await Format.toActionsArray([actions1, actions3]);
      expect((res[0] as A).toObject().namespace).to.eql('one');
      expect((res[1] as A).toObject().namespace).to.eql('test/sample-3');
    });
  });
});