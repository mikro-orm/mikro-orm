import type { EntityKey, EntityMetadata, EntityProperty, PopulateOptions } from '../typings.js';
import { type LoadStrategy, PopulatePath, ReferenceKind } from '../enums.js';
import { Utils } from '@mikro-orm/core';

/**
 * Expands `books.perex` like populate to use `children` array instead of the dot syntax
 */
function expandNestedPopulate<Entity>(parentProp: EntityProperty, parts: string[], strategy?: LoadStrategy, all?: boolean): PopulateOptions<Entity> {
  const meta = parentProp.targetMeta! as EntityMetadata<Entity>;
  const field = parts.shift()! as EntityKey<Entity>;
  const prop = meta.properties[field];
  const ret = { field, strategy, all } as PopulateOptions<Entity>;

  if (parts.length > 0) {
    ret.children = [expandNestedPopulate(prop, parts, strategy)];
  }

  return ret;
}

/**
 * @internal
 */
export function expandDotPaths<Entity>(meta: EntityMetadata<Entity>, populate?: readonly (string | PopulateOptions<Entity>)[], normalized = false) {
  const ret = normalized ? populate as PopulateOptions<Entity>[] : Utils.asArray(populate).map(field => {
    if (typeof field === 'string') {
      return { field } as PopulateOptions<Entity>;
    }

    /* v8 ignore next 3 */
    return typeof field === 'boolean' || field.field === PopulatePath.ALL
      ? { all: !!field, field: meta.primaryKeys[0] } as PopulateOptions<Entity>
      : field;
  });

  for (const p of ret) {
    if (!p.field.includes('.')) {
      continue;
    }

    const [f, ...parts] = p.field.split('.');
    p.field = f as EntityKey<Entity>;
    p.children ??= [];
    const prop = meta.properties[p.field];
    p.strategy ??= prop.strategy;

    if (parts[0] === PopulatePath.ALL) {
      prop.targetMeta!.props
        .filter(prop => prop.lazy || prop.kind !== ReferenceKind.SCALAR)
        .forEach(prop => p.children!.push({ field: prop.name as EntityKey, strategy: p.strategy }));
    } else if (prop.kind === ReferenceKind.EMBEDDED) {
      const embeddedProp = Object.values(prop.embeddedProps).find(c => c.embedded![1] === parts[0]);
      ret.push({
        ...p,
        field: embeddedProp!.name as EntityKey,
        children: parts.length > 1 ? [expandNestedPopulate(embeddedProp!, parts.slice(1), p.strategy, p.all)] : [],
      });
      p.children.push(expandNestedPopulate(prop, parts, p.strategy, p.all));
    } else {
      p.children.push(expandNestedPopulate(prop, parts, p.strategy, p.all));
    }
  }

  return ret;
}
