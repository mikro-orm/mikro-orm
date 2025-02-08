import {
  Entity,
  PrimaryKey,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';

@Entity()
class Article {

  @PrimaryKey()
  id!: number;

  @PrimaryKey({ unsigned: false })
  someOtherId!: number;

}

test('allow signed primary key when explicitly specified', async () => {
  const orm = await MikroORM.init({
    dbName: 'mikro_orm_signed_primary_key',
    entities: [Article],
    connect: false,
  });

  expect(await orm.schema.getCreateSchemaSQL({ wrap: false })).toBe(
    'create table `article` (`id` int unsigned not null, `some_other_id` int not null, primary key (`id`, `some_other_id`)) default character set utf8mb4 engine = InnoDB;\n',
  );

  await orm.close(true);
});
