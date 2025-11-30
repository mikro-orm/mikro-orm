import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Pet {

  @PrimaryKey()
  id!: number;

  @Property()
  createdAt!: Date;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Pet],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('use $or in query builder', async () => {
  const qb1 = orm.em
    .createQueryBuilder(Pet, 'pet')
    .select(['id']);
  expect(() => qb1.where({
    createdAt: {
      $or: [{ $lt: new Date() }],
    },
  })).toThrow(`Using group operators ($and/$or) inside scalar properties is not allowed, move the operator above. (property: Pet.createdAt, payload: { createdAt: { '$or': [ [Object] ] } })`);

  const qb2 = orm.em
    .createQueryBuilder(Pet, 'pet')
    .select(['id']);
  expect(() => qb2.where({
    createdAt: {
      $or: [{ $lt: new Date() }, { $eq: null }],
    },
  })).toThrow(`Using group operators ($and/$or) inside scalar properties is not allowed, move the operator above. (property: Pet.createdAt, payload: { createdAt: { '$or': [ [Object], [Object] ] } })`);

  const qb3 = orm.em
    .createQueryBuilder(Pet, 'pet')
    .select(['id']);
  expect(() => qb3.where({
    createdAt: {
      $lt: new Date(),
    },
  })).not.toThrow();

  const qb4 = orm.em
    .createQueryBuilder(Pet, 'pet')
    .select(['id']);
  expect(() => qb4.where({
    $or: [{
      createdAt: {
        $lt: new Date(),
      },
    }],
  })).not.toThrow();
});
