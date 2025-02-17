import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, SimpleLogger, Type } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

class Id {

  readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

}

class IdType extends Type<Id, string> {

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
    return 'string';
  }

  override getColumnType() {
    return 'text';
  }

}
@Entity()
class ParentEntity {

  @PrimaryKey({ type: IdType, autoincrement: false })
  id!: Id;

  @OneToMany({
    entity: () => ChildEntity,
    mappedBy: 'parent',
    orphanRemoval: true,
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

  const parent = new ParentEntity();
  parent.id = new Id('1');

  const child = new ChildEntity();
  child.id = new Id('123');
  parent.children.add(child);

  await orm.em.fork().persistAndFlush(parent);
});

afterAll(async () => {
  await orm.close();
});

test('should remove child entities', async () => {
  const parent = await orm.em.createQueryBuilder(ParentEntity, 'p')
    .leftJoinAndSelect('p.children', 'c')
    .where({ id: 1 })
    .getSingleResult();

  parent!.children.removeAll();

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ["[query] delete from `child_entity` where `id` in ('123')"],
    ['[query] commit'],
  ]);

  const records = await orm.em.count(ChildEntity);
  expect(records).toBe(0);
});
