import { readFileSync } from 'fs';
import { EntityMetadata, EntityProperty } from './BaseEntity';
import { CollectionAttributes } from './Collection';
import { Options } from './MikroORM';

const KNOWN_TYPES = ['int', 'string', 'number', 'object', 'array', 'boolean', 'date'];

/**
 * for future support of vanilla node usage
 */
export class AnnotationParser {

  constructor(private options: Options) { }

  getMetadata(path: string): EntityMetadata {
    const source = readFileSync(`${this.options.baseDir}/${path}`).toString();
    const lines = source.split(/\n/g);
    const meta = { path: `${this.options.baseDir}/${path}`, properties: {} } as EntityMetadata;
    let entityDocBlock = false;

    lines.forEach(line => {
      if (line.includes('class')) {
        const m = line.match(/class\s*(\w+)/);
        return meta.name = m[1];
      }

      if (line.includes('constructor')) {
        const m = line.match(/constructor\s*\(([\w\s,$]+)\)/);
        return meta.constructorParams = m[1].split(/,\s*/g);
      }

      if (line.includes('@entity')) {
        return entityDocBlock = true;
      }

      if (entityDocBlock) {
        return entityDocBlock = this.parseDocBlock(line, meta);
      }
    });

    if (!meta.collection) {
      meta.collection = meta.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    return meta;
  }

  private parseDocBlock(line: string, meta: EntityMetadata) {
    if (line.includes('*/')) {
      return false;
    }

    if (line.includes('@collection')) {
      const m = line.match(/@collection\s*([\w-]+)/);
      meta.collection = m[1];
    }

    if (line.includes('@property')) {
      this.processProperty(line, meta);
    }

    return true;
  }

  private processProperty(line: string, meta: EntityMetadata) {
    line = line.substr(line.indexOf('@property') + 9).trim();
    const m = line.match(/{([\w[\]]+)}\s*(\w+)(\s*{([\w\s=,.[\]+]+)})?/);
    const attributes = {} as CollectionAttributes;

    const property = {
      name: m[2],
      type: m[1],
      reference: !KNOWN_TYPES.includes(m[1].toLowerCase().replace(/\[]$/, '')),
    } as EntityProperty;
    property.collection = property.reference && m[1].endsWith('[]');

    if (m[4]) {
      m[4].split(/,\s*/g).forEach(attr => {
        // TODO fix comma issue inside array attribute values {asd=dsa, cascade=[foo, bar]}
        // attr = attr.replace(/\[((\w+),\s*)*(\w+)]/g, m => m[0].replace(',', '~'));
        const [a, b] = attr.trim().split(/\s*=\s*/);
        attributes[a] = (b.includes('+') ? b.split(/\+/g) : b);
      });
    }

    property.attributes = attributes;
    meta.properties[property.name] = property;
  }

}
