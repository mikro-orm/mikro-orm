import type { AnyEntity, EntityMetadata, PopulateOptions } from '../typings';
import type { Collection } from '../entity/Collection';
import { Utils } from '../utils/Utils';
import { helper } from '../entity/wrap';
import type { Configuration } from '../utils/Configuration';

/**
 * Helper that allows to keep track of where we are currently at when serializing complex entity graph with cycles.
 * Before we process a property, we call `visit` that checks if it is not a cycle path (but allows to pass cycles that
 * are defined in populate hint). If not, we proceed and call `leave` afterwards.
 */
export class SerializationContext<T> {

  readonly path: [string, string][] = [];
  readonly visited = new Set<AnyEntity>();
  private entities = new Set<AnyEntity>();

  constructor(private readonly config: Configuration,
              private readonly populate: PopulateOptions<T>[] = [],
              private readonly fields?: string[]) {}

  /**
   * Returns true when there is a cycle detected.
   */
  visit(entityName: string, prop: string): boolean {
    if (!this.path.find(([cls, item]) => entityName === cls && prop === item)) {
      this.path.push([entityName, prop]);
      return false;
    }

    // check if the path is explicitly populated
    if (!this.isMarkedAsPopulated(entityName, prop)) {
      return true;
    }

    this.path.push([entityName, prop]);
    return false;
  }

  leave<U>(entityName: string, prop: string) {
    const last = this.path.pop();

    /* istanbul ignore next */
    if (!last || last[0] !== entityName || last[1] !== prop) {
      throw new Error(`Trying to leave wrong property: ${entityName}.${prop} instead of ${last?.join('.')}`);
    }
  }

  close() {
    this.entities.forEach(entity => {
      delete helper(entity).__serializationContext.root;
    });
  }

  /**
   * When initializing new context, we need to propagate it to the whole entity graph recursively.
   */
  static propagate(root: SerializationContext<AnyEntity>, entity: AnyEntity, isVisible: (meta: EntityMetadata, prop: string) => boolean): void {
    root.register(entity);
    const meta = helper(entity).__meta;

    const items: AnyEntity[] = [];
    Object.keys(entity)
      .filter(key => isVisible(meta, key))
      .forEach(key => {
        if (Utils.isEntity(entity[key], true)) {
          items.push(entity[key]);
        } else if (Utils.isCollection(entity[key])) {
          items.push(...(entity[key] as Collection<any>).getItems(false));
        }
      });

    items
      .filter(item => !item.__helper!.__serializationContext.root)
      .forEach(item => this.propagate(root, item, isVisible));
  }

  isMarkedAsPopulated(entityName: string, prop: string): boolean {
    let populate: PopulateOptions<T>[] | undefined = this.populate;

    for (const segment of this.path) {
      if (!populate) {
        return false;
      }

      const exists = populate.find(p => p.field === segment[1]) as PopulateOptions<T>;

      if (exists) {
        // we need to check for cycles here too, as we could fall into endless loops for bidirectional relations
        if (exists.all) {
          return !this.path.find(([cls, item]) => entityName === cls && prop === item);
        }

        populate = exists.children as PopulateOptions<T>[];
      }
    }

    return !!populate?.some(p => p.field === prop);
  }

  isPartiallyLoaded(entityName: string, prop: string): boolean {
    if (!this.fields) {
      return true;
    }

    let fields: string[] = this.fields;

    for (const segment of this.path) {
      if (fields.length === 0) {
        return true;
      }

      fields = fields
        .filter(field => field.startsWith(`${segment[1]}.`) || field === '*')
        .map(field => field === '*' ? field : field.substring(segment[1].length + 1));
    }

    return fields.some(p => p === prop || p === '*');
  }

  private register(entity: AnyEntity) {
    helper(entity).__serializationContext.root = this;
    this.entities.add(entity);
  }

}
