import { MetadataProvider } from './MetadataProvider';
import { Cascade, EntityMetadata, EntityProperty, ReferenceType } from '../decorators/Entity';

export class JavaScriptMetadataProvider extends MetadataProvider {

  discover(meta: EntityMetadata, name: string): void {
    const { schema } = require(meta.path);
    Object.entries(schema.properties).forEach(([name, prop]) => {
      if (typeof schema.properties[name] === 'string') {
        schema.properties[name] = { type: prop };
      }
    });
    Object.assign(meta, schema);
    Object.entries(meta.properties).forEach(([name, prop]) => {
      this.initProperty(prop, name);
    });
  }

  private initProperty(prop: EntityProperty, propName: string): void {
    prop.name = propName;

    if (typeof prop.reference === 'undefined') {
      prop.reference = ReferenceType.SCALAR;
    }

    if (prop.reference !== ReferenceType.SCALAR && typeof prop.cascade === 'undefined') {
      prop.cascade = [Cascade.PERSIST];
    }
  }

}
