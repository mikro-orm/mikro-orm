set names 'utf8';
set session_replication_role = 'replica';

drop table if exists "author2" cascade;
drop table if exists "book2" cascade;
drop table if exists "book_tag2" cascade;
drop table if exists "publisher2" cascade;
drop table if exists "test2" cascade;
drop table if exists "foo_bar2" cascade;
drop table if exists "foo_baz2" cascade;
drop table if exists "author_to_friend" cascade;
drop table if exists "author2_to_author2" cascade;
drop table if exists "book2_to_book_tag2" cascade;
drop table if exists "book_to_tag_unordered" cascade;
drop table if exists "publisher2_to_test2" cascade;
drop table if exists "label2" cascade;

create table "author2" ("id" serial primary key, "created_at" timestamptz(3) not null default current_timestamp(3), "updated_at" timestamptz(3) not null default current_timestamp(3), "name" varchar(255) not null, "email" varchar(255) not null, "age" int4 null, "terms_accepted" bool not null default false, "optional" bool null, "identities" json null, "born" timestamp(0) null, "favourite_book_uuid_pk" varchar(36) null, "favourite_author_id" int4 null);
alter table "author2" add constraint "author2_email_unique" unique ("email");

create table "book2" ("uuid_pk" character varying(36) not null, "created_at" timestamptz(3) not null default current_timestamp(3), "title" varchar(255) null, "perex" text null, "price" float null, "double" double precision null, "meta" json null, "author_id" int4 not null, "publisher_id" int4 null, "foo" varchar(255) null);
alter table "book2" add constraint "book2_pkey" primary key ("uuid_pk");

create table "book_tag2" ("id" serial primary key, "name" varchar(50) not null);

create table "publisher2" ("id" serial primary key, "name" varchar(255) not null, "type" text check ("type" in ('local', 'global')) not null, "enum1" int2 null, "enum2" int2 null, "enum3" int2 null, "enum4" text check ("enum4" in ('a', 'b', 'c')) null);

create table "test2" ("id" serial primary key, "name" varchar(255) null, "book_uuid_pk" varchar(36) null, "version" int4 not null default 1, "path" polygon null);
alter table "test2" add constraint "test2_book_uuid_pk_unique" unique ("book_uuid_pk");

create table "foo_bar2" ("id" serial primary key, "name" varchar(255) not null, "baz_id" int4 null, "foo_bar_id" int4 null, "version" timestamptz(3) not null default current_timestamp(3));
alter table "foo_bar2" add constraint "foo_bar2_baz_id_unique" unique ("baz_id");
alter table "foo_bar2" add constraint "foo_bar2_foo_bar_id_unique" unique ("foo_bar_id");

create table "foo_baz2" ("id" serial primary key, "name" varchar(255) not null, "version" timestamptz(3) not null default current_timestamp(3));

create table "author_to_friend" ("author2_1_id" int4 not null, "author2_2_id" int4 not null);
alter table "author_to_friend" add constraint "author_to_friend_pkey" primary key ("author2_1_id", "author2_2_id");

create table "author2_to_author2" ("author2_1_id" int4 not null, "author2_2_id" int4 not null);
alter table "author2_to_author2" add constraint "author2_to_author2_pkey" primary key ("author2_1_id", "author2_2_id");

create table "book2_to_book_tag2" ("order" serial primary key, "book2_uuid_pk" varchar(36) not null, "book_tag2_id" int4 not null);

create table "book_to_tag_unordered" ("book2_uuid_pk" varchar(36) not null, "book_tag2_id" int4 not null, primary key ("book2_uuid_pk", "book_tag2_id"));

create table "publisher2_to_test2" ("id" serial primary key, "publisher2_id" int4 not null, "test2_id" int4 not null);

alter table "author2" add constraint "author2_favourite_book_uuid_pk_foreign" foreign key ("favourite_book_uuid_pk") references "book2" ("uuid_pk") on update cascade on delete set null;
alter table "author2" add constraint "author2_favourite_author_id_foreign" foreign key ("favourite_author_id") references "author2" ("id") on update cascade on delete set null;

alter table "book2" add constraint "book2_author_id_foreign" foreign key ("author_id") references "author2" ("id");
alter table "book2" add constraint "book2_publisher_id_foreign" foreign key ("publisher_id") references "publisher2" ("id") on update cascade on delete cascade;

alter table "test2" add constraint "test2_book_uuid_pk_foreign" foreign key ("book_uuid_pk") references "book2" ("uuid_pk");

alter table "foo_bar2" add constraint "foo_bar2_baz_id_foreign" foreign key ("baz_id") references "foo_baz2" ("id") on update cascade on delete set null;
alter table "foo_bar2" add constraint "foo_bar2_foo_bar_id_foreign" foreign key ("foo_bar_id") references "foo_bar2" ("id") on update cascade on delete set null;

alter table "author_to_friend" add constraint "author_to_friend_author2_1_id_foreign" foreign key ("author2_1_id") references "author2" ("id") on update cascade on delete cascade;
alter table "author_to_friend" add constraint "author_to_friend_author2_2_id_foreign" foreign key ("author2_2_id") references "author2" ("id") on update cascade on delete cascade;

alter table "author2_to_author2" add constraint "author2_to_author2_author2_1_id_foreign" foreign key ("author2_1_id") references "author2" ("id") on update cascade on delete cascade;
alter table "author2_to_author2" add constraint "author2_to_author2_author2_2_id_foreign" foreign key ("author2_2_id") references "author2" ("id") on update cascade on delete cascade;

alter table "book2_to_book_tag2" add constraint "book2_to_book_tag2_book2_uuid_pk_foreign" foreign key ("book2_uuid_pk") references "book2" ("uuid_pk") on update cascade on delete cascade;
alter table "book2_to_book_tag2" add constraint "book2_to_book_tag2_book_tag2_id_foreign" foreign key ("book_tag2_id") references "book_tag2" ("id") on update cascade on delete cascade;

alter table "book_to_tag_unordered" add constraint "book_to_tag_unordered_book2_uuid_pk_foreign" foreign key ("book2_uuid_pk") references "book2" ("uuid_pk") on update cascade on delete cascade;
alter table "book_to_tag_unordered" add constraint "book_to_tag_unordered_book_tag2_id_foreign" foreign key ("book_tag2_id") references "book_tag2" ("id") on update cascade on delete cascade;

alter table "publisher2_to_test2" add constraint "publisher2_to_test2_publisher2_id_foreign" foreign key ("publisher2_id") references "publisher2" ("id") on update cascade on delete cascade;
alter table "publisher2_to_test2" add constraint "publisher2_to_test2_test2_id_foreign" foreign key ("test2_id") references "test2" ("id") on update cascade on delete cascade;

create table "label2" ("uuid" uuid not null, "name" varchar(255) not null);
alter table "label2" add constraint "label2_pkey" primary key ("uuid");

set session_replication_role = 'origin';
