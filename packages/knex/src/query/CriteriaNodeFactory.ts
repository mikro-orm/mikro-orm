import { ReferenceType, Utils, ValidationError, type Dictionary, type EntityMetadata, type MetadataStorage } from '@mikro-orm/core';
import { ObjectCriteriaNode } from './ObjectCriteriaNode';
import { ArrayCriteriaNode } from './ArrayCriteriaNode';
import { ScalarCriteriaNode } from './ScalarCriteriaNode';
import { CriteriaNode } from './CriteriaNode';
import type { ICriteriaNode } from '../typings';

/**
 * @internal
 */
export class CriteriaNodeFactory {

  static createNode(metadata: MetadataStorage, entityName: string, payload: any, parent?: ICriteriaNode, key?: string): ICriteriaNode {
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

  static createScalarNode(metadata: MetadataStorage, entityName: string, payload: any, parent?: ICriteriaNode, key?: string): ICriteriaNode {
    const node = new ScalarCriteriaNode(metadata, entityName, parent, key);
    node.payload = payload;

    return node;
  }

  static createArrayNode(metadata: MetadataStorage, entityName: string, payload: any[], parent?: ICriteriaNode, key?: string): ICriteriaNode {
    const node = new ArrayCriteriaNode(metadata, entityName, parent, key);
    node.payload = payload.map((item, index) => {
      const n = this.createNode(metadata, entityName, item, node);
      n.index = key === '$and' ? index : undefined; // we care about branching only for $and

      return n;
    });

    return node;
  }

  static createObjectNode(metadata: MetadataStorage, entityName: string, payload: Dictionary, parent?: ICriteriaNode, key?: string): ICriteriaNode {
    const meta = metadata.find(entityName);

    const node = new ObjectCriteriaNode(metadata, entityName, parent, key);
    node.payload = Object.keys(payload).reduce((o, item) => {
      o[item] = this.createObjectItemNode(metadata, entityName, node, payload, item, meta);
      return o;
    }, {});

    return node;
  }

  static createObjectItemNode(metadata: MetadataStorage, entityName: string, node: ICriteriaNode, payload: Dictionary, item: string, meta?: EntityMetadata) {
    const prop = meta?.properties[item];

    if (prop?.reference !== ReferenceType.EMBEDDED) {
      const childEntity = prop && prop.reference !== ReferenceType.SCALAR ? prop.type : entityName;
      return this.createNode(metadata, childEntity, payload[item], node, item);
    }

    const operator = Object.keys(payload[item]).some(f => Utils.isOperator(f));

    if (operator) {
      throw ValidationError.cannotUseOperatorsInsideEmbeddables(entityName, prop.name, payload);
    }

    const map = Object.keys(payload[item]).reduce((oo, k) => {
      if (!prop.embeddedProps[k]) {
        throw ValidationError.invalidEmbeddableQuery(entityName, k, prop.type);
      }

      oo[prop.embeddedProps[k].name] = payload[item][k];
      return oo;
    }, {});

    return this.createNode(metadata, entityName, map, node, item);
  }

}
