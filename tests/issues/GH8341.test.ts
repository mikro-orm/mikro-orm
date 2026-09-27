import { defineEntity, MikroORM, p, Type } from '@mikro-orm/sqlite';

class RemappingType extends Type<string, string> {
  override convertToDatabaseValue(value: string): string {
    if (!value.startsWith('js-')) {
      throw new Error(`Unexpected JS value: ${value}`);
    }

    return value.replace(/^js-/, 'db-');
  }

  override convertToJSValue(value: string): string {
    if (!value.startsWith('db-')) {
      throw new Error(`Unexpected DB value: ${value}`);
    }

    return value.replace(/^db-/, 'js-');
  }

  override compareAsType(): string {
    return 'string';
  }
}

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.type(RemappingType).primary(),
    status: p.string(),
  },
  filters: {
    notBanned: { name: 'notBanned', cond: { id: { $ne: 'js-3' } }, default: true },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author],
    dbName: ':memory:',
  });
  await orm.schema.create();

  const em = orm.em.fork();
  em.create(Author, { id: 'js-1', status: 'active' });
  em.create(Author, { id: 'js-2', status: 'active' });
  em.create(Author, { id: 'js-3', status: 'active' });
  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #8341', async () => {
  const em = orm.em.fork();
  await expect(em.countBy(Author, 'status', { where: { id: 'js-1' } })).resolves.toEqual({ active: 1 });
  await expect(em.countBy(Author, 'status')).resolves.toEqual({ active: 2 });
});
