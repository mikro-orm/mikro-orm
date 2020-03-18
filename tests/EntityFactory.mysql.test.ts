import {
  Collection,
  EntityFactory,
  MikroORM,
} from '../lib';
import { Publisher2 } from './entities-sql';
import { initORMMySql, wipeDatabaseMySql } from './bootstrap';
import { MySqlDriver } from '../lib/drivers/MySqlDriver';
import { MetadataDiscovery } from '../lib/metadata';

describe('EntityFactoryMySql', () => {

  let orm: MikroORM<MySqlDriver>;
  let factory: EntityFactory;

  beforeAll(async () => {
    orm = await initORMMySql();
    await new MetadataDiscovery(orm.getMetadata(), orm.em.getDriver().getPlatform(), orm.config).discover();
    factory = new EntityFactory(orm.em.getUnitOfWork(), orm.em);
  });
  beforeEach(async () => wipeDatabaseMySql(orm.em));

  test('should support a primary key value of 0', async () => {
    const p1 = new Publisher2(); // calls constructor, so uses default name
    expect(p1.name).toBe('asd');
    expect(p1).toBeInstanceOf(Publisher2);
    expect(p1.books).toBeInstanceOf(Collection);
    expect(p1.tests).toBeInstanceOf(Collection);
    const p2 = factory.create(Publisher2, { id: 0 }); // shouldn't call constructor
    expect(p2).toBeInstanceOf(Publisher2);
    expect(p2.name).toBeUndefined();
    expect(p2.books).toBeInstanceOf(Collection);
    expect(p2.tests).toBeInstanceOf(Collection);
  });

  afterAll(async () => orm.close(true));

});
