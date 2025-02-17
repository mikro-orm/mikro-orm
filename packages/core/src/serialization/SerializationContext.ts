import type { AnyEntity, EntityMetadata, PopulateOptions } from '../typings.js';
import { Utils } from '../utils/Utils.js';
import { helper } from '../entity/wrap.js';
import type { Configuration } from '../utils/Configuration.js';

/**
 * Helper that allows to keep track of where we are currently at when serializing complex entity graph with cycles.
 * Before we process a property, we call `visit` that checks if it is not a cycle path (but allows to pass cycles that
 * are defined in populate hint). If not, we proceed and call `leave` afterwards.
 */
export class SerializationContext<T extends object> {

  readonly path: [string, string][] = [];
  readonly visited = new Set<AnyEntity>();
  private entities = new Set<AnyEntity>();

  constructor(private readonly config: Configuration,
              private readonly populate: PopulateOptions<T>[] = [],
              private readonly fields?: Set<string>,
              private readonly exclude?: string[]) {}

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

    /* v8 ignore next 3 */
    if (!last || last[0] !== entityName || last[1] !== prop) {
      throw new Error(`Trying to leave wrong property: ${entityName}.${prop} instead of ${last?.join('.')}`);
    }
  }

  close() {
    for (const entity of this.entities) {
      delete helper(entity).__serializationContext.root;
    }
  }

  /**
   * When initializing new context, we need to propagate it to the whole entity graph recursively.
   */
  static propagate(root: SerializationContext<any>, entity: AnyEntity, isVisible: (meta: EntityMetadata, prop: string) => boolean): void {
    root.register(entity);
    const meta = helper(entity).__meta;

    for (const key of Object.keys(entity)) {
      if (!isVisible(meta, key)) {
        continue;
      }

      const target = entity[key];

      if (Utils.isEntity<AnyEntity>(target, true)) {
        if (!target.__helper!.__serializationContext.root) {
          this.propagate(root, target, isVisible);
        }

        continue;
      }

      if (Utils.isCollection(target)) {
        for (const item of target.getItems(false)) {
          if (!(item as AnyEntity).__helper!.__serializationContext.root) {
            this.propagate(root, item, isVisible);
          }
        }
      }
    }
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

    let fields: string[] = [...this.fields];

    for (const segment of this.path) {
      /* v8 ignore next 3 */
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
    helper(entity as T).__serializationContext.root = this;
    this.entities.add(entity);
  }

}
