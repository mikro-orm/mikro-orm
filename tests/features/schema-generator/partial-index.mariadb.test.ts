import { EntitySchema, MikroORM } from '@mikro-orm/mariadb';

interface PartialUser {
  id: number;
  email: string;
  deletedAt: Date | null;
}

function makeMeta(opts: { where?: string }) {
  return new EntitySchema<PartialUser>({
    name: 'PartialUser',
    tableName: 'partial_user',
    properties: {
      id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
      email: { name: 'email', type: 'string', fieldName: 'email', columnType: 'varchar(255)' },
      deletedAt: { name: 'deletedAt', type: 'Date', fieldName: 'deleted_at', columnType: 'datetime', nullable: true },
    },
    uniques: [
      {
        name: 'partial_user_email_uniq',
        properties: ['email'],
        ...(opts.where ? { where: opts.where } : {}),
      },
    ],
  }).init().meta;
}

describe('partial index [mariadb]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [],
      dbName: 'mikro_orm_test_partial_index_mariadb',
      port: 3309,
      discovery: { warnWhenNoEntities: false },
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('throws clear error — MariaDB does not support inline expression indexes', async () => {
    const meta = orm.getMetadata();
    const created = makeMeta({ where: '`deleted_at` is null' });
    meta.set(created.class, created);

    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).rejects.toThrow(
      /partial indexes \(`where`\) are not supported on MariaDB/,
    );
  });
});
