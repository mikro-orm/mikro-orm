import { DateTimeType, MikroORM, Opt } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Company {
  @PrimaryKey()
  id!: number;

  @Property({ type: DateTimeType, onUpdate: () => new Date() })
  updatedAt: Opt<Date> = new Date();

  @Property({ version: true })
  version!: number;
}

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Company)
  company!: Company;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Company],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('it does not update the company version when the user is created', async () => {
  const company = orm.em.create(Company, { version: 1 });
  await orm.em.flush();

  await orm.em.transactional(async em => {
    const user = em.create(User, { company });
    await em.flush();
    await em.refresh(user);
  });

  await orm.em.refresh(company);
  expect(company.version).toBe(1);
});
