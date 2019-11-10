import { MetadataStorage } from '../metadata';
import { EntityProperty, AnyEntity } from '../types';
import { Utils } from '../utils';

export function Index(options: IndexOptions = {}): Function {
    return function (target: AnyEntity, propertyName: string) {
        const meta = MetadataStorage.getMetadata(target.constructor.name);
        Utils.lookupPathFromDecorator(meta);
        const indexName = Utils.isString(options.name) ? options.name : true;
        options.name = propertyName;
        meta.index = options.name;
        meta.properties[propertyName] = Object.assign({ index: indexName }, options) as EntityProperty;
    };
}

export interface IndexOptions {
    type?: any;
    name?: string;
}
