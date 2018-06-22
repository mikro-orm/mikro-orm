import { EntityFactory } from '../lib/EntityFactory';
import { Book } from './entities/Book';
import { Author } from './entities/Author';
import { ReferenceType, EntityManager, MikroORM, Collection } from '../lib';
import { Publisher } from './entities/Publisher';
import { initORM, wipeDatabase } from './bootstrap';

const Mock = jest.fn<EntityManager>(() => ({
  connection: jest.fn(),
  identityMap: jest.fn(),
  options: {
    baseDir: __dirname,
    entitiesDirs: ['entities'],
    logger: jest.fn(),
  },
  getReference: jest.fn(),
}));
const em = new Mock();
const factory = new EntityFactory(em);
em.entityFactory = factory;

/**
 * @class EntityFactoryTest
 */
describe('EntityFactory', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORM());
  beforeEach(async () => wipeDatabase(orm.em));

  test('should load entities', async () => {
    const metadata = factory.getMetadata();
    expect(metadata).toBeInstanceOf(Object);
    expect(metadata[Author.name]).toBeInstanceOf(Object);
    expect(metadata[Author.name].path).toBe(__dirname + '/entities/Author.ts');
    expect(metadata[Author.name].properties).toBeInstanceOf(Object);
    expect(metadata[Author.name].properties['books'].type).toBe(Book.name);
    expect(metadata[Author.name].properties['books'].reference).toBe(ReferenceType.ONE_TO_MANY);
    expect(metadata[Book.name].properties['author'].type).toBe(Author.name);
    expect(metadata[Book.name].properties['author'].reference).toBe(ReferenceType.MANY_TO_ONE);
    expect(metadata[Publisher.name].properties['tests'].owner).toBe(true);
  });

  test('should return reference', async () => {
    const ref = factory.createReference<Book>(Book.name, '5b0d19b28b21c648c2c8a600');
    expect(ref).toBeInstanceOf(Book);
    expect(ref.id).toBe('5b0d19b28b21c648c2c8a600');
    expect(ref.name).toBeUndefined();
  });

  test('should return entity', async () => {
    const entity = factory.create<Author>(Author.name, { id: '5b0d19b28b21c648c2c8a600', name: 'test', email: 'mail@test.com' });
    expect(entity).toBeInstanceOf(Author);
    expect(entity.id).toBe('5b0d19b28b21c648c2c8a600');
    expect(entity.name).toBe('test');
    expect(entity.email).toBe('mail@test.com');
  });

  test('create should create entity without calling constructor', async () => {
    const p1 = new Publisher(); // calls constructor, so uses default name
    expect(p1.name).toBe('asd');
    expect(p1).toBeInstanceOf(Publisher);
    expect(p1.books).toBeInstanceOf(Collection);
    expect(p1.tests).toBeInstanceOf(Collection);
    const p2 = factory.create<Publisher>(Publisher.name, { id: '5b0d19b28b21c648c2c8a601' });
    expect(p2).toBeInstanceOf(Publisher);
    expect(p2.name).toBeUndefined();
    expect(p2.books).toBeInstanceOf(Collection);
    expect(p2.tests).toBeInstanceOf(Collection);
    const p3 = factory.create<Publisher>(Publisher.name, { id: '5b0d19b28b21c648c2c8a602', name: 'test' });
    expect(p3).toBeInstanceOf(Publisher);
    expect(p3.name).toBe('test');
    expect(p3.books).toBeInstanceOf(Collection);
    expect(p3.tests).toBeInstanceOf(Collection);
  });

  test('create should create entity without calling constructor', async () => {
    const p1 = new Publisher(); // calls constructor, so uses default name
    expect(p1.name).toBe('asd');
    expect(p1).toBeInstanceOf(Publisher);
    expect(p1.books).toBeInstanceOf(Collection);
    expect(p1.tests).toBeInstanceOf(Collection);
    const p2 = factory.createReference<Publisher>(Publisher.name, '5b0d19b28b21c648c2c8a600');
    expect(p2).toBeInstanceOf(Publisher);
    expect(p2.name).toBeUndefined();
    expect(p1.books).toBeInstanceOf(Collection);
    expect(p1.tests).toBeInstanceOf(Collection);
  });

  afterAll(async () => orm.close(true));

});
