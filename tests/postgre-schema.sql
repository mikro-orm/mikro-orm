set names 'utf8';
set session_replication_role = 'replica';

drop table if exists "author2" cascade;
drop table if exists "book2" cascade;
drop table if exists "book_tag2" cascade;
drop table if exists "publisher2" cascade;
drop table if exists "test2" cascade;
drop table if exists "foo_bar2" cascade;
drop table if exists "foo_baz2" cascade;
drop table if exists "book2_to_book_tag2" cascade;
drop table if exists "publisher2_to_test2" cascade;

create table "author2" ("id" serial primary key, "created_at" timestamp(3) not null default current_timestamp(3), "updated_at" timestamp(3) not null default current_timestamp(3), "name" varchar(255) not null, "email" varchar(255) not null, "age" int null, "terms_accepted" boolean not null default false, "identities" json null, "born" timestamp null, "favourite_book_uuid_pk" varchar(36) null, "favourite_author_id" int null);
alter table "author2" add constraint "author2_email_unique" unique ("email");

create table "book2" ("uuid_pk" varchar(36) not null, "created_at" timestamp(3) not null default current_timestamp(3), "title" varchar(255) null, "perex" text null, "price" float null, "double" double precision null, "meta" json null, "author_id" int null, "publisher_id" int null, "foo" varchar(255) null);
alter table "book2" add constraint "book2_pkey" primary key ("uuid_pk");

create table "book_tag2" ("id" serial primary key, "name" varchar(50) not null);

create table "publisher2" ("id" serial primary key, "name" varchar(255) not null, "type" varchar(10) not null);

create table "test2" ("id" serial primary key, "name" varchar(255) null, "book_uuid_pk" varchar(36) null, "version" int not null default 1);
alter table "test2" add constraint "test2_book_uuid_pk_unique" unique ("book_uuid_pk");

create table "foo_bar2" ("id" serial primary key, "name" varchar(255) not null, "baz_id" int null, "foo_bar_id" int null, "version" timestamp(3) not null default current_timestamp(3));
alter table "foo_bar2" add constraint "foo_bar2_baz_id_unique" unique ("baz_id");
alter table "foo_bar2" add constraint "foo_bar2_foo_bar_id_unique" unique ("foo_bar_id");

create table "foo_baz2" ("id" serial primary key, "name" varchar(255) not null);

create table "book2_to_book_tag2" ("id" serial primary key, "book2_uuid_pk" varchar(36) not null, "book_tag2_id" int not null);

create table "publisher2_to_test2" ("id" serial primary key, "publisher2_id" int not null, "test2_id" int not null);

alter table "author2" add constraint "author2_favourite_book_uuid_pk_foreign" foreign key ("favourite_book_uuid_pk") references "book2" ("uuid_pk") on update cascade on delete set null;
alter table "author2" add constraint "author2_favourite_author_id_foreign" foreign key ("favourite_author_id") references "author2" ("id") on update cascade on delete set null;

alter table "book2" add constraint "book2_author_id_foreign" foreign key ("author_id") references "author2" ("id") on delete set null;
alter table "book2" add constraint "book2_publisher_id_foreign" foreign key ("publisher_id") references "publisher2" ("id") on delete set null;

alter table "test2" add constraint "test2_book_uuid_pk_foreign" foreign key ("book_uuid_pk") references "book2" ("uuid_pk") on delete set null;

alter table "foo_bar2" add constraint "foo_bar2_baz_id_foreign" foreign key ("baz_id") references "foo_baz2" ("id") on update cascade on delete set null;
alter table "foo_bar2" add constraint "foo_bar2_foo_bar_id_foreign" foreign key ("foo_bar_id") references "foo_bar2" ("id") on update cascade on delete set null;

alter table "book2_to_book_tag2" add constraint "book2_to_book_tag2_book2_uuid_pk_foreign" foreign key ("book2_uuid_pk") references "book2" ("uuid_pk") on update cascade on delete cascade;
alter table "book2_to_book_tag2" add constraint "book2_to_book_tag2_book_tag2_id_foreign" foreign key ("book_tag2_id") references "book_tag2" ("id") on update cascade on delete cascade;

alter table "publisher2_to_test2" add constraint "publisher2_to_test2_publisher2_id_foreign" foreign key ("publisher2_id") references "publisher2" ("id") on update cascade on delete cascade;
alter table "publisher2_to_test2" add constraint "publisher2_to_test2_test2_id_foreign" foreign key ("test2_id") references "test2" ("id") on update cascade on delete cascade;

set session_replication_role = 'origin';
