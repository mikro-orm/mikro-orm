set names 'utf8';
set session_replication_role = 'replica';

drop table if exists "author2" cascade;
drop table if exists "address2" cascade;
drop table if exists "book2" cascade;
drop table if exists "book_tag2" cascade;
drop table if exists "publisher2" cascade;
drop table if exists "test2" cascade;
drop table if exists "foo_bar2" cascade;
drop table if exists "foo_baz2" cascade;
drop table if exists "foo_param2" cascade;
drop table if exists "configuration2" cascade;
drop table if exists "author_to_friend" cascade;
drop table if exists "author2_following" cascade;
drop table if exists "book2_tags" cascade;
drop table if exists "book_to_tag_unordered" cascade;
drop table if exists "publisher2_tests" cascade;
drop table if exists "book_to_tag_unordered" cascade;
drop table if exists "label2" cascade;
drop table if exists "new_table" cascade;

drop table if exists "author2_to_author2" cascade;
drop table if exists "book2_to_book_tag2" cascade;
drop table if exists "publisher2_to_test2" cascade;

create table "author2" ("id" serial primary key, "created_at" timestamptz(3) not null default current_timestamp(3), "updated_at" timestamptz(3) not null default current_timestamp(3), "name" varchar(255) not null, "email" varchar(255) not null, "age" int4 null default null, "terms_accepted" bool not null default false, "optional" bool null, "identities" text[] null, "born" date null, "born_time" time(0) null, "favourite_book_uuid_pk" varchar(36) null, "favourite_author_id" int4 null);
create index "custom_email_index_name" on "author2" ("email");
alter table "author2" add constraint "custom_email_unique_name" unique ("email");
create index "author2_terms_accepted_index" on "author2" ("terms_accepted");
create index "author2_born_index" on "author2" ("born");
create index "born_time_idx" on "author2" ("born_time");
create index "custom_idx_name_123" on "author2" ("name");
create index "author2_name_age_index" on "author2" ("name", "age");
alter table "author2" add constraint "author2_name_email_unique" unique ("name", "email");

create table "address2" ("author_id" int4 not null, "value" varchar(255) not null);
alter table "address2" add constraint "address2_pkey" primary key ("author_id");
alter table "address2" add constraint "address2_author_id_unique" unique ("author_id");

create table "book2" ("uuid_pk" varchar(36) not null, "created_at" timestamptz(3) not null default current_timestamp(3), "title" varchar(255) null default '', "perex" text null, "price" float null, "double" numeric null, "meta" jsonb null, "author_id" int4 not null, "publisher_id" int4 null, "foo" varchar(255) null);
alter table "book2" add constraint "book2_pkey" primary key ("uuid_pk");

create table "book_tag2" ("id" bigserial primary key, "name" varchar(50) not null);

create table "publisher2" ("id" serial primary key, "name" varchar(255) not null, "type" text check ("type" in ('local', 'global')) not null, "type2" text check ("type2" in ('LOCAL', 'GLOBAL')) not null, "enum1" int2 null, "enum2" int2 null, "enum3" int2 null, "enum4" text check ("enum4" in ('a', 'b', 'c')) null);

create table "test2" ("id" serial primary key, "name" varchar(255) null, "book_uuid_pk" varchar(36) null, "version" int4 not null default 1, "path" polygon null);
alter table "test2" add constraint "test2_book_uuid_pk_unique" unique ("book_uuid_pk");

create table "foo_bar2" ("id" serial primary key, "name" varchar(255) not null, "baz_id" int4 null, "foo_bar_id" int4 null, "version" timestamptz(0) not null default current_timestamp(0), "blob" bytea null, "array" text[] null, "object" jsonb null);
alter table "foo_bar2" add constraint "foo_bar2_baz_id_unique" unique ("baz_id");
alter table "foo_bar2" add constraint "foo_bar2_foo_bar_id_unique" unique ("foo_bar_id");

create table "foo_baz2" ("id" serial primary key, "name" varchar(255) not null, "version" timestamptz(3) not null default current_timestamp(3));

create table "foo_param2" ("bar_id" int4 not null, "baz_id" int4 not null, "value" varchar(255) not null);
create index "foo_param2_bar_id_index" on "foo_param2" ("bar_id");
create index "foo_param2_baz_id_index" on "foo_param2" ("baz_id");
alter table "foo_param2" add constraint "foo_param2_pkey" primary key ("bar_id", "baz_id");

create table "label2" ("uuid" uuid not null, "name" varchar(255) not null);
alter table "label2" add constraint "label2_pkey" primary key ("uuid");

create table "configuration2" ("property" varchar(255) not null, "test_id" int4 not null, "value" varchar(255) not null);
create index "configuration2_property_index" on "configuration2" ("property");
create index "configuration2_test_id_index" on "configuration2" ("test_id");
alter table "configuration2" add constraint "configuration2_pkey" primary key ("property", "test_id");

create table "author_to_friend" ("author2_1_id" int4 not null, "author2_2_id" int4 not null);
alter table "author_to_friend" add constraint "author_to_friend_pkey" primary key ("author2_1_id", "author2_2_id");

create table "author2_following" ("author2_1_id" int4 not null, "author2_2_id" int4 not null);
alter table "author2_following" add constraint "author2_following_pkey" primary key ("author2_1_id", "author2_2_id");

create table "book2_tags" ("order" serial primary key, "book2_uuid_pk" varchar(36) not null, "book_tag2_id" bigint not null);

create table "book_to_tag_unordered" ("book2_uuid_pk" varchar(36) not null, "book_tag2_id" bigint not null);
alter table "book_to_tag_unordered" add constraint "book_to_tag_unordered_pkey" primary key ("book2_uuid_pk", "book_tag2_id");

create table "publisher2_tests" ("id" serial primary key, "publisher2_id" int4 not null, "test2_id" int4 not null);

alter table "author2" add constraint "author2_favourite_book_uuid_pk_foreign" foreign key ("favourite_book_uuid_pk") references "book2" ("uuid_pk") on update no action on delete cascade;
alter table "author2" add constraint "author2_favourite_author_id_foreign" foreign key ("favourite_author_id") references "author2" ("id") on update cascade on delete set null;

alter table "address2" add constraint "address2_author_id_foreign" foreign key ("author_id") references "author2" ("id") on update cascade on delete cascade;

alter table "book2" add constraint "book2_author_id_foreign" foreign key ("author_id") references "author2" ("id");
alter table "book2" add constraint "book2_publisher_id_foreign" foreign key ("publisher_id") references "publisher2" ("id") on update cascade on delete cascade;

alter table "test2" add constraint "test2_book_uuid_pk_foreign" foreign key ("book_uuid_pk") references "book2" ("uuid_pk") on delete set null;

alter table "foo_bar2" add constraint "foo_bar2_baz_id_foreign" foreign key ("baz_id") references "foo_baz2" ("id") on update cascade on delete set null;
alter table "foo_bar2" add constraint "foo_bar2_foo_bar_id_foreign" foreign key ("foo_bar_id") references "foo_bar2" ("id") on update cascade on delete set null;

alter table "foo_param2" add constraint "foo_param2_bar_id_foreign" foreign key ("bar_id") references "foo_bar2" ("id") on update cascade;
alter table "foo_param2" add constraint "foo_param2_baz_id_foreign" foreign key ("baz_id") references "foo_baz2" ("id") on update cascade;

alter table "configuration2" add constraint "configuration2_test_id_foreign" foreign key ("test_id") references "test2" ("id") on update cascade;

alter table "author_to_friend" add constraint "author_to_friend_author2_1_id_foreign" foreign key ("author2_1_id") references "author2" ("id") on update cascade on delete cascade;
alter table "author_to_friend" add constraint "author_to_friend_author2_2_id_foreign" foreign key ("author2_2_id") references "author2" ("id") on update cascade on delete cascade;

alter table "author2_following" add constraint "author2_following_author2_1_id_foreign" foreign key ("author2_1_id") references "author2" ("id") on update cascade on delete cascade;
alter table "author2_following" add constraint "author2_following_author2_2_id_foreign" foreign key ("author2_2_id") references "author2" ("id") on update cascade on delete cascade;

alter table "book2_tags" add constraint "book2_tags_book2_uuid_pk_foreign" foreign key ("book2_uuid_pk") references "book2" ("uuid_pk") on update cascade on delete cascade;
alter table "book2_tags" add constraint "book2_tags_book_tag2_id_foreign" foreign key ("book_tag2_id") references "book_tag2" ("id") on update cascade on delete cascade;

alter table "book_to_tag_unordered" add constraint "book_to_tag_unordered_book2_uuid_pk_foreign" foreign key ("book2_uuid_pk") references "book2" ("uuid_pk") on update cascade on delete cascade;
alter table "book_to_tag_unordered" add constraint "book_to_tag_unordered_book_tag2_id_foreign" foreign key ("book_tag2_id") references "book_tag2" ("id") on update cascade on delete cascade;

alter table "publisher2_tests" add constraint "publisher2_tests_publisher2_id_foreign" foreign key ("publisher2_id") references "publisher2" ("id") on update cascade on delete cascade;
alter table "publisher2_tests" add constraint "publisher2_tests_test2_id_foreign" foreign key ("test2_id") references "test2" ("id") on update cascade on delete cascade;

set session_replication_role = 'origin';
