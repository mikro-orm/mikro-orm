import { Collection } from './Collection';
import { AnyEntity, EntityData, EntityMetadata, IPrimaryKey, PopulateOptions } from '../typings';
import { Reference } from './Reference';
import { wrap } from './wrap';
import { Platform } from '../platforms';
import { Utils } from '../utils/Utils';

/**
 * Helper that allows to keep track of where we are currently at when serializing complex entity graph with cycles.
 * Before we process a property, we call `visit` that checks if it is not a cycle path (but allows to pass cycles that
 * are defined in populate hint). If not, we proceed and call `leave` afterwards.
 */
export class SerializationContext<T extends AnyEntity<T>> {

  readonly path: [string, string][] = [];

  constructor(private readonly populate: PopulateOptions<T>[]) { }

  visit(entityName: string, prop: string): boolean {
    if (!this.path.find(([cls, item]) => entityName === cls && prop === item)) {
      this.path.push([entityName, prop]);
      return false;
    }

    // check if the path is explicitly populated
    if (!this.isMarkedAsPopulated(prop)) {
      return true;
    }

    this.path.push([entityName, prop]);
    return false;
  }

  leave<U>(entityName: string, prop: string) {
    const last = this.path.pop();

    /* istanbul ignore next */
    if (!last || last[0] !== entityName || last[1] !== prop) {
      throw new Error(`Trying to leave wrong property: ${entityName}.${prop} instead of ${last}`);
    }
  }

  /**
   * When initializing new context, we need to propagate it to the whole entity graph recursively.
   */
  static propagate(root: SerializationContext<AnyEntity>, entity: AnyEntity): void {
    entity.__helper!.__serializationContext.root = root;

    const items: AnyEntity[] = [];
    Object.keys(entity).forEach(key => {
      if (Utils.isEntity(entity[key], true)) {
        items.push(entity[key]);
      } else if (Utils.isCollection(entity[key])) {
        items.push(...(entity[key] as Collection<any>).getItems(false));
      }
    });

    items
      .filter(item => !item.__helper!.__serializationContext.root)
      .forEach(item => this.propagate(root, item));
  }

  private isMarkedAsPopulated(prop: string): boolean {
    let populate: PopulateOptions<T>[] | undefined = this.populate;

    for (const segment of this.path) {
      if (!populate) {
        return false;
      }

      const exists = populate.find(p => p.field === segment[1]) as PopulateOptions<T>;

      if (exists) {
        populate = exists.children;
      }
    }

    return !!populate?.find(p => p.field === prop);
  }

}

export class EntityTransformer {

  static toObject<T extends AnyEntity<T>>(entity: T, ignoreFields: string[] = [], raw = false): EntityData<T> {
    const wrapped = entity.__helper!;
    let contextCreated = false;

    if (!wrapped.__serializationContext.root) {
      const root = new SerializationContext<T>(wrapped.__serializationContext.populate ?? []);
      SerializationContext.propagate(root, entity);
      contextCreated = true;
    }

    const root = wrapped.__serializationContext.root;
    const meta = entity.__meta!;
    const ret = {} as EntityData<T>;
    const keys = new Set<string>();

    if (meta.serializedPrimaryKey && !meta.compositePK) {
      keys.add(meta.serializedPrimaryKey);
    } else {
      meta.primaryKeys.forEach(pk => keys.add(pk));
    }

    if (wrapped.isInitialized() || !wrapped.hasPrimaryKey()) {
      Object.keys(entity).forEach(prop => keys.add(prop));
    }

    [...keys]
      .filter(prop => this.isVisible<T>(meta, prop, ignoreFields))
      .map(prop => {
        const cycle = root!.visit(meta.className, prop);

        if (cycle) {
          return [prop, undefined];
        }

        const val = EntityTransformer.processProperty<T>(prop as keyof T & string, entity, raw);
        root!.leave(meta.className, prop);

        return [prop, val];
      })
      .filter(([, value]) => typeof value !== 'undefined')
      .forEach(([prop, value]) => ret[this.propertyName(meta, prop as keyof T & string, entity.__platform)] = value as T[keyof T & string]);

    if (!wrapped.isInitialized() && wrapped.hasPrimaryKey()) {
      return ret;
    }

    // decorated getters
    meta.props
      .filter(prop => prop.getter && !prop.hidden && typeof entity[prop.name] !== 'undefined')
      .forEach(prop => ret[this.propertyName(meta, prop.name, entity.__platform)] = entity[prop.name]);

    // decorated get methods
    meta.props
      .filter(prop => prop.getterName && !prop.hidden && entity[prop.getterName] as unknown instanceof Function)
      .forEach(prop => ret[this.propertyName(meta, prop.name, entity.__platform)] = (entity[prop.getterName!] as unknown as () => T[keyof T & string])());

    if (contextCreated) {
      delete wrapped.__serializationContext.root;
    }

    return ret;
  }

  private static isVisible<T extends AnyEntity<T>>(meta: EntityMetadata<T>, propName: string, ignoreFields: string[]): boolean {
    const prop = meta.properties[propName];
    const visible = prop && !prop.hidden;
    const prefixed = prop && !prop.primary && propName.startsWith('_'); // ignore prefixed properties, if it's not a PK

    return visible && !prefixed && !ignoreFields.includes(propName);
  }

  private static propertyName<T extends AnyEntity<T>>(meta: EntityMetadata<T>, prop: keyof T & string, platform?: Platform): keyof T & string {
    if (meta.properties[prop].serializedName) {
      return meta.properties[prop].serializedName as keyof T & string;
    }

    if (meta.properties[prop].primary && platform) {
      return platform.getSerializedPrimaryKeyField(prop) as keyof T & string;
    }

    return prop;
  }

  private static processProperty<T extends AnyEntity<T>>(prop: keyof T & string, entity: T, raw: boolean): T[keyof T] | undefined {
    const property = entity.__meta!.properties[prop];

    /* istanbul ignore next */
    const serializer = property?.serializer;

    if (serializer) {
      return serializer(entity[prop]);
    }

    if (Utils.isCollection(entity[prop])) {
      return EntityTransformer.processCollection(prop, entity, raw);
    }

    if (Utils.isEntity(entity[prop], true)) {
      return EntityTransformer.processEntity(prop, entity, entity.__platform!, raw);
    }

    /* istanbul ignore next */
    const customType = property?.customType;

    if (customType) {
      return customType.toJSON(entity[prop], entity.__platform!);
    }

    return entity.__platform!.normalizePrimaryKey(entity[prop] as unknown as IPrimaryKey) as unknown as T[keyof T];
  }

  private static processEntity<T extends AnyEntity<T>>(prop: keyof T, entity: T, platform: Platform, raw: boolean): T[keyof T] | undefined {
    const child = entity[prop] as unknown as T | Reference<T>;
    const wrapped = (child as T).__helper!;

    if (raw && wrapped.isInitialized() && child !== entity) {
      return wrapped.toPOJO() as unknown as T[keyof T];
    }

    if (wrapped.isInitialized() && wrapped.__populated && child !== entity && !wrapped.__lazyInitialized) {
      const args = [...wrapped.__meta.toJsonParams.map(() => undefined)];
      return wrap(child).toJSON(...args) as T[keyof T];
    }

    return platform.normalizePrimaryKey(wrapped.getPrimaryKey() as IPrimaryKey) as unknown as T[keyof T];
  }

  private static processCollection<T extends AnyEntity<T>>(prop: keyof T, entity: T, raw: boolean): T[keyof T] | undefined {
    const col = entity[prop] as unknown as Collection<AnyEntity>;

    if (raw && col.isInitialized(true)) {
      return col.getItems().map(item => wrap(item).toPOJO()) as unknown as T[keyof T];
    }

    if (col.isInitialized(true) && col.shouldPopulate()) {
      return col.toArray() as unknown as T[keyof T];
    }

    if (col.isInitialized()) {
      return col.getIdentifiers() as unknown as T[keyof T];
    }
  }

}
