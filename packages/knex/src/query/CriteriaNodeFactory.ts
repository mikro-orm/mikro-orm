import {
  type Dictionary,
  type EntityKey,
  type EntityMetadata,
  isRaw,
  JsonType,
  type MetadataStorage,
  RawQueryFragment,
  ReferenceKind,
  Utils,
  ValidationError,
} from '@mikro-orm/core';
import { ObjectCriteriaNode } from './ObjectCriteriaNode.js';
import { ArrayCriteriaNode } from './ArrayCriteriaNode.js';
import { ScalarCriteriaNode } from './ScalarCriteriaNode.js';
import type { ICriteriaNode } from '../typings.js';

/**
 * @internal
 */
export class CriteriaNodeFactory {

  static createNode<T extends object>(metadata: MetadataStorage, entityName: string, payload: any, parent?: ICriteriaNode<T>, key?: EntityKey<T>): ICriteriaNode<T> {
    const customExpression = RawQueryFragment.isKnownFragment(key || '');
    const scalar = Utils.isPrimaryKey(payload) || isRaw(payload) || payload as unknown instanceof RegExp || payload as unknown instanceof Date || customExpression;

    if (Array.isArray(payload) && !scalar) {
      return this.createArrayNode(metadata, entityName, payload, parent, key);
    }

    if (Utils.isPlainObject(payload) && !scalar) {
      return this.createObjectNode(metadata, entityName, payload, parent, key);
    }

    return this.createScalarNode(metadata, entityName, payload, parent, key);
  }

  static createScalarNode<T extends object>(metadata: MetadataStorage, entityName: string, payload: any, parent?: ICriteriaNode<T>, key?: EntityKey<T>): ICriteriaNode<T> {
    const node = new ScalarCriteriaNode<T>(metadata, entityName, parent, key);
    node.payload = payload;

    return node;
  }

  static createArrayNode<T extends object>(metadata: MetadataStorage, entityName: string, payload: any[], parent?: ICriteriaNode<T>, key?: EntityKey<T>): ICriteriaNode<T> {
    const node = new ArrayCriteriaNode<T>(metadata, entityName, parent, key);
    node.payload = payload.map((item, index) => {
      const n = this.createNode(metadata, entityName, item, node);

      // we care about branching only for $and
      if (key === '$and' && payload.length > 1) {
        n.index = index;
      }

      return n;
    });

    return node;
  }

  static createObjectNode<T extends object>(metadata: MetadataStorage, entityName: string, payload: Dictionary, parent?: ICriteriaNode<T>, key?: EntityKey<T>): ICriteriaNode<T> {
    const meta = metadata.find(entityName);
    const node = new ObjectCriteriaNode(metadata, entityName, parent, key);
    node.payload = {} as Dictionary;

    for (const key of Object.keys(payload)) {
      node.payload[key] = this.createObjectItemNode(metadata, entityName, node, payload, key, meta);
    }

    return node;
  }

  static createObjectItemNode<T extends object>(metadata: MetadataStorage, entityName: string, node: ICriteriaNode<T>, payload: Dictionary, key: EntityKey<T>, meta?: EntityMetadata<T>) {
    const prop = meta?.properties[key];
    const childEntity = prop && prop.kind !== ReferenceKind.SCALAR ? prop.type : entityName;

    if (prop?.customType instanceof JsonType) {
      return this.createScalarNode(metadata, childEntity, payload[key], node, key);
    }

    if (prop?.kind !== ReferenceKind.EMBEDDED) {
      return this.createNode(metadata, childEntity, payload[key], node, key);
    }

    if (payload[key] == null) {
      const map = Object.keys(prop.embeddedProps).reduce((oo, k) => {
        oo[prop.embeddedProps[k].name] = null;
        return oo;
      }, {} as Dictionary);

      return this.createNode(metadata, entityName, map, node, key);
    }

    // array operators can be used on embedded properties
    const allowedOperators = ['$contains', '$contained', '$overlap'];
    const operator = Object.keys(payload[key]).some(f => Utils.isOperator(f) && !allowedOperators.includes(f));

    if (operator) {
      throw ValidationError.cannotUseOperatorsInsideEmbeddables(entityName, prop.name, payload);
    }

    const map = Object.keys(payload[key]).reduce((oo, k) => {
      if (!prop.embeddedProps[k] && !allowedOperators.includes(k)) {
        throw ValidationError.invalidEmbeddableQuery(entityName, k, prop.type);
      }

      if (prop.embeddedProps[k]) {
        oo[prop.embeddedProps[k].name] = payload[key][k];
      } else if (typeof payload[key][k] === 'object') {
        oo[k] = JSON.stringify(payload[key][k]);
      } else {
        oo[k] = payload[key][k];
      }

      return oo;
    }, {} as Dictionary);

    return this.createNode(metadata, entityName, map, node, key);
  }

}
