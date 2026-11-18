import { type ScalarRef, ScalarReference, NotFoundError, ref } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
class Document {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string', lazy: true, ref: true, nullable: true })
  content!: ScalarRef<string | null | undefined>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Document], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(async () => {
  orm.config.reset('findOneOrFailHandler');
  await orm.schema.clear();
  orm.em.clear();
});

afterAll(() => orm.close(true));

async function loadDocument() {
  const document = orm.em.create(Document, { content: ref(null) });
  await orm.em.persist(document).flush();
  orm.em.clear();
  return orm.em.findOneOrFail(Document, document.id);
}

test('uses the property-specific error by default', async () => {
  const document = await loadDocument();
  await expect(document.content.loadOrFail()).rejects.toThrow(
    `Document (${document.id}) failed to load property 'content'`,
  );
});

test('honors the configured failure handler', async () => {
  const document = await loadDocument();
  const error = new Error('configured missing content');
  const failHandler = vi.fn(() => error);
  orm.config.set('findOneOrFailHandler', failHandler);

  await expect(document.content.loadOrFail()).rejects.toBe(error);
  expect(failHandler).toHaveBeenCalledExactlyOnceWith('Document', document.id);
});

test('prefers the per-call failure handler over the configured handler', async () => {
  const document = await loadDocument();
  const configuredHandler = vi.fn(() => new Error('configured missing content'));
  orm.config.set('findOneOrFailHandler', configuredHandler);
  const error = new Error('per-call missing content');
  const failHandler = vi.fn(() => error);

  await expect(document.content.loadOrFail({ failHandler })).rejects.toBe(error);
  expect(failHandler).toHaveBeenCalledExactlyOnceWith('Document', document.id);
  expect(configuredHandler).not.toHaveBeenCalled();
});

test('returns falsy values without calling the failure handler', async () => {
  const document = await loadDocument();
  const failHandler = vi.fn(() => new Error('missing content'));
  document.content.set('');

  await expect(document.content.loadOrFail({ failHandler })).resolves.toBe('');
  expect(failHandler).not.toHaveBeenCalled();
});

test('uses the per-call failure handler for an undefined scalar value', async () => {
  const document = await loadDocument();
  document.content.set(undefined);
  const error = new Error('undefined content');
  const failHandler = vi.fn(() => error);

  await expect(document.content.loadOrFail({ failHandler })).rejects.toBe(error);
  expect(failHandler).toHaveBeenCalledExactlyOnceWith('Document', document.id);
});

test('does not capture the configured failure handler in reused options', async () => {
  const document = await loadDocument();
  const options = {};
  const firstError = new Error('first missing content');
  const firstHandler = vi.fn(() => firstError);
  orm.config.set('findOneOrFailHandler', firstHandler);

  await expect(document.content.loadOrFail(options)).rejects.toBe(firstError);
  expect(options).toEqual({});

  const secondError = new Error('second missing content');
  const secondHandler = vi.fn(() => secondError);
  orm.config.set('findOneOrFailHandler', secondHandler);

  await expect(document.content.loadOrFail(options)).rejects.toBe(secondError);
  expect(secondHandler).toHaveBeenCalledExactlyOnceWith('Document', document.id);
  expect(firstHandler).toHaveBeenCalledTimes(1);
  expect(options).toEqual({});
});

test('honors an explicitly selected built-in failure handler', async () => {
  const document = await loadDocument();

  await expect(document.content.loadOrFail({ failHandler: NotFoundError.findOneFailed })).rejects.toThrow(
    `Document not found (${document.id})`,
  );
});

test.each([false, 0, ''])('returns the populated scalar value %s without failing', async value => {
  const failHandler = vi.fn(() => new Error('missing value'));

  await expect(new ScalarReference(value).loadOrFail({ failHandler })).resolves.toBe(value);
  expect(failHandler).not.toHaveBeenCalled();
});
