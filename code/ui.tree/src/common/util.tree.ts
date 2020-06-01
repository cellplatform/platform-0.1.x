import * as t from '../types';
import { value as valueUtil, defaultValue } from '@platform/util.value';

import { clone } from 'ramda';
export const R = { clone };

/**
 * Retrieves the children of a node (or an empty array).
 */
export function children<T extends t.ITreeNode>(node?: T) {
  return node ? node.children || [] : [];
}

/**
 * Retrieves the child node at the given index.
 */
export function childAt<T extends t.ITreeNode>(index: number, parent?: T) {
  return children<T>(parent)[index];
}

/**
 * Determines whether the given node exists within the parent.
 */
export function hasChild(
  parent: t.ITreeNode | undefined,
  child: t.ITreeNode | t.ITreeNode['id'] | undefined,
) {
  const nodes = children(parent);
  const id = toId(child);
  return nodes.some((n) => n.id === id);
}

/**
 * Walks the tree looking for the first match.
 */
export function find<T extends t.ITreeNode>(
  root: T | undefined,
  match: (node: T, args: t.ITreeDescend<T>) => boolean,
): T | undefined {
  if (!root) {
    return;
  }
  let result: T | undefined;
  walkDown(root, (node, e) => {
    if (match(node, e) === true) {
      result = node;
      e.stop();
    }
  });
  return result ? { ...result } : undefined;
}

/**
 * Walks the tree looking for the given node.
 */
export function findById<T extends t.ITreeNode>(
  root: T | undefined,
  id: t.ITreeNode | t.ITreeNode['id'] | undefined,
  options: { throw?: boolean } = {},
): T | undefined {
  if (!id) {
    return undefined;
  }
  const targetId = typeof id === 'string' ? id : id.id;
  const result = id ? find<T>(root, (node) => node.id === targetId) : undefined;
  if (!result && options.throw) {
    throw new Error(`Failed to find tree-view node with the id '${id}'.`);
  }
  return result;
}

/**
 * Walks a tree (top down).
 */
export function walkDown<T extends t.ITreeNode>(
  node: T | undefined,
  fn: (node: T, args: t.ITreeDescend<T>) => any,
) {
  let stopped = false;
  const walk = (args: {
    node?: t.ITreeNode;
    parent?: t.ITreeNode;
    depth: number;
    index: number;
  }) => {
    if (!args.node || stopped) {
      return;
    }
    fn(args.node as T, {
      parent: args.parent as T,
      index: args.index,
      depth: args.depth,
      stop: () => (stopped = true),
    });
    if (stopped) {
      return;
    }
    let index = -1;
    for (const child of children(args.node)) {
      index++;
      walk({
        node: child,
        parent: args.node,
        index,
        depth: args.depth + 1,
      }); // <== RECURSION 🌳
    }
  };
  return walk({ node, depth: 0, index: -1 });
}

/**
 * Walks the tree from the given node up to the root.
 */
export function walkUp<T extends t.ITreeNode>(
  root: T | undefined,
  node: T | T['id'] | undefined,
  fn: (node: T, args: t.ITreeAscend<T>) => any,
) {
  const current = typeof node === 'string' ? findById(root, node) : node;
  if (current) {
    let stop = false;
    const parentNode = parent(root, current);
    const args: t.ITreeAscend<T> = {
      parent: parentNode,
      get index() {
        const id = current ? current.id : '';
        return !parentNode ? -1 : (parentNode.children || []).findIndex((node) => node.id === id);
      },
      stop: () => (stop = true),
    };
    fn(current, args);
    if (!stop && parentNode) {
      walkUp(root, args.parent, fn); // <== RECURSION 🌳
    }
  }
}

/**
 * Maps over each node in a tree.
 */
export function map<T extends t.ITreeNode, R>(
  node: T | undefined,
  fn: (node: T, args: t.ITreeDescend<T>) => R,
) {
  let result: R[] = [];
  walkDown<T>(node, (node, e) => (result = [...result, fn(node, e) as R]));
  return result;
}

/**
 * Retrieves the depth (index) of the given node.
 */
export function depth(
  root: t.ITreeNode | undefined,
  node: t.ITreeNode | t.ITreeNode['id'] | undefined,
) {
  let depth = -1;
  if (!node || !root) {
    return depth;
  }
  const id = toId(node);
  walkDown(root, (node, e) => {
    if (node.id === id) {
      depth = e.depth;
      e.stop();
    }
  });
  return depth;
}

/**
 * Retrieves the parent of a node within the tree.
 */
export function parent<T extends t.ITreeNode>(
  root: T | undefined,
  node: T | T['id'] | undefined,
  options: { inline?: boolean } = {},
): T | undefined {
  if (!node || !root) {
    return undefined;
  }

  // Look up the node if an ID was passed.
  if (typeof node !== 'object') {
    const id = node;
    node = findById<T>(root, id);
    if (!node) {
      throw new Error(`Cannot find parent of '${id}'. A tree-node with that ID was not found.`);
    }
  }

  let result: T | undefined;
  const target: t.ITreeNode = node;

  walkDown<T>(root, (parentNode, e) => {
    if (hasChild(parentNode, target)) {
      const props = parentNode.props || {};
      if (options.inline === false && props.inline) {
        // Not a match on the given "showChildren" filter.
        // Keep going....
        e.stop();
        result = parent(root, parentNode); // <== RECURSION.
      } else {
        result = parentNode;
        e.stop();
      }
    }
  });
  return result;
}

/**
 * Retrieves the descendent hierarchy to a given node.
 */
export function pathList<T extends t.ITreeNode>(
  root: T | undefined,
  node: T | T['id'] | undefined,
) {
  if (!node || !root) {
    return [];
  }

  let items: T[] = [];
  const add = (node?: T) => {
    if (!node) {
      return;
    }
    items = [...items, node];
    if (node.id !== root.id) {
      const next = parent(root, node);
      if (next) {
        add(next); // <== RECURSION
      }
    }
  };

  add(findById(root, node));
  return items.reverse();
}

/**
 * Replaces the given node in the tree.
 */
export function replace<T extends t.ITreeNode>(
  root: T | undefined,
  node: t.ITreeNode | T['id'] | undefined,
): T | undefined {
  if (!root) {
    return undefined;
  }

  let target = node as T | undefined;
  if (!target) {
    return undefined;
  }

  // Look up the node if an ID was passed.
  if (typeof node !== 'object') {
    const id = node;
    target = findById<T>(root, id);
    if (!target) {
      throw new Error(`A tree-node with the id '${id}' was not found.`);
    }
  }

  // If the root was specified for replacement
  // return it without incuring the "walk".
  if (root.id === target.id) {
    return target;
  }

  // Walk the tree looking for the item to place.
  root = R.clone(root);
  walkDown<T>(root, (current, e) => {
    if (target && current.id === target.id) {
      if (e.parent && e.index > -1) {
        const items = [...children(e.parent)];
        items[e.index] = { ...target };
        e.parent.children = items;
      }
      e.stop();
    }
  });

  // Finish up.
  return root;
}

/**
 * Replaces (or inserts) the given child of a node.
 */
export function replaceChild<T extends t.ITreeNode>(
  node: T | undefined,
  child: T | undefined,
  options: { insert?: 'FIRST' | 'LAST' } = {},
): T | undefined {
  if (!node || !child) {
    return undefined;
  }
  const { insert = 'LAST' } = options;
  let children = node.children ? [...node.children] : [];
  const index = children.findIndex((n) => n.id === child.id);
  if (index === -1) {
    if (insert === 'FIRST') {
      children = [{ ...child }, ...children];
    }
    if (insert === 'LAST') {
      children = [...children, { ...child }];
    }
  } else {
    children[index] = { ...child };
  }
  return { ...node, children };
}

/**
 * Adds a hierarchy of nodes to the tree based on the given path.
 */
export function buildPath<T extends t.ITreeNode = t.ITreeNode>(
  root: T,
  factory: t.TreeNodePathFactory<T>,
  path: string,
  options: { force?: boolean; delimiter?: string } = {},
) {
  const { force, delimiter = '/' } = options;

  // Build the set of ids.
  let ids: string[] = [];
  path.split(delimiter).forEach((level, i) => {
    level = ids[i - 1] ? `${ids[i - 1]}${delimiter}${level}` : level;
    ids = [...ids, level];
  });
  ids = valueUtil.compact(ids);

  // Walk up the path adding each node.
  let current: T | undefined;
  let parent: T | undefined;
  for (const id of [...ids].reverse()) {
    // If there is an existing node, and this is not a `force` override,
    // use the existing node as the parent, otherwise create it now.
    const existing = findById(root, id);

    let level = -1;
    const context: t.ITreeNodePathContext = {
      id,
      path,
      get level() {
        return level === -1 ? (level = id.split('/').length) : level;
      },
    };

    parent = !force && existing ? existing : factory(id, context);
    if (parent === undefined) {
      break;
    }

    // Construct the node and insert it into the tree.
    parent = current ? replaceChild(parent, current) : parent;
    current = parent;
  }

  // Finish up.
  root = parent ? (replaceChild(root, parent) as T) : root;
  return { ids, root };
}

/**
 * Creates a version of `buildPath` with the factory curried.
 */
export function pathBuilder<T extends t.ITreeNode = t.ITreeNode>(
  root: T,
  factory: t.TreeNodePathFactory<T>,
  options: { delimiter?: string } = {},
) {
  const { delimiter } = options;
  const builder = {
    root,
    add(path: string, options: { force?: boolean } = {}) {
      const args = { ...options, delimiter };
      const res = buildPath<T>(builder.root, factory, path, args);
      builder.root = res.root;
      return res;
    },
  };
  return builder;
}

/**
 * Updates a set of property values on the given node.
 */
export function setProps<T extends t.ITreeNode>(
  root: T | undefined,
  id: T | T['id'],
  props?: Partial<t.ITreeNodeProps>,
): T | undefined {
  if (!props || !root) {
    return root;
  }
  let node = typeof id === 'object' ? id : findById(root, id);
  if (!node) {
    throw new Error(`A tree-node with the id '${id}' was not found.`);
  }
  node = { ...node, props: { ...node.props, ...props } };
  return replace<T>(root, node);
}

/**
 * Retrieves the props for the given node.
 */
export function props<T extends t.ITreeNode>(node?: T) {
  return node ? node.props || {} : {};
}

/**
 * Toggles the the open state of the given node.
 */
export function toggleIsOpen<T extends t.ITreeNode>(
  root: T | undefined,
  node: t.ITreeNode | string | undefined,
): T | undefined {
  node = typeof node === 'string' ? findById(root, node) : node;

  if (!node || !root) {
    return root;
  }
  const props = node.props || {};
  let inline = props.inline;
  if (!inline) {
    return root;
  }
  inline = { ...inline, isOpen: !inline.isOpen };
  node = { ...node, props: { ...props, inline } };
  return replace<T>(root, node);
}

/**
 * Ensures all inline nodes in the parent hierarchy leading to
 * the given node are in an "toggled-open" state.
 */
export function openToNode<T extends t.ITreeNode>(
  root: T | undefined,
  id: t.ITreeNode | t.ITreeNode['id'] | undefined,
): T | undefined {
  if (!root || !id) {
    return root;
  }
  const node = typeof id === 'string' ? findById(root, id) : id;
  pathList(root, node).forEach((node) => {
    const p = props(node);
    if (p.inline !== undefined) {
      p.inline = typeof p.inline === 'boolean' ? {} : p.inline;
      p.inline = { ...p.inline, isOpen: true };
    }
  });
  return root;
}

/**
 * Determines if the given node is open.
 */
export function isOpen(node?: t.ITreeNode) {
  const inline = props(node).inline;
  return inline ? inline.isOpen : undefined;
}

/**
 * Determined if the given node is enabled.
 */
export function isEnabled(node?: t.ITreeNode) {
  return defaultValue(props(node).isEnabled, true);
}

/**
 * Determines if the given node is selected.
 */
export function isSelected(node?: t.ITreeNode) {
  return defaultValue(props(node).isSelected, false);
}

/**
 * INTERNAL
 */
const toId = (node: t.ITreeNode | t.ITreeNode['id'] | undefined) =>
  typeof node === 'object' ? node.id : node;
