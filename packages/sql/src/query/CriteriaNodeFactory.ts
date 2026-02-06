import {
  type Dictionary,
  type EntityKey,
  type EntityMetadata,
  type EntityName,
  GroupOperator,
  isRaw,
  JsonType,
  type MetadataStorage,
  RawQueryFragment,
  type RawQueryFragmentSymbol,
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

  static createNode<T extends object>(metadata: MetadataStorage, entityName: EntityName<T>, payload: any, parent?: ICriteriaNode<T>, key?: EntityKey<T> | RawQueryFragmentSymbol, validate = true): ICriteriaNode<T> {
    const rawField = RawQueryFragment.isKnownFragmentSymbol(key);
    const scalar = Utils.isPrimaryKey(payload) || isRaw(payload) || payload as unknown instanceof RegExp || payload as unknown instanceof Date || rawField;

    if (Array.isArray(payload) && !scalar) {
      return this.createArrayNode(metadata, entityName, payload, parent, key, validate);
    }

    if (Utils.isPlainObject(payload) && !scalar) {
      return this.createObjectNode(metadata, entityName, payload, parent, key, validate);
    }

    return this.createScalarNode(metadata, entityName, payload, parent, key, validate);
  }

  static createScalarNode<T extends object>(metadata: MetadataStorage, entityName: EntityName<T>, payload: any, parent?: ICriteriaNode<T>, key?: EntityKey<T> | RawQueryFragmentSymbol, validate = true): ICriteriaNode<T> {
    const node = new ScalarCriteriaNode<T>(metadata, entityName, parent, key, validate);
    node.payload = payload;

    return node;
  }

  static createArrayNode<T extends object>(metadata: MetadataStorage, entityName: EntityName<T>, payload: any[], parent?: ICriteriaNode<T>, key?: EntityKey<T>, validate = true): ICriteriaNode<T> {
    const node = new ArrayCriteriaNode<T>(metadata, entityName, parent, key, validate);
    node.payload = payload.map((item, index) => {
      const n = this.createNode(metadata, entityName, item, node, undefined, validate);

      // we care about branching only for $and
      if (key === '$and' && payload.length > 1) {
        n.index = index;
      }

      return n;
    });

    return node;
  }

  static createObjectNode<T extends object>(metadata: MetadataStorage, entityName: EntityName<T>, payload: Dictionary, parent?: ICriteriaNode<T>, key?: EntityKey<T>, validate = true): ICriteriaNode<T> {
    const meta = metadata.find(entityName);
    const node = new ObjectCriteriaNode(metadata, entityName, parent, key, validate, payload.__strict);
    node.payload = {} as Dictionary;

    for (const k of Utils.getObjectQueryKeys(payload)) {
      node.payload[k] = this.createObjectItemNode(metadata, entityName, node, payload, k as EntityKey<T>, meta, validate);
    }

    return node;
  }

  static createObjectItemNode<T extends object>(metadata: MetadataStorage, entityName: EntityName<T>, node: ICriteriaNode<T>, payload: Dictionary, key: EntityKey<T> | RawQueryFragmentSymbol, meta?: EntityMetadata<T>, validate = true) {
    const rawField = RawQueryFragment.isKnownFragmentSymbol(key);
    const prop = rawField ? null : meta?.properties[key];
    const childEntity = prop && prop.kind !== ReferenceKind.SCALAR ? prop.targetMeta!.class : entityName;
    const isNotEmbedded = rawField || prop?.kind !== ReferenceKind.EMBEDDED;
    const val = payload[key as EntityKey<T>];

    if (isNotEmbedded && prop?.customType instanceof JsonType) {
      return this.createScalarNode(metadata, childEntity, val, node, key, validate);
    }

    if (prop?.kind === ReferenceKind.SCALAR && val != null && Object.keys(val).some(f => f in GroupOperator)) {
      throw ValidationError.cannotUseGroupOperatorsInsideScalars(entityName, prop.name, payload);
    }

    if (isNotEmbedded) {
      return this.createNode(metadata, childEntity, val, node, key, validate);
    }

    if (val == null) {
      const map = Object.keys(prop.embeddedProps).reduce((oo, k) => {
        oo[prop.embeddedProps[k].name] = null;
        return oo;
      }, {} as Dictionary);

      return this.createNode(metadata, entityName, map, node, key, validate);
    }

    // array operators can be used on embedded properties
    const allowedOperators = ['$contains', '$contained', '$overlap'];
    const operator = Object.keys(val).some(f => Utils.isOperator(f) && !allowedOperators.includes(f));

    if (operator) {
      throw ValidationError.cannotUseOperatorsInsideEmbeddables(entityName, prop.name, payload);
    }

    const map = Object.keys(val).reduce((oo, k) => {
      const embeddedProp = prop.embeddedProps[k] ?? Object.values(prop.embeddedProps).find(p => p.name === k);

      if (!embeddedProp && !allowedOperators.includes(k)) {
        throw ValidationError.invalidEmbeddableQuery(entityName, k, prop.type);
      }

      if (embeddedProp) {
        oo[embeddedProp.name] = val[k];
      } else if (typeof val[k] === 'object') {
        oo[k] = JSON.stringify(val[k]);
      } else {
        oo[k] = val[k];
      }

      return oo;
    }, {} as Dictionary);

    return this.createNode(metadata, entityName, map, node, key, validate);
  }

}
