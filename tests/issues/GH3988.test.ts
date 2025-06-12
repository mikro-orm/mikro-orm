import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, SimpleLogger, Type } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

class Id {

  readonly value: number;

  constructor(value: number) {
    this.value = value;
  }

  toString() {
    return '' + this.value;
  }

}

export class IdType extends Type<Id, string> {

  override convertToDatabaseValue(value: any) {
    if (value instanceof Id) {
      return value.value;
    }

    return value;
  }

  override convertToJSValue(value: any) {
    if (typeof value === 'string') {
      const id = Object.create(Id.prototype);

      return Object.assign(id, {
        value,
      });
    }

    return value;
  }

  override compareAsType() {
    return 'number';
  }

  override getColumnType() {
    return 'integer';
  }

}

@Entity()
class ParentEntity {

  @PrimaryKey({ type: IdType, autoincrement: false })
  id!: Id;

  @PrimaryKey({ type: IdType, autoincrement: false })
  id2!: Id;

  @OneToMany({
    entity: () => ChildEntity,
    mappedBy: 'parent',
  })
  children = new Collection<ChildEntity>(this);

}

@Entity()
class ChildEntity {

  @PrimaryKey({ type: IdType, autoincrement: false })
  id!: Id;

  @ManyToOne(() => ParentEntity)
  parent!: ParentEntity;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [ParentEntity, ChildEntity],
    dbName: ':memory:',
    loggerFactory: SimpleLogger.create,
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close();
});

it('should create and persist entity along with child entity', async () => {
  // Create parent
  const parent = new ParentEntity();
  parent.id = new Id(1);
  parent.id2 = new Id(2);

  // Create child
  const child = new ChildEntity();
  child.id = new Id(1);

  // Add child to parent
  parent.children.add(child);

  const mock = mockLogger(orm);
  await orm.em.persistAndFlush(parent);
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ['[query] insert into `parent_entity` (`id`, `id2`) values (1, 2)'],
    ['[query] insert into `child_entity` (`id`, `parent_id`, `parent_id2`) values (1, 1, 2)'],
    ['[query] commit'],
  ]);
});
