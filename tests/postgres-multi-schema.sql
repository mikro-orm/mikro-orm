-- set names 'utf8';
set session_replication_role = 'replica';

drop schema if exists mikro_orm_test_multi_1 cascade;
drop schema if exists mikro_orm_test_multi_2 cascade;

create schema mikro_orm_test_multi_1;
create schema mikro_orm_test_multi_2;

SET search_path TO mikro_orm_test_multi_1;

drop table if exists "foo_bar_schema2" cascade;

create table foo_bar_schema2 (id int not null primary key, name varchar(255) not null, baz_id int null, foo_bar_id int null, version timestamp not null default current_timestamp, blob bytea null, "array" text null, object json null);

SET search_path TO mikro_orm_test_multi_2;

drop table if exists "foo_baz_schema2" cascade;
drop table if exists "foo_bar_schema2" cascade;

create table "foo_baz_schema2" (id int not null primary key, name varchar(255) not null, version timestamp not null default current_timestamp(3));
create table "foo_bar_schema2" (id int not null primary key, name varchar(255) not null, baz_id int null, foo_bar_id int null, version timestamp not null default current_timestamp, blob bytea null, "array" text null, object json null);

set session_replication_role = 'origin';
