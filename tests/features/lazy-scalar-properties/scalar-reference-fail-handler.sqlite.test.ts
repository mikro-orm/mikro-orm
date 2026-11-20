import { type ScalarRef, ref } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
class Document {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string', lazy: true, ref: true, nullable: true })
  content!: ScalarRef<string | null>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Document], dbName: ':memory:' });
  await orm.schema.create();
  orm.em.create(Document, { id: 1, content: ref(null) });
  await orm.em.flush();
});

beforeEach(() => {
  orm.config.reset('findOneOrFailHandler');
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('ScalarReference.loadOrFail() uses the per-call fail handler', async () => {
  const document = await orm.em.findOneOrFail(Document, 1);
  const error = new Error('missing content');
  const failHandler = vi.fn(() => error);

  await expect(document.content.loadOrFail({ failHandler })).rejects.toBe(error);
  expect(failHandler).toHaveBeenCalledExactlyOnceWith('Document', 1);
});

test('ScalarReference.loadOrFail() reports the property when no handler is passed', async () => {
  orm.config.set('findOneOrFailHandler', () => new Error('entity not found'));
  const document = await orm.em.findOneOrFail(Document, 1);

  await expect(document.content.loadOrFail()).rejects.toThrow(`Document (1) failed to load property 'content'`);
});

test('Reference.loadOrFail() does not store the configured handler in the passed options', async () => {
  const options = {};
  orm.config.set('findOneOrFailHandler', () => new Error('first'));
  await expect(orm.em.getReference(Document, 2, { wrapped: true }).loadOrFail(options)).rejects.toThrow('first');

  orm.em.clear();
  orm.config.set('findOneOrFailHandler', () => new Error('second'));
  await expect(orm.em.getReference(Document, 2, { wrapped: true }).loadOrFail(options)).rejects.toThrow('second');
  expect(options).toEqual({});
});
