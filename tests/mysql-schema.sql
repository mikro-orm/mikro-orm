set names utf8;
set foreign_key_checks = 0;

drop table if exists `author2`;
drop table if exists `book2`;
drop table if exists `book_tag2`;
drop table if exists `publisher2`;
drop table if exists `test2`;
drop table if exists `foo_bar2`;
drop table if exists `foo_baz2`;
drop table if exists `author_to_friend`;
drop table if exists `author2_to_author2`;
drop table if exists `book2_to_book_tag2`;
drop table if exists `book_to_tag_unordered`;
drop table if exists `publisher2_to_test2`;

create table `author2` (`id` int unsigned not null auto_increment primary key, `created_at` datetime(3) not null default current_timestamp(3), `updated_at` datetime(3) not null default current_timestamp(3), `name` varchar(255) not null, `email` varchar(255) not null, `age` int(11) null, `terms_accepted` tinyint(1) not null default 0, `optional` tinyint(1) null, `identities` json null, `born` date null, `born_time` time null, `favourite_book_uuid_pk` varchar(36) null, `favourite_author_id` int(11) unsigned null) default character set utf8 engine = InnoDB;
alter table `author2` add unique `author2_email_unique`(`email`);
alter table `author2` add index `author2_born_index`(`born`);
alter table `author2` add index `born_time_idx`(`born_time`);
alter table `author2` add index `author2_favourite_book_uuid_pk_index`(`favourite_book_uuid_pk`);
alter table `author2` add index `author2_favourite_author_id_index`(`favourite_author_id`);
alter table `author2` add index `custom_email_index_name`(`email`);
alter table `author2` add index `author2_terms_accepted_index`(`terms_accepted`);

create table `book2` (`uuid_pk` varchar(36) not null, `created_at` datetime(3) not null default current_timestamp(3), `title` varchar(255) null, `perex` text null, `price` float null, `double` double null, `meta` json null, `author_id` int(11) unsigned not null, `publisher_id` int(11) unsigned null, `foo` varchar(255) null) default character set utf8 engine = InnoDB;
alter table `book2` add primary key `book2_pkey`(`uuid_pk`);
alter table `book2` add index `book2_author_id_index`(`author_id`);
alter table `book2` add index `book2_publisher_id_index`(`publisher_id`);

create table `book_tag2` (`id` int unsigned not null auto_increment primary key, `name` varchar(50) not null) default character set utf8 engine = InnoDB;

create table `publisher2` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `type` enum('local', 'global') not null, `type2` enum('LOCAL', 'GLOBAL') not null, `enum1` tinyint(2) null, `enum2` tinyint(2) null, `enum3` tinyint(2) null, `enum4` enum('a', 'b', 'c') null) default character set utf8 engine = InnoDB;

create table `test2` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) null, `book_uuid_pk` varchar(36) null, `version` int(11) not null default 1, `foo___bar` int(11) unsigned null, `foo___baz` int(11) unsigned null) default character set utf8 engine = InnoDB;
alter table `test2` add unique `test2_book_uuid_pk_unique`(`book_uuid_pk`);
alter table `test2` add index `test2_book_uuid_pk_index`(`book_uuid_pk`);
alter table `test2` add unique `test2_foo___bar_unique`(`foo___bar`);
alter table `test2` add index `test2_foo___bar_index`(`foo___bar`);

create table `foo_bar2` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `baz_id` int(11) unsigned null, `foo_bar_id` int(11) unsigned null, `version` datetime(3) not null default current_timestamp(3)) default character set utf8 engine = InnoDB;
alter table `foo_bar2` add unique `foo_bar2_baz_id_unique`(`baz_id`);
alter table `foo_bar2` add index `foo_bar2_baz_id_index`(`baz_id`);
alter table `foo_bar2` add unique `foo_bar2_foo_bar_id_unique`(`foo_bar_id`);
alter table `foo_bar2` add index `foo_bar2_foo_bar_id_index`(`foo_bar_id`);

create table `foo_baz2` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `version` datetime(3) not null default current_timestamp(3)) default character set utf8 engine = InnoDB;

create table `author_to_friend` (`author2_1_id` int(11) unsigned not null, `author2_2_id` int(11) unsigned not null) default character set utf8 engine = InnoDB;
alter table `author_to_friend` add index `author_to_friend_author2_1_id_index`(`author2_1_id`);
alter table `author_to_friend` add index `author_to_friend_author2_2_id_index`(`author2_2_id`);
alter table `author_to_friend` add primary key `author_to_friend_pkey`(`author2_1_id`, `author2_2_id`);

create table `author2_to_author2` (`author2_1_id` int(11) unsigned not null, `author2_2_id` int(11) unsigned not null) default character set utf8 engine = InnoDB;
alter table `author2_to_author2` add index `author2_to_author2_author2_1_id_index`(`author2_1_id`);
alter table `author2_to_author2` add index `author2_to_author2_author2_2_id_index`(`author2_2_id`);
alter table `author2_to_author2` add primary key `author2_to_author2_pkey`(`author2_1_id`, `author2_2_id`);

create table `book2_to_book_tag2` (`order` int unsigned not null auto_increment primary key, `book2_uuid_pk` varchar(36) not null, `book_tag2_id` int(11) unsigned not null) default character set utf8 engine = InnoDB;
alter table `book2_to_book_tag2` add index `book2_to_book_tag2_book2_uuid_pk_index`(`book2_uuid_pk`);
alter table `book2_to_book_tag2` add index `book2_to_book_tag2_book_tag2_id_index`(`book_tag2_id`);

create table `book_to_tag_unordered` (`book2_uuid_pk` varchar(36) not null, `book_tag2_id` int(11) unsigned not null) default character set utf8 engine = InnoDB;
alter table `book_to_tag_unordered` add index `book_to_tag_unordered_book2_uuid_pk_index`(`book2_uuid_pk`);
alter table `book_to_tag_unordered` add index `book_to_tag_unordered_book_tag2_id_index`(`book_tag2_id`);
alter table `book_to_tag_unordered` add primary key `book_to_tag_unordered_pkey`(`book2_uuid_pk`, `book_tag2_id`);

create table `publisher2_to_test2` (`id` int unsigned not null auto_increment  primary key, `publisher2_id` int(11) unsigned not null, `test2_id` int(11) unsigned not null) default character set utf8 engine = InnoDB;
alter table `publisher2_to_test2` add index `publisher2_to_test2_publisher2_id_index`(`publisher2_id`);
alter table `publisher2_to_test2` add index `publisher2_to_test2_test2_id_index`(`test2_id`);

alter table `author2` add constraint `author2_favourite_book_uuid_pk_foreign` foreign key (`favourite_book_uuid_pk`) references `book2` (`uuid_pk`) on update cascade on delete set null;
alter table `author2` add constraint `author2_favourite_author_id_foreign` foreign key (`favourite_author_id`) references `author2` (`id`) on update cascade on delete set null;

alter table `book2` add constraint `book2_author_id_foreign` foreign key (`author_id`) references `author2` (`id`);
alter table `book2` add constraint `book2_publisher_id_foreign` foreign key (`publisher_id`) references `publisher2` (`id`) on update cascade on delete cascade;

alter table `test2` add constraint `test2_book_uuid_pk_foreign` foreign key (`book_uuid_pk`) references `book2` (`uuid_pk`);
alter table `test2` add constraint `test2_foo___bar_foreign` foreign key (`foo___bar`) references `foo_bar2` (`id`) on update cascade on delete set null;

alter table `foo_bar2` add constraint `foo_bar2_baz_id_foreign` foreign key (`baz_id`) references `foo_baz2` (`id`) on update cascade on delete set null;
alter table `foo_bar2` add constraint `foo_bar2_foo_bar_id_foreign` foreign key (`foo_bar_id`) references `foo_bar2` (`id`) on update cascade on delete set null;

alter table `author_to_friend` add constraint `author_to_friend_author2_1_id_foreign` foreign key (`author2_1_id`) references `author2` (`id`) on update cascade on delete cascade;
alter table `author_to_friend` add constraint `author_to_friend_author2_2_id_foreign` foreign key (`author2_2_id`) references `author2` (`id`) on update cascade on delete cascade;

alter table `author2_to_author2` add constraint `author2_to_author2_author2_1_id_foreign` foreign key (`author2_1_id`) references `author2` (`id`) on update cascade on delete cascade;
alter table `author2_to_author2` add constraint `author2_to_author2_author2_2_id_foreign` foreign key (`author2_2_id`) references `author2` (`id`) on update cascade on delete cascade;

alter table `book2_to_book_tag2` add constraint `book2_to_book_tag2_book2_uuid_pk_foreign` foreign key (`book2_uuid_pk`) references `book2` (`uuid_pk`) on update cascade on delete cascade;
alter table `book2_to_book_tag2` add constraint `book2_to_book_tag2_book_tag2_id_foreign` foreign key (`book_tag2_id`) references `book_tag2` (`id`) on update cascade on delete cascade;

alter table `book_to_tag_unordered` add constraint `book_to_tag_unordered_book2_uuid_pk_foreign` foreign key (`book2_uuid_pk`) references `book2` (`uuid_pk`) on update cascade on delete cascade;
alter table `book_to_tag_unordered` add constraint `book_to_tag_unordered_book_tag2_id_foreign` foreign key (`book_tag2_id`) references `book_tag2` (`id`) on update cascade on delete cascade;

alter table `publisher2_to_test2` add constraint `publisher2_to_test2_publisher2_id_foreign` foreign key (`publisher2_id`) references `publisher2` (`id`) on update cascade on delete cascade;
alter table `publisher2_to_test2` add constraint `publisher2_to_test2_test2_id_foreign` foreign key (`test2_id`) references `test2` (`id`) on update cascade on delete cascade;

set foreign_key_checks = 1;
