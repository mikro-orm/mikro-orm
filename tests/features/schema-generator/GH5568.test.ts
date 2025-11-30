import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, OneToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Parent {

  @PrimaryKey()
  id!: string;

  @PrimaryKey()
  tenant!: string;

}

@Entity()
class Child {

  @PrimaryKey()
  id!: string;

  @PrimaryKey()
  tenant!: string;

  @OneToOne(() => Parent, { deleteRule: 'set null ("parent_id")', nullable: true })
  parent?: Parent;

}
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Child],
    dbName: '5568',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('GH #5568', async () => {
  const sql = await orm.schema.getUpdateSchemaSQL();
  expect(sql).toBe('');
});
