import type { Dictionary, EntityKey, EntityMetadata, MetadataStorage } from '@mikro-orm/core';
import { ReferenceKind, Utils, ValidationError } from '@mikro-orm/core';
import { ObjectCriteriaNode } from './ObjectCriteriaNode';
import { ArrayCriteriaNode } from './ArrayCriteriaNode';
import { ScalarCriteriaNode } from './ScalarCriteriaNode';
import { CriteriaNode } from './CriteriaNode';
import type { ICriteriaNode } from '../typings';

/**
 * @internal
 */
export class CriteriaNodeFactory {

  static createNode<T extends object>(metadata: MetadataStorage, entityName: string, payload: any, parent?: ICriteriaNode<T>, key?: EntityKey<T>): ICriteriaNode<T> {
    const customExpression = CriteriaNode.isCustomExpression(key || '');
    const scalar = Utils.isPrimaryKey(payload) || payload as unknown instanceof RegExp || payload as unknown instanceof Date || customExpression;

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
      n.index = key === '$and' ? index : undefined; // we care about branching only for $and

      return n;
    });

    return node;
  }

  static createObjectNode<T extends object>(metadata: MetadataStorage, entityName: string, payload: Dictionary, parent?: ICriteriaNode<T>, key?: EntityKey<T>): ICriteriaNode<T> {
    const meta = metadata.find(entityName);

    const node = new ObjectCriteriaNode(metadata, entityName, parent, key);
    node.payload = Object.keys(payload).reduce((o, item) => {
      o[item] = this.createObjectItemNode(metadata, entityName, node, payload, item, meta);
      return o;
    }, {} as Dictionary);

    return node;
  }

  static createObjectItemNode<T extends object>(metadata: MetadataStorage, entityName: string, node: ICriteriaNode<T>, payload: Dictionary, key: EntityKey<T>, meta?: EntityMetadata<T>) {
    const prop = meta?.properties[key];

    if (prop?.kind !== ReferenceKind.EMBEDDED) {
      const childEntity = prop && prop.kind !== ReferenceKind.SCALAR ? prop.type : entityName;
      return this.createNode(metadata, childEntity, payload[key], node, key);
    }

    const operator = Object.keys(payload[key]).some(f => Utils.isOperator(f));

    if (operator) {
      throw ValidationError.cannotUseOperatorsInsideEmbeddables(entityName, prop.name, payload);
    }

    const map = Object.keys(payload[key]).reduce((oo, k) => {
      if (!prop.embeddedProps[k]) {
        throw ValidationError.invalidEmbeddableQuery(entityName, k, prop.type);
      }

      oo[prop.embeddedProps[k].name] = payload[key][k];
      return oo;
    }, {} as Dictionary);

    return this.createNode(metadata, entityName, map, node, key);
  }

}
