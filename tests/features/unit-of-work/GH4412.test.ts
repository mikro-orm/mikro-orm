import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  createdAt?: Date;

  @Property()
  name!: string;

}

describe('GH issue 4412', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [A],
      forceUndefined: true,
    });

    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('update triggered after findOne with forceUndefined true', async () => {
    orm.em.create(A, {
      id: 1,
      name: 'a',
    });
    await orm.em.flush();

    const a = await orm.em.findOne(A, { name: 'a' });

    const mock = mockLogger(orm);
    await orm.em.flush();

    expect(mock).not.toHaveBeenCalled();
  });
});
