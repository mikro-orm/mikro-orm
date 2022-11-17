import type { AnyEntity, EntityMetadata, PopulateOptions } from '../typings';
import type { Collection } from '../entity/Collection';
import { Utils } from '../utils/Utils';
import { helper } from '../entity/wrap';

/**
 * Helper that allows to keep track of where we are currently at when serializing complex entity graph with cycles.
 * Before we process a property, we call `visit` that checks if it is not a cycle path (but allows to pass cycles that
 * are defined in populate hint). If not, we proceed and call `leave` afterwards.
 */
export class SerializationContext<T> {
	readonly path: [string, string][] = [];
	readonly visited = new Set<AnyEntity>();
	private entities = new Set<AnyEntity>();

	constructor(private readonly populate: PopulateOptions<T>[] = []) {}

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
			throw new Error(`Trying to leave wrong property: ${entityName}.${prop} instead of ${last?.join('.')}`);
		}
	}

	close() {
		this.entities.forEach((entity) => {
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
			.filter((key) => isVisible(meta, key))
			.forEach((key) => {
				if (Utils.isEntity(entity[key], true)) {
					items.push(entity[key]);
				} else if (Utils.isCollection(entity[key])) {
					items.push(...(entity[key] as Collection<any>).getItems(false));
				}
			});

		items.filter((item) => !item.__helper!.__serializationContext.root).forEach((item) => this.propagate(root, item, isVisible));
	}

	private isMarkedAsPopulated(prop: string): boolean {
		let populate: PopulateOptions<T>[] | undefined = this.populate;

		for (const segment of this.path) {
			if (!populate) {
				return false;
			}

			const exists = populate.find((p) => p.field === segment[1]) as PopulateOptions<T>;

			if (exists) {
				populate = exists.children;
			}
		}

		return !!populate?.find((p) => p.field === prop);
	}

	private register(entity: AnyEntity) {
		helper(entity).__serializationContext.root = this;
		this.entities.add(entity);
	}
}
