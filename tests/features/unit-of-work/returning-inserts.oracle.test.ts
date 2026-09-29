import { MikroORM, OracleDriver, Opt } from '@mikro-orm/oracledb';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Purchase {
  @PrimaryKey({ autoincrement: false })
  id!: number;

  @Property({ type: 'integer', autoincrement: true })
  number!: number & Opt;

  @Property({ length: 20, generated: cols => `('#' || "${cols.number}")` })
  label!: string & Opt;
}

@Entity({ inheritance: 'tpt' })
abstract class Document {
  @PrimaryKey({ autoincrement: false })
  id!: number;

  @Property({ type: 'integer', autoincrement: true })
  seq!: number & Opt;
}

@Entity()
class Invoice extends Document {
  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    driver: OracleDriver,
    metadataProvider: ReflectMetadataProvider,
    entities: [Purchase, Document, Invoice],
    dbName: 'mikro_orm_test_returning_inserts',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('inserts return non-PK autoincrement and generated columns', async () => {
  const em = orm.em.fork();
  const single = em.create(Purchase, { id: 1 });
  await em.flush();
  expect(single).toMatchObject({ number: 1, label: '#1' });

  const batch = [em.create(Purchase, { id: 2 }), em.create(Purchase, { id: 3 })];
  await em.flush();
  expect(batch.map(p => [p.number, p.label])).toEqual([
    [2, '#2'],
    [3, '#3'],
  ]);
});

test('TPT child insert does not return columns of the parent table', async () => {
  const em = orm.em.fork();
  const invoice = em.create(Invoice, { id: 1, name: 'foo' });
  await em.flush();
  expect(invoice.seq).toBe(1);
});
