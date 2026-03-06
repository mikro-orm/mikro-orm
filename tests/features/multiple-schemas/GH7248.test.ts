import { MikroORM } from '@mikro-orm/mariadb';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity({ schema: 'hub' })
class EntityInAnotherSchema {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_orm_test_gh_7248',
    port: 3309,
    entities: [User, EntityInAnotherSchema],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.ensureDatabase();
  await orm.em.execute('create database if not exists `hub`');
  // MariaDB doesn't support cross-database FK constraints, so we
  // create the tables manually to avoid the FK resolution error
  await orm.em.execute('drop table if exists `hub`.`entity_in_another_schema`');
  await orm.em.execute('drop table if exists `user`');
  await orm.em.execute(
    'create table `user` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null) default character set utf8mb4 engine = InnoDB',
  );
  await orm.em.execute(
    'create table `hub`.`entity_in_another_schema` (`id` int unsigned not null auto_increment primary key, `user_id` int unsigned not null) default character set utf8mb4 engine = InnoDB',
  );
});

afterAll(async () => {
  await orm.em.execute('drop table if exists `hub`.`entity_in_another_schema`');
  await orm.em.execute('drop table if exists `user`');
  await orm.em.execute('drop database if exists `hub`');
  await orm.close(true);
});

test('GH #7248 - cross-schema JOIN should use target entity schema', async () => {
  orm.em.create(User, { name: 'Foo' });
  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);

  await orm.em.createQueryBuilder(EntityInAnotherSchema, 'e').select('*').join('e.user', 'u').execute('get');

  // user table should NOT be prefixed with 'hub' schema since User entity has no schema
  expect(mock.mock.calls[0][0]).toMatch(
    'select `e`.* from `hub`.`entity_in_another_schema` as `e` inner join `user` as `u` on `e`.`user_id` = `u`.`id` limit 1',
  );
});
