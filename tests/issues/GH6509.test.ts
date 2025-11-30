import { Collection, EntitySchema, MikroORM } from '@mikro-orm/sqlite';

class BaseEntity {

  id!: number;
  name!: string;
  type!: string;
  parent?: ParentEntity;
  mids = new Collection<MidEntity>(this);

}

class MidEntity extends BaseEntity {

  items = new Collection<BaseEntity>(this);
  parentMid?: MidEntity;
  childMids = new Collection<MidEntity>(this);

}

class ParentEntity extends MidEntity {

  elements = new Collection<BaseEntity>(this);

}

const BaseSchema = new EntitySchema<BaseEntity>({
  class: BaseEntity,
  discriminatorColumn: 'type',
  discriminatorValue: 'base',
  properties: {
    id: { type: 'number', primary: true },
    name: { type: 'string' },
    type: { type: 'string' },
    parent: { kind: 'm:1', entity: () => 'ParentEntity', nullable: true },
    mids: {
      kind: 'm:n',
      entity: () => 'MidEntity',
      mappedBy: 'items',
    },
  },
});

const MidSchema = new EntitySchema<MidEntity, BaseEntity>({
  class: MidEntity,
  extends: BaseSchema,
  discriminatorValue: 'mid',
  properties: {
    items: {
      kind: 'm:n',
      entity: () => 'BaseEntity',
      owner: true,
      pivotTable: 'base_entity_mid',
      joinColumn: 'mid_id',
      inverseJoinColumn: 'base_entity_id',
    },
    parentMid: {
      kind: 'm:1',
      entity: () => 'MidEntity',
      nullable: true,
    },
    childMids: {
      kind: '1:m',
      entity: () => 'MidEntity',
      mappedBy: 'parentMid',
    },
  },
});

const ParentSchema = new EntitySchema({
  class: ParentEntity,
  extends: MidSchema,
  discriminatorValue: 'parent',
  properties: {
    elements: {
      kind: '1:m',
      entity: () => 'BaseEntity',
      mappedBy: 'parent',
    },
  },
});

test('GH #6509', async () => {
  const schemas = [BaseSchema, MidSchema, ParentSchema];

  const orm1 = await MikroORM.init({
    entities: schemas,
    dbName: ':memory:',
    contextName: 'orm1',
    ensureDatabase: { create: true },
  });

  const em1 = orm1.em.fork();
  const baseEntity1 = new BaseEntity();
  baseEntity1.name = 'Base Entity 1';
  await em1.persist(baseEntity1).flush();
  await orm1.close();

  const orm2 = await MikroORM.init({
    entities: schemas,
    dbName: ':memory:',
    contextName: 'orm2',
    ensureDatabase: { create: true },
  });

  const em2 = orm2.em.fork();
  const baseEntity2 = new BaseEntity();
  baseEntity2.name = 'Base Entity 2';
  await em2.persist(baseEntity2).flush();
  await orm2.close();

  const orm3 = await MikroORM.init({
    entities: schemas,
    dbName: ':memory:',
    contextName: 'orm3',
    ensureDatabase: { create: true },
  });

  const em3 = orm3.em.fork();
  const baseEntity3 = new BaseEntity();
  baseEntity3.name = 'Base Entity 3';
  await em3.persist(baseEntity3).flush();

  // Close third ORM
  await orm3.close();
});
