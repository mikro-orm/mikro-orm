pragma foreign_keys = off;

drop table if exists `author3`;
drop table if exists `book3`;
drop table if exists `book_tag3`;
drop table if exists `publisher3`;
drop table if exists `test3`;
drop table if exists `book3_to_book_tag3`;
drop table if exists `publisher3_to_test3`;

create table `author3` (`id` integer not null primary key autoincrement, `created_at` datetime null, `updated_at` datetime null, `name` varchar not null, `email` varchar not null, `age` integer null, `terms_accepted` integer not null default 0, `identities` varchar null, `born` date null, `born_time` time null);
create unique index `author3_email_unique` on `author3` (`email`);

create table `book3` (`id` integer not null primary key autoincrement, `title` varchar not null, `foo` varchar null);

create table `book_tag3` (`id` integer not null primary key autoincrement, `name` varchar not null, `version` datetime not null default current_timestamp);

create table `publisher3` (`id` integer not null primary key autoincrement, `name` varchar not null, `type` varchar not null);

create table `test3` (`id` integer not null primary key autoincrement, `name` varchar null, `version` integer not null default 1);

create table `book3_to_book_tag3` (`id` integer not null primary key autoincrement);

create table `publisher3_to_test3` (`id` integer not null primary key autoincrement);

alter table `author3` add column `favourite_book_id` integer null references `book3` (`id`) on delete set null on update cascade;
create index `author3_favourite_book_id_index` on `author3` (`favourite_book_id`);

alter table `book3` add column `author_id` integer null references `author3` (`id`) on delete set null on update cascade;
alter table `book3` add column `publisher_id` integer null references `publisher3` (`id`) on delete set null on update cascade;
create index `book3_author_id_index` on `book3` (`author_id`);
create index `book3_publisher_id_index` on `book3` (`publisher_id`);

alter table `book3_to_book_tag3` add column `book3_id` integer null references `book3` (`id`) on delete cascade on update cascade;
alter table `book3_to_book_tag3` add column `book_tag3_id` integer null references `book_tag3` (`id`) on delete cascade on update cascade;
create index `book3_to_book_tag3_book3_id_index` on `book3_to_book_tag3` (`book3_id`);
create index `book3_to_book_tag3_book_tag3_id_index` on `book3_to_book_tag3` (`book_tag3_id`);

alter table `publisher3_to_test3` add column `publisher3_id` integer null references `publisher3` (`id`) on delete cascade on update cascade;
alter table `publisher3_to_test3` add column `test3_id` integer null references `test3` (`id`) on delete cascade on update cascade;
create index `publisher3_to_test3_publisher3_id_index` on `publisher3_to_test3` (`publisher3_id`);
create index `publisher3_to_test3_test3_id_index` on `publisher3_to_test3` (`test3_id`);

pragma foreign_keys = on;
