/**
 * Inspired by https://github.com/pvorb/clone but simplified and never tries to
 * clone `EventEmitter`s to get around https://github.com/mikro-orm/mikro-orm/issues/2748
 * @internal
 */

import { EventEmitter } from 'events';
import { RawQueryFragment } from './RawQueryFragment';

export function clone<T>(parent: T, respectCustomCloneMethod = true): T {
  const allParents: unknown[] = [];
  const allChildren: unknown[] = [];

  function _clone(parent: any) {
    // cloning null always returns null
    if (parent === null) {
      return null;
    }

    const raw = RawQueryFragment.getKnownFragment(parent, false);

    if (raw) {
      return raw.clone();
    }

    if (typeof parent !== 'object' || parent instanceof EventEmitter) {
      return parent;
    }

    if (respectCustomCloneMethod && 'clone' in parent && typeof parent.clone === 'function') {
      return parent.clone();
    }

    let child: unknown;
    let proto;

    if (parent instanceof Map) {
      child = new Map();
    } else if (parent instanceof Set) {
      child = new Set();
    } else if (parent instanceof Promise) {
      child = new Promise((resolve, reject) => {
        parent.then(resolve.bind(null, _clone), reject.bind(null, _clone));
      });
    } else if (Array.isArray(parent)) {
      child = [];
    } else if (parent instanceof RegExp) {
      let flags = '';

      if (parent.global) {
        flags += 'g';
      }

      if (parent.ignoreCase) {
        flags += 'i';
      }

      if (parent.multiline) {
        flags += 'm';
      }

      child = new RegExp(parent.source, flags);

      if (parent.lastIndex) {
        (child as RegExp).lastIndex = parent.lastIndex;
      }
    } else if (parent instanceof Date) {
      child = new Date(parent.getTime());
    } else if (Buffer.isBuffer(parent)) {
      child = Buffer.allocUnsafe(parent.length);
      parent.copy(child as Buffer);
      return child;
    } else if (parent instanceof Error) {
      child = Object.create(parent);
    } else {
      proto = Object.getPrototypeOf(parent);
      child = Object.create(proto);
    }

    const index = allParents.indexOf(parent);

    if (index !== -1) {
      return allChildren[index];
    }

    allParents.push(parent);
    allChildren.push(child);

    if (parent instanceof Map) {
      parent.forEach((value: unknown, key: string) => {
        const keyChild = _clone(key);
        const valueChild = _clone(value);
        (child as any).set(keyChild, valueChild);
      });
    }

    if (parent instanceof Set) {
      parent.forEach((value: unknown) => {
        const entryChild = _clone(value);
        (child as any).add(entryChild);
      });
    }

    for (const i in parent) {
      let attrs;

      if (proto) {
        attrs = Object.getOwnPropertyDescriptor(proto, i);
      }

      if (attrs && attrs.set == null) {
        continue;
      }

      const raw = RawQueryFragment.getKnownFragment(i, false);

      if (raw) {
        const i2 = raw.clone().toString();
        (child as any)[i2] = _clone(parent[i]);
        continue;
      }

      (child as any)[i] = _clone(parent[i]);
    }

    if (Object.getOwnPropertySymbols) {
      const symbols = Object.getOwnPropertySymbols(parent);

      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        const descriptor = Object.getOwnPropertyDescriptor(parent, symbol);

        /* istanbul ignore next */
        if (descriptor && !descriptor.enumerable) {
          continue;
        }

        (child as any)[symbol] = _clone(parent[symbol]);
      }
    }

    return child;
  }

  return _clone(parent);
}
