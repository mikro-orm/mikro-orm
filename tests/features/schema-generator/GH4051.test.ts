import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Ref } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';

abstract class Base {

  @PrimaryKey()
  id!: string;

}

@Entity()
class Category extends Base {

  @OneToMany(() => Article1, attr => attr.category, {
    cascade: [],
  })
  articles1 = new Collection<Article1>(this);

  @OneToMany(() => Article2, attr => attr.category, {
    cascade: [],
  })
  articles2 = new Collection<Article2>(this);

}

@Entity()
class Article1 extends Base {

  @ManyToOne(() => Category, {
    primary: true,
    ref: true,
    cascade: [],
  })
  category!: Ref<Category>;

}

@Entity()
class Article2 extends Base {

  @ManyToOne(() => Category, {
    primary: true,
    ref: true,
    cascade: [],
    deleteRule: 'no action',
  })
  category!: Ref<Category>;

}

test('upsert and insert both correctly serialize json', async () => {
  const orm = await MikroORM.init({
    dbName: 'mikro_orm_4051',
    entities: [Article1, Article2],
    connect: false,
  });

  expect(await orm.schema.getCreateSchemaSQL()).toBe(
    'set names utf8mb4;\n\n' +
    'create table `category` (`id` varchar(255) not null, primary key (`id`)) default character set utf8mb4 engine = InnoDB;\n\n' +
    'create table `article2` (`id` varchar(255) not null, `category_id` varchar(255) not null, primary key (`id`, `category_id`)) default character set utf8mb4 engine = InnoDB;\n' +
    'alter table `article2` add index `article2_category_id_index` (`category_id`);\n\n' +
    'create table `article1` (`id` varchar(255) not null, `category_id` varchar(255) not null, primary key (`id`, `category_id`)) default character set utf8mb4 engine = InnoDB;\n' +
    'alter table `article1` add index `article1_category_id_index` (`category_id`);\n\n' +
    'alter table `article2` add constraint `article2_category_id_foreign` foreign key (`category_id`) references `category` (`id`) on delete no action;\n\n' +
    'alter table `article1` add constraint `article1_category_id_foreign` foreign key (`category_id`) references `category` (`id`);\n',
  );

  await orm.close(true);
});
