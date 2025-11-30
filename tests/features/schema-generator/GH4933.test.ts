import { MikroORM, type Rel } from '@mikro-orm/postgresql';
import { Entity, Enum, ManyToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'users', schema: 'example', discriminatorColumn: 'type', abstract: true })
class Base {

  @PrimaryKey()
  id!: string;

  @Enum({ items: ['one', 'two'] })
  type!: 'one' | 'two';

}

@Entity({ discriminatorValue: 'one' })
class One extends Base {}

@Entity({ discriminatorValue: 'two' })
class Two extends Base {}

@Entity({ tableName: 'relations' })
class Relation {

  @PrimaryKey()
  id!: string;

  @ManyToOne(() => Two, { deleteRule: 'set null' })
  appliedBy?: Rel<Two>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [One, Two, Base, Relation],
    dbName: '4933',
  });
  await orm.schema.ensureDatabase();
  await orm.schema.dropSchema();
});

afterAll(() => orm.close(true));

test('GH #4933', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toMatchSnapshot();
  await orm.schema.execute(sql);
});
