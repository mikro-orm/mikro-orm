import { MikroORM } from '@mikro-orm/postgresql';

import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class Address {

  @PrimaryKey()
  id!: number;

  @Property({ type: Date })
  createdAt: Date;

  @Property({ type: Date, onUpdate: () => new Date() })
  updatedAt: Date;

  @Property()
  createdBy: string;

  @Property({ onUpdate: () => 'testNew' })
  updatedBy: string;

  @Property()
  companyName: string;

  constructor(companyName: string) {
    this.companyName = companyName;
    this.createdBy = 'test';
    this.updatedBy = 'test';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

}

describe('GH issue 2784', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Address],
      dbName: 'mikro_orm_test_2784',
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 2784`, async () => {
    const address = new Address('test1');
    const { updatedAt, updatedBy } = address;
    await orm.em.persist(address).flush();

    address.companyName = 'test3';
    await orm.em.flush();
    expect(updatedAt).not.toEqual(address.updatedAt);
    expect(updatedBy).not.toEqual(address.updatedBy);
  });

});
