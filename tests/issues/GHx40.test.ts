import { Entity, ManyToOne, PrimaryKey, Property, type Ref, ref } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Building7574 {

  @PrimaryKey() id!: number;
  @Property() reference!: number;
  @Property() name!: string;

}

@Entity()
class Unit7574 {

  @PrimaryKey() id!: number;
  @Property() reference!: number;

  @ManyToOne(() => Building7574, { ref: true })
  building!: Ref<Building7574>;

  // getter-only virtual property that accesses a relation
  @Property({ persist: false })
  get buildingReference(): number {
    if (!this.building?.isInitialized()) {
      return 0;
    }
    return this.building.getEntity().reference;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Building7574, Unit7574],
  });
  await orm.schema.refreshDatabase();
  orm.em.create(Building7574, { id: 1, reference: 900000, name: 'Test Building' });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

// assignDefaultValues should not try to set getter-only properties
test('em.create() with plain-object FK and getter-only property should not throw', () => {
  orm.em.clear();
  expect(() => {
    orm.em.create(Unit7574, { id: 1, reference: 42, building: { id: 1 } } as any, { persist: false, partial: true });
  }).not.toThrow();
});

test('em.create() with ref() FK and getter-only property should not throw', () => {
  orm.em.clear();
  expect(() => {
    orm.em.create(Unit7574, { id: 2, reference: 42, building: ref(Building7574, 1) } as any, {
      persist: false,
      partial: true,
    });
  }).not.toThrow();
});
