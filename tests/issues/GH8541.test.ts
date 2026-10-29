import { MikroORM } from '@mikro-orm/mssql';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Embeddable()
class Meta {
  @Property()
  title!: string;
}

@Entity()
class Document {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'json' })
  data!: { text: string };

  @Embedded(() => Meta, { object: true })
  meta!: Meta;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '8541',
    password: 'Root.Root',
    entities: [Document],
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('GH #8541', async () => {
  orm.em.create(Document, { data: { text: '≥ ≤ Δ' }, meta: { title: '≥ ≤ Δ' } });
  await orm.em.flush();
  orm.em.clear();

  const document = await orm.em.findOneOrFail(Document, { id: { $ne: null } });
  expect(document.data).toEqual({ text: '≥ ≤ Δ' });
  expect(document.meta.title).toBe('≥ ≤ Δ');

  const mock = mockLogger(orm, ['query']);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();

  document.data = { text: 'Ω ≠ π' };
  document.meta.title = 'Ω ≠ π';
  await orm.em.flush();
  orm.em.clear();

  const updated = await orm.em.findOneOrFail(Document, document.id);
  expect(updated.data).toEqual({ text: 'Ω ≠ π' });
  expect(updated.meta.title).toBe('Ω ≠ π');
});
