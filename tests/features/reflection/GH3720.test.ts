import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property()
  types!: string[];

}

type ValueOf<T> = T[keyof T];

const UserType = Object.freeze({
  ADMIN: 'admin',
  CUSTOMER: 'customer',
} as const);

type Props = {
  type: ValueOf<typeof UserType>;
};

@Entity()
class User {

  constructor(props: Props) {
    this.type = props.type;
  }

  @PrimaryKey()
  id!: number;

  @Property()
  type: ValueOf<typeof UserType>;

}

let orm: MikroORM;

beforeAll(async () => {
  const logger = vi.fn();
  orm = await MikroORM.init({
    metadataCache: { enabled: false },
    logger,
    debug: true,
    entities: [A, User],
    dbName: 'mikro_orm_test_3720',
    metadataProvider: TsMorphMetadataProvider,
    discovery: { tsConfigPath: 'foobar.json' },
  });
  expect(logger).toHaveBeenCalledWith(expect.stringContaining('File not found:'));
  expect(logger).toHaveBeenCalledWith(expect.stringContaining('foobar.json'));

  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('GH3720', async () => {
  await orm.em.findAndCount(A, {});
});
