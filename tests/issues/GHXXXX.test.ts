import {
  Cascade,
  Entity,
  ManyToOne,
  MikroORM,
  PopulateHint,
  PrimaryKey,
  Ref,
} from '@mikro-orm/sqlite';

@Entity()
class Location {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Country, ref: true, cascade: [Cascade.REMOVE] })
  country!: Ref<Country>;

}

@Entity()
class Country {

  @PrimaryKey()
  id!: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Location, Country],
    populateWhere: PopulateHint.INFER,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('should not detect nullable for a relation with cascade', async () => {
  const metaData = orm.getMetadata().get<Location>("Location");
  expect(metaData.props.length).toBe(2);
  const prop = metaData.props[1];
  expect(prop.nullable).toBe(false);
});
