import { wrap, EntitySchema, MikroORM, EntityCaseNamingStrategy } from '@mikro-orm/sqlite';

interface IAttachment {
  key: string;
}

const Attachment = new EntitySchema<IAttachment>({
  embeddable: true,
  name: 'Attachment',
  properties: {
    key: { type: 'text' },
  },
});

interface IObject {
  id: string;
  attachments: IAttachment[];
  attachments_key: IAttachment[];
}

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    entities: [Attachment, A],
    namingStrategy: EntityCaseNamingStrategy,
    dbName: `:memory:`,
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

const A = new EntitySchema<IObject>({
  name: 'A',
  properties: {
    id: { type: 'uuid', primary: true },
    attachments: { array: true, entity: 'Attachment', kind: 'embedded' },
    attachments_key: { array: true, entity: 'Attachment', kind: 'embedded' },
  },
});

test('conflicting property names', async () => {
  const id = '6124eca7-002a-4f7d-81c9-90206250b1f4';
  orm.em.create(A, {
    id,
    attachments: [{ key: '23' }],
    attachments_key: [],
  });
  await orm.em.flush();
  orm.em.clear();

  const object = await orm.em.findOneOrFail(A, id);

  wrap(object).assign({
    attachments_key: [{ key: '23' }],
  });
  await orm.em.flush();
});
