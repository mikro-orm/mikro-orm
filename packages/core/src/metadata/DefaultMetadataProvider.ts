import { MetadataProvider } from './MetadataProvider.js';
import { Utils } from '../utils/Utils.js';
import type { EntityMetadata } from '../typings.js';

export class DefaultMetadataProvider extends MetadataProvider {

  loadEntityMetadata(meta: EntityMetadata): void {
    for (const prop of meta.props) {
      if (typeof prop.entity === 'string') {
        prop.type = prop.entity;
      } else if (prop.entity) {
        const tmp = prop.entity();
        prop.type = Array.isArray(tmp) ? tmp.map(t => Utils.className(t)).sort().join(' | ') : Utils.className(tmp);
      } else if (!prop.type && !(prop.enum && (prop.items?.length ?? 0) > 0)) {
        throw new Error(`Please provide either 'type' or 'entity' attribute in ${meta.className}.${prop.name}.`);
      }
    }
  }

}
