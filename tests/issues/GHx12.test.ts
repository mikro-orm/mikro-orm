import { LoadStrategy } from '@mikro-orm/core';
import { Entity, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

@Entity()
class TestResourceEntity {

  @PrimaryKey()
  id = v4();

  @Property({ type: 'character varying' })
  entityDirect: any;

  @OneToOne({
    entity: () => TestResourceReferenceEntity,
    persist: false,
  })
  resourceReference?: TestResourceReferenceEntity | null;

  @Property({ type: 'character', length: 24, nullable: true })
  resourceReferenceId?: string;

}

@Entity()
class TestResourceReferenceEntity {

  @PrimaryKey()
  id = v4();

  @Property({ type: 'character varying' })
  refEntityDirect: any;

}

let orm: MikroORM;
const id = v4();

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [TestResourceEntity, TestResourceReferenceEntity],
  });
  await orm.schema.create();

  const resourceReferenceId = v4();
  orm.em.create(TestResourceEntity, {
    id,
    entityDirect: 'Foo',
    resourceReferenceId,
    resourceReference: { id: resourceReferenceId, refEntityDirect: 'Bar' },
  });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => await orm.close(true));
beforeEach(async () => orm.em.clear());

test('SELECT_IN - .findOne()  - returns populated related property', async () => {
  const testResource = await orm.em.findOneOrFail(TestResourceEntity, { id }, {
    fields: [
      'entityDirect',
      'resourceReference.refEntityDirect',
    ],
    strategy: LoadStrategy.SELECT_IN,
  });

  expect(testResource.entityDirect).toBe('Foo');
  expect(testResource.resourceReference?.refEntityDirect).toBe('Bar');
});

test('JOINED    - .findOne()  - returns populated related property', async () => {
  const testResource = await orm.em.findOneOrFail(TestResourceEntity, { id }, {
    fields: [
      'entityDirect',
      'resourceReference.refEntityDirect',
    ],
    strategy: LoadStrategy.JOINED,
  });

  expect(testResource.entityDirect).toBe('Foo');
  expect(testResource.resourceReference?.refEntityDirect).toBe('Bar');
});

test('SELECT_IN - .find()     - returns populated related property', async () => {
  const [testResource] = await orm.em.find(TestResourceEntity, { id }, {
    fields: [
      'entityDirect',
      'resourceReference.refEntityDirect',
    ],
    strategy: LoadStrategy.SELECT_IN,
  });

  expect(testResource.entityDirect).toBe('Foo');
  expect(testResource.resourceReference?.refEntityDirect).toBe('Bar');
});

test('JOINED    - .find()     - returns populated related property', async () => {
  const [testResource] = await orm.em.find(TestResourceEntity, { id }, {
    fields: [
      'entityDirect',
      'resourceReference.refEntityDirect',
    ],
    strategy: LoadStrategy.JOINED,
  });

  expect(testResource.entityDirect).toBe('Foo');
  expect(testResource.resourceReference?.refEntityDirect).toBe('Bar');
});
