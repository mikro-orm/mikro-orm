/* eslint-disable @stylistic/quotes */
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

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

test('GH #6960', async () => {
  const orm = await MikroORM.init({
    entities: [Bad],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: false },
  });
  await orm.close();
});
