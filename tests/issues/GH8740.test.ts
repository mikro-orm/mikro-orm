import { MikroORM } from '@mikro-orm/mssql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ type: 'string', columnType: 'char(6)' })
  code!: string;

  @Property({ columnType: 'char(6)' })
  shelf!: string;

  @Property({ columnType: 'text' })
  notes!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Book],
    dbName: '8740',
    password: 'Root.Root',
  });
  await orm.schema.refresh();
  await orm.em.insert(Book, { id: 1, title: 't', code: 'ABC123', shelf: 'S1', notes: 'n' });
});

afterAll(() => orm.close(true));

test('GH #8740', async () => {
  const em = orm.em.fork();
  const uow = em.getUnitOfWork();
  const book = await em.findOneOrFail(Book, 1);
  uow.computeChangeSets();
  expect(uow.getChangeSets().map(cs => cs.payload)).toEqual([]);

  book.code = 'XYZ789';
  uow.computeChangeSets();
  expect(uow.getChangeSets().map(cs => Object.keys(cs.payload))).toEqual([['code']]);
  await em.flush();

  const reloaded = await orm.em.fork().findOneOrFail(Book, 1);
  expect(reloaded.code).toBe('XYZ789');
});
