import { MetadataProvider } from './MetadataProvider';
import { Cascade, EntityMetadata, EntityProperty, ReferenceType } from '../decorators/Entity';

export class JavaScriptMetadataProvider extends MetadataProvider {

  discover(meta: EntityMetadata, name: string): void {
    const { schema } = require(meta.path);
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
