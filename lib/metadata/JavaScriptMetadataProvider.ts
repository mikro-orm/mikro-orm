import { MetadataProvider } from './MetadataProvider';
import { EntityMetadata, EntityProperty } from '../types';
import { Utils } from '../utils';
import { Cascade, ReferenceType } from '../entity';

export class JavaScriptMetadataProvider extends MetadataProvider {

  async loadEntityMetadata(meta: EntityMetadata, name: string): Promise<void> {
    const schema = this.getSchema(meta);
    Object.entries(schema.properties).forEach(([name, prop]) => {
      if (Utils.isString(prop)) {
        schema.properties[name] = { type: prop };
      }
    });

    Utils.merge(meta, schema);
    Object.entries(meta.properties).forEach(([name, prop]) => {
      this.initProperty(prop, name);
    });
  }

  /**
   * Re-hydrates missing attributes like `onUpdate` (functions are lost when caching to JSON)
   */
  loadFromCache(meta: EntityMetadata, cache: EntityMetadata): void {
    Utils.merge(meta, cache);
    const schema = this.getSchema(meta);

    Object.entries(schema.properties).forEach(([name, prop]) => {
      if (Utils.isObject(prop)) {
        Object.entries(prop).forEach(([attribute, value]) => {
          if (!(attribute in meta.properties[name])) {
            meta.properties[name][attribute] = value;
          }
        });
      }
    });
  }

  private initProperty(prop: EntityProperty, propName: string): void {
    prop.name = propName;

    if (typeof prop.reference === 'undefined') {
      prop.reference = ReferenceType.SCALAR;
    }

    if (prop.reference !== ReferenceType.SCALAR && typeof prop.cascade === 'undefined') {
      prop.cascade = [Cascade.PERSIST, Cascade.MERGE];
    }
  }

  private getSchema(meta: EntityMetadata) {
    const path = Utils.absolutePath(meta.path, this.config.get('baseDir'));
    const { schema } = require(path);

    return schema;
  }

}
