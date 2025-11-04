import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class Bad {
  @PrimaryKey()
  id!: number;

  @Property()
  '3ds'?: string;
  @Property()
  "4ds"?: string;
  @Property()
  [`5ds`]?: string;
}

test('GH #new', async () => {
  const orm = await MikroORM.init({
    entities: [Bad],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
  });
  await orm.close();
});
