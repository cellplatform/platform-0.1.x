import { expect } from 'chai';
import { t, tree as util } from '.';

describe('util.tree', () => {
  describe('walkDown', () => {
    it('walks from root', () => {
      const tree: t.ITreeNode = {
        id: 'root',
        children: [{ id: 'child-1' }, { id: 'child-2' }],
      };

      const nodes: t.ITreeNode[] = [];
      util.walkDown(tree, (e) => nodes.push(e.node));

      expect(nodes.length).to.eql(3);
      expect(nodes[0]).to.equal(tree);
      expect(nodes[1]).to.equal(tree.children && tree.children[0]);
      expect(nodes[2]).to.equal(tree.children && tree.children[1]);
    });

    it('passes parent as args', () => {
      const grandchild: t.ITreeNode = { id: 'grandchild' };
      const child: t.ITreeNode = { id: 'child', children: [grandchild] };
      const root: t.ITreeNode = { id: 'root', children: [child] };

      const items: t.ITreeDescend[] = [];
      util.walkDown(root, (e) => items.push(e));

      expect(items.length).to.eql(3);

      expect(items[0].depth).to.eql(0);
      expect(items[1].depth).to.eql(1);
      expect(items[2].depth).to.eql(2);

      expect(items[0].parent).to.eql(undefined);
      expect(items[1].parent).to.eql(root);
      expect(items[2].parent).to.eql(child);
    });

    it('reports node index (sibling position)', () => {
      const tree: t.ITreeNode = {
        id: 'root',
        children: [{ id: 'child-1' }, { id: 'child-2' }],
      };

      const items: t.ITreeDescend[] = [];
      util.walkDown(tree, (e) => items.push(e));

      expect(items[0].index).to.eql(-1);
      expect(items[1].index).to.eql(0);
      expect(items[2].index).to.eql(1);
    });
  });

  describe('walkUp', () => {
    const tree: t.ITreeNode = {
      id: 'root',
      children: [{ id: 'child-1' }, { id: 'child-2', children: [{ id: 'grandchild-1' }] }],
    };

    it('walks to root', () => {
      const start = util.findById(tree, 'grandchild-1');
      const list: { node: t.ITreeNode; args: t.ITreeAscend }[] = [];
      util.walkUp(tree, start, (node, args) => list.push({ node, args }));

      expect(list.length).to.eql(3);
      expect(list.map((e) => e.node.id)).to.eql(['grandchild-1', 'child-2', 'root']);

      expect(list[0].args.parent && list[0].args.parent.id).to.eql('child-2');
      expect(list[1].args.parent && list[1].args.parent.id).to.eql('root');
      expect(list[2].args.parent && list[2].args.parent.id).to.eql(undefined);

      const args = list.map((item) => item.args);

      expect(args[0].index).to.eql(0);
      expect(args[1].index).to.eql(1);
      expect(args[2].index).to.eql(-1);
    });

    it('stops mid-way', () => {
      const start = util.findById(tree, 'grandchild-1');
      const list: { node: t.ITreeNode; args: t.ITreeAscend }[] = [];
      util.walkUp(tree, start, (node, args) => {
        list.push({ node, args });
        if (node.id === 'child-2') {
          args.stop();
        }
      });

      expect(list.length).to.eql(2);
      expect(list.map((e) => e.node.id)).to.eql(['grandchild-1', 'child-2']);
    });
  });

  describe('find', () => {
    const tree: t.ITreeNode = {
      id: 'root',
      children: [{ id: 'child-1' }, { id: 'child-2', children: [{ id: 'child-3' }] }],
    };

    it('finds the given node', () => {
      const res1 = util.find(tree, (e) => e.node.id === 'child-3');
      const res2 = util.find(tree, (e) => e.node.id === 'NO_EXIT');
      expect(res1).to.eql({ id: 'child-3' });
      expect(res2).to.eql(undefined);
    });

    it('finds the given node by ID', () => {
      const res1 = util.findById(tree, 'child-3');
      const res2 = util.findById(tree, 'NO_EXIST');
      const res3 = util.findById(tree, undefined);
      const res4 = util.findById(tree, { id: 'child-2' });
      expect(res1).to.eql({ id: 'child-3' });
      expect(res2).to.eql(undefined);
      expect(res3).to.eql(undefined);
      expect(res4).to.eql({ id: 'child-2', children: [{ id: 'child-3' }] });
    });
  });

  describe('children', () => {
    it('no childen => empty array', () => {
      const node = { id: 'root' };
      expect(util.children(node)).to.eql([]);
    });

    it('returns child array', () => {
      const node = { id: 'root', children: [{ id: 'child' }] };
      expect(util.children(node)).to.eql([{ id: 'child' }]);
    });
  });

  describe('childAt', () => {
    const root = { id: 'A', children: [{ id: 'B' }, { id: 'C' }] };
    it('undefined', () => {
      expect(util.childAt(0)).to.eql(undefined);
      expect(util.childAt(2, root)).to.eql(undefined);
    });

    it('retrieves child', () => {
      expect(util.childAt(0, root)).to.eql({ id: 'B' });
      expect(util.childAt(1, root)).to.eql({ id: 'C' });
    });
  });

  describe('hasChild', () => {
    const root = { id: 'A', children: [{ id: 'B' }, { id: 'C' }] };
    it('does have child', () => {
      expect(util.hasChild(root, 'B')).to.eql(true);
      expect(util.hasChild(root, 'C')).to.eql(true);
      expect(util.hasChild(root, { id: 'C' })).to.eql(true);
    });

    it('does not have child', () => {
      expect(util.hasChild(root, 'A')).to.eql(false);
      expect(util.hasChild(root, 'NO_MATCH')).to.eql(false);
      expect(util.hasChild(root, undefined)).to.eql(false);
    });
  });

  describe('map', () => {
    const root = { id: 'A', children: [{ id: 'B' }, { id: 'C' }] };
    it('maps the entire tree', () => {
      const res = util.map(root, (e) => e.node.id);
      expect(res).to.eql(['A', 'B', 'C']);
    });

    it('stops mapping mid-way through', () => {
      let count = 0;
      const res = util.map(root, (e) => {
        count++;
        if (count > 1) {
          e.stop();
        }
        return e.node.id;
      });
      expect(res).to.eql(['A', 'B']);
    });
  });

  describe('depth', () => {
    const root = {
      id: 'A',
      children: [{ id: 'B' }, { id: 'C', children: [{ id: 'D' }] }],
    };

    it('retrieves depth', () => {
      expect(util.depth(root, 'A')).to.eql(0);
      expect(util.depth(root, { id: 'A' })).to.eql(0);
      expect(util.depth(root, 'B')).to.eql(1);
      expect(util.depth(root, 'C')).to.eql(1);
      expect(util.depth(root, 'D')).to.eql(2);
      expect(util.depth(root, { id: 'D' })).to.eql(2);
    });

    it('-1', () => {
      expect(util.depth(undefined, 'C')).to.eql(-1);
      expect(util.depth(root, undefined)).to.eql(-1);
      expect(util.depth(root, 'NO_EXIST')).to.eql(-1);
      expect(util.depth(root, { id: 'NO_EXIST' })).to.eql(-1);
    });
  });

  describe('replace', () => {
    it('replaces root', () => {
      const tree: t.ITreeNode = { id: 'root' };
      const res = util.replace(tree, {
        id: 'root',
        props: { label: 'hello' },
      });
      expect(res && res.props).to.eql({ label: 'hello' });
    });

    it('replaces child', () => {
      const tree: t.ITreeNode = { id: 'root', children: [{ id: 'foo' }] };
      const res = util.replace(tree, {
        id: 'foo',
        props: { label: 'hello' },
      });
      const children = util.children(res);
      expect(res && res.id).to.eql('root');
      expect(children[0]).to.eql({ id: 'foo', props: { label: 'hello' } });
    });

    it('replaces grand-child', () => {
      const tree: t.ITreeNode = {
        id: 'root',
        children: [{ id: 'child', children: [{ id: 'grandchild' }] }],
      };
      const res = util.replace(tree, {
        id: 'grandchild',
        props: { label: 'hello' },
      });
      expect(res && res.id).to.eql('root');

      const child = util.childAt(0, res);
      const grandchild = util.childAt(0, child);
      expect(child.id).to.eql('child');
      expect(grandchild.id).to.eql('grandchild');
    });
  });

  describe('replaceChild', () => {
    it('inserts the given child as clone (no starting children array)', () => {
      const root: t.ITreeNode = { id: 'root' };
      const child: t.ITreeNode = { id: 'child' };

      const res = util.replaceChild(root, child);
      const children = res ? res.children || [] : [];

      expect(res).to.not.equal(root);
      expect(res && res.id).to.eql('root');
      expect(children).to.eql([{ id: 'child' }]);
      expect(children[0]).to.not.equal(child);
    });

    it('inserts non-existing child (LAST [default])', () => {
      const root: t.ITreeNode = { id: 'root', children: [{ id: 'existing' }] };
      const child: t.ITreeNode = { id: 'child' };
      const res = util.replaceChild(root, child);
      const children = res ? res.children || [] : [];
      expect(children[0]).to.eql({ id: 'existing' });
      expect(children[1]).to.eql({ id: 'child' });
    });

    it('inserts non-existing child (FIRST)', () => {
      const root: t.ITreeNode = { id: 'root', children: [{ id: 'existing' }] };
      const child: t.ITreeNode = { id: 'child' };
      const res = util.replaceChild(root, child, { insert: 'FIRST' });
      const children = res ? res.children || [] : [];
      expect(children[0]).to.eql({ id: 'child' });
      expect(children[1]).to.eql({ id: 'existing' });
    });

    it('replaces an existing child node', () => {
      const root: t.ITreeNode = {
        id: 'root',
        children: [{ id: 'foo' }, { id: 'child', data: { foo: 123 } }, { id: 'bar' }],
      };
      const child: t.ITreeNode = { id: 'child', data: { foo: 456 } };
      const res = util.replaceChild(root, child, { insert: 'FIRST' });
      const children = res ? res.children || [] : [];
      expect(children[1].data).to.eql({ foo: 456 });
    });
  });

  describe('parent', () => {
    it('has a parent', () => {
      const grandchild: t.ITreeNode = { id: 'grandchild' };
      const child: t.ITreeNode = { id: 'child', children: [grandchild] };
      const root: t.ITreeNode = { id: 'root', children: [child] };
      expect(util.parent(root, child)).to.equal(root);
      expect(util.parent(root, grandchild)).to.equal(child);
    });

    it('has no parent', () => {
      const grandchild: t.ITreeNode = { id: 'grandchild' };
      const child: t.ITreeNode = { id: 'child', children: [grandchild] };
      const root: t.ITreeNode = { id: 'root', children: [] };
      expect(util.parent(root, child)).to.equal(undefined);
      expect(util.parent(root, grandchild)).to.equal(undefined);
    });
  });

  describe('setProps', () => {
    it('updates props on the root', () => {
      const tree: t.ITreeNode = { id: 'root', children: [{ id: 'foo' }] };
      const res = util.setProps(tree, 'root', { label: 'Root!' });
      expect(res).to.not.equal(tree); // Clone.
      expect(res && res.props && res.props.label).to.eql('Root!');
    });

    it('updates the given property values (children)', () => {
      let tree: t.ITreeNode | undefined = {
        id: 'root',
        children: [{ id: 'foo' }],
      };
      tree = util.setProps(tree, 'foo', { label: '1' });
      tree = util.setProps(tree, 'foo', { label: '2' });
      tree = util.setProps(tree, 'foo', { title: 'My Title' });
      tree = util.setProps(tree, 'foo', { label: 'hello' });

      expect(tree && tree.id).to.eql('root');

      const children = util.children(tree);
      expect(children[0]).to.eql({
        id: 'foo',
        props: { label: 'hello', title: 'My Title' },
      });
    });
  });

  describe('pathList', () => {
    const D = { id: 'D', props: { label: 'Derp' } };
    const C = { id: 'C', children: [D] };
    const B = { id: 'B' };
    const A = { id: 'A', children: [B, C] };

    it('builds path (via node)', () => {
      const node = { id: 'D' };
      const res = util.pathList(A, node);
      expect(res.length).to.eql(3);
      expect(res[0]).to.eql(A);
      expect(res[1]).to.eql(C);
      expect(res[2]).to.eql(D);
      expect(res[2]).to.not.eql(node); // NB: The actual node "D" is returned, not the given node.
    });

    it('builds path (via ID)', () => {
      const res = util.pathList(A, 'D');
      expect(res.length).to.eql(3);
      expect(res[0]).to.eql(A);
      expect(res[1]).to.eql(C);
      expect(res[2]).to.eql(D);
    });

    it('alternative path', () => {
      const res = util.pathList(A, 'B');
      expect(res.length).to.eql(2);
      expect(res[0]).to.eql(A);
      expect(res[1]).to.eql(B);
    });

    it('root', () => {
      const res = util.pathList(A, 'A');
      expect(res.length).to.eql(1);
      expect(res[0]).to.eql(A);
    });

    it('not found (empty [])', () => {
      const res = util.pathList(A, 'NO_EXIST');
      expect(res).to.eql([]);
    });
  });

  describe('toggleIsOpen', () => {
    const E = { id: 'E', props: { inline: {} } };
    const D = { id: 'D', props: { inline: { isOpen: false } } };
    const C = { id: 'C', children: [D] };
    const B = { id: 'B' };
    const A = { id: 'A', children: [B, C, E] };

    it('undefined ({inline} not set)', () => {
      const res = util.toggleIsOpen(A, A);
      const child = util.findById(res, 'B');
      expect(child).to.eql({ id: 'B' });
    });

    it('toggled (false => true => false)', () => {
      const res1 = util.toggleIsOpen<t.ITreeNode>(A, D);
      const child1 = util.findById(res1, 'D');
      expect(child1 && child1.props).to.eql({ inline: { isOpen: true } });

      const res2 = util.toggleIsOpen<t.ITreeNode>(res1, child1);
      const child2 = util.findById(res2, 'D');
      expect(child2 && child2.props).to.eql({ inline: { isOpen: false } });
    });

    it('toggled (undefined => true)', () => {
      const res = util.toggleIsOpen<t.ITreeNode>(A, E);
      const child = util.findById(res, 'E');
      expect(child && child.props).to.eql({ inline: { isOpen: true } });
    });

    it('toggled via "id" (undefined => true)', () => {
      let root = { ...A } as t.ITreeNode | undefined;
      root = util.toggleIsOpen<t.ITreeNode>(root, E.id);
      const child1 = util.findById(root, 'E');
      expect(child1 && child1.props).to.eql({ inline: { isOpen: true } });

      root = util.toggleIsOpen<t.ITreeNode>(root, E.id);
      const child2 = util.findById(root, 'E');
      expect(child2 && child2.props).to.eql({ inline: { isOpen: false } });
    });
  });

  describe('openToNode', () => {
    it('no change when nodes are not inline', () => {
      const root = util.buildPath({ id: 'ROOT' }, (id) => ({ id }), 'foo/bar/zoo').root;
      const res = util.openToNode(root, 'foo/bar/zoo');
      expect(res).to.eql(root);
    });

    it('sets the inline state of nodes to the given path (boolean)', () => {
      const factory: t.TreeNodePathFactory = (id) => ({ id, props: { inline: {} } });
      const root = util.buildPath({ id: 'ROOT' }, factory, 'foo/bar').root as t.ITreeNode;

      const res = util.openToNode(root, 'foo/bar') as t.ITreeNode;
      const child1 = util.childAt(0, res);
      const child2 = util.childAt(0, child1);

      expect(util.props(child1).inline).to.eql({ isOpen: true });
      expect(util.props(child2).inline).to.eql({ isOpen: true });
    });

    it('sets the inline state of nodes to the given path (object)', () => {
      const factory: t.TreeNodePathFactory = (id) => ({ id, props: { inline: {} } });
      const root = util.buildPath({ id: 'ROOT' }, factory, 'foo/bar').root;

      const res = util.openToNode(root, 'foo/bar') as t.ITreeNode;
      const child1 = util.childAt(0, res);
      const child2 = util.childAt(0, child1);

      expect(util.props(child1).inline).to.eql({ isOpen: true });
      expect(util.props(child2).inline).to.eql({ isOpen: true });
    });
  });

  describe('flags', () => {
    it('isOpen', () => {
      expect(util.isOpen()).to.eql(undefined);
      expect(util.isOpen({ id: 'foo' })).to.eql(undefined);
      expect(util.isOpen({ id: 'foo', props: { inline: {} } })).to.eql(undefined);
      expect(util.isOpen({ id: 'foo', props: { inline: { isOpen: true } } })).to.eql(true);
      expect(util.isOpen({ id: 'foo', props: { inline: { isOpen: false } } })).to.eql(false);
    });

    it('isEnabled', () => {
      expect(util.isEnabled()).to.eql(true);
      expect(util.isEnabled({ id: 'foo' })).to.eql(true);
      expect(util.isEnabled({ id: 'foo', props: { isEnabled: true } })).to.eql(true);
      expect(util.isEnabled({ id: 'foo', props: { isEnabled: false } })).to.eql(false);
    });

    it('isSelected', () => {
      expect(util.isSelected()).to.eql(false);
      expect(util.isSelected({ id: 'foo' })).to.eql(false);
      expect(util.isSelected({ id: 'foo', props: { isSelected: false } })).to.eql(false);
      expect(util.isSelected({ id: 'foo', props: { isSelected: true } })).to.eql(true);
    });
  });

  describe('buildPath', () => {
    it('build nothing (empty path)', () => {
      const root = { id: 'root' };
      const res = util.buildPath(root, (id) => ({ id }), '');
      expect(res.ids).to.eql([]);
      expect(res.root).to.eql(root);
    });

    it('builds path (1 level deep)', () => {
      const root = { id: 'root' };
      const res = util.buildPath<t.ITreeNode>(root, (id) => ({ id }), 'one');
      expect(res.root.children).to.eql([{ id: 'one' }]);
    });

    it('builds path (3 levels deep)', () => {
      const root = { id: 'root' };
      const res = util.buildPath(root, (id) => ({ id }), 'one/two/three');

      const child1 = util.findById(res.root, 'one');
      const child2 = util.findById(res.root, 'one/two');
      const child3 = util.findById(res.root, 'one/two/three');

      expect(child1 && child1.id).to.eql('one');
      expect(child2 && child2.id).to.eql('one/two');
      expect(child3 && child3.id).to.eql('one/two/three');
    });

    it('passes context', () => {
      const list: t.ITreeNodePathContext[] = [];
      const factory: t.TreeNodePathFactory = (id, context) => {
        list.push(context);
        return { id };
      };

      const root = { id: 'ROOT' };
      util.buildPath(root, factory, 'one/two/three');

      expect(list.length).to.eql(3);
      expect(list[0].id).to.eql('one/two/three');
      expect(list[1].id).to.eql('one/two');
      expect(list[2].id).to.eql('one');

      expect(list[0].path).to.eql('one/two/three');
      expect(list[1].path).to.eql('one/two/three');
      expect(list[2].path).to.eql('one/two/three');

      expect(list[0].level).to.eql(3);
      expect(list[1].level).to.eql(2);
      expect(list[2].level).to.eql(1);
    });

    it('uses overridden delimiter (:)', () => {
      const root = { id: 'root' };
      const res = util.buildPath(root, (id) => ({ id }), 'one:two', {
        delimiter: ':',
      });
      const child1 = util.findById(res.root, 'one');
      const child2 = util.findById(res.root, 'one:two');
      expect(child1 && child1.id).to.eql('one');
      expect(child2 && child2.id).to.eql('one:two');
    });

    it('does not override existing tree (default)', () => {
      type T = t.ITreeNode<string, { foo: number }>;
      let root: T = { id: 'root' };
      root = util.buildPath<T>(
        root,
        (id) => ({
          id,
          data: { foo: 1 },
        }),
        'one/two',
      ).root;

      root = util.buildPath<T>(
        root,
        (id) => ({
          id,
          data: { foo: 2 },
        }),
        'one/two/three',
      ).root;

      const child1 = util.findById(root, 'one/two') as T;
      const child2 = util.findById(root, 'one/two') as T;
      const child3 = util.findById(root, 'one/two/three') as T;

      expect(child1.data && child1.data.foo).to.eql(1); // NB: not overriden.
      expect(child2.data && child2.data.foo).to.eql(1); // NB: not overriden.
      expect(child3.data && child3.data.foo).to.eql(2); // From second operation.
    });

    it('does not force overrides existing tree', () => {
      type T = t.ITreeNode<string, { foo: number }>;
      let root: T = { id: 'ROOT' };
      root = util.buildPath<T>(root, (id) => ({ id, data: { foo: 1 } }), 'one/two').root;

      root = util.buildPath<T>(root, (id) => ({ id, data: { foo: 2 } }), 'one/two/three', {
        force: true,
      }).root;

      const child1 = util.findById(root, 'one/two') as T;
      const child2 = util.findById(root, 'one/two') as T;
      const child3 = util.findById(root, 'one/two/three') as T;

      expect(child1.data && child1.data.foo).to.eql(2); // NB: not overriden.
      expect(child2.data && child2.data.foo).to.eql(2); // NB: not overriden.
      expect(child3.data && child3.data.foo).to.eql(2); // From second operation.
    });

    it('merges paths (using path builder)', () => {
      const factory: t.TreeNodePathFactory<t.ITreeNode> = (id) => ({ id });
      const builder = util.pathBuilder({ id: 'ROOT' }, factory);

      builder.add('project/cohort-1');
      builder.add('project/cohort-1/images');
      builder.add('project/cohort-1/README.md');
      builder.add('project/cohort-1/images/logo.png');
      builder.add('project/cohort-2');

      const root = builder.root;
      const project = util.find(root, (e) => e.node.id.endsWith('project'));
      const cohort1 = util.find(root, (e) => e.node.id.endsWith('/cohort-1'));
      const cohort2 = util.find(root, (e) => e.node.id.endsWith('/cohort-2'));
      const readme = util.find(root, (e) => e.node.id.endsWith('README.md'));
      const images = util.find(root, (e) => e.node.id.endsWith('/images'));
      const logo = util.find(root, (e) => e.node.id.endsWith('logo.png'));

      expect(util.children(root).length).to.eql(1);
      expect(util.children(project).length).to.eql(2);
      expect(util.children(cohort1).length).to.eql(2);
      expect(util.children(cohort2).length).to.eql(0);

      expect(util.hasChild(root, project)).to.eql(true);
      expect(util.hasChild(project, cohort1)).to.eql(true);
      expect(util.hasChild(project, cohort2)).to.eql(true);
      expect(util.hasChild(cohort1, readme)).to.eql(true);
      expect(util.hasChild(cohort1, images)).to.eql(true);
      expect(util.hasChild(images, logo)).to.eql(true);
    });

    describe('factory returns undefined (node not added)', () => {
      it('nothing added', () => {
        const builder = util.pathBuilder({ id: 'ROOT' }, (id) => undefined);
        builder.add('/foo');
        builder.add('/foo/bar');
        builder.add('/foo/bar/baz');
        expect(builder.root).to.eql({ id: 'ROOT' });
      });

      it('leaf node not added', () => {
        const factory: t.TreeNodePathFactory<t.ITreeNode> = (id) =>
          id.split('/').length > 2 ? undefined : { id };
        const builder = util.pathBuilder({ id: 'ROOT' }, factory);

        builder.add('/foo');
        builder.add('/foo/bar');
        builder.add('/foo/bar/baz');

        const root = builder.root;
        const child1 = util.findById(root, 'foo') as t.ITreeNode;
        const child2 = util.findById(root, 'foo/bar') as t.ITreeNode;
        const child3 = util.findById(root, 'foo/bar/baz') as t.ITreeNode;

        expect(child1.id).to.eql('foo');
        expect(child2.id).to.eql('foo/bar');
        expect(child3).to.eql(undefined);
      });

      it('folder node not added (descendents stopped)', () => {
        const factory: t.TreeNodePathFactory<t.ITreeNode> = (id) =>
          id.split('/').length > 2 ? undefined : { id };
        const builder = util.pathBuilder({ id: 'ROOT' }, factory);

        builder.add('/foo');
        builder.add('/foo/bar');
        builder.add('/foo/bar/baz');
        builder.add('/foo/bar/baz/zoo');

        const root = builder.root;
        const child1 = util.findById(root, 'foo') as t.ITreeNode;
        const child2 = util.findById(root, 'foo/bar') as t.ITreeNode;
        const child3 = util.findById(root, 'foo/bar/baz') as t.ITreeNode;
        const child4 = util.findById(root, 'foo/bar/baz/zoo') as t.ITreeNode;

        expect(child1.id).to.eql('foo');
        expect(child2.id).to.eql('foo/bar');
        expect(child3).to.eql(undefined);
        expect(child4).to.eql(undefined);
      });
    });
  });
});
