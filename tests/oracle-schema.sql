alter table "user2_sandwiches" drop constraint "user2_sandwiches_sandwich_id_foreign";
alter table "user2_sandwiches" drop constraint "user2_sandwiches_user2_first_name_user2_last_name_foreign";
alter table "user2_cars" drop constraint "user2_cars_car2_name_car2_year_foreign";
alter table "user2_cars" drop constraint "user2_cars_user2_first_name_user2_last_name_foreign";
alter table "user2" drop constraint "user2_favourite_car_name_favourite_car_year_foreign";
alter table "test2_bars" drop constraint "test2_bars_foo_bar2_id_foreign";
alter table "test2_bars" drop constraint "test2_bars_test2_id_foreign";
alter table "configuration2" drop constraint "configuration2_test_id_foreign";
alter table "publisher2_tests" drop constraint "publisher2_tests_publisher2_id_foreign";
alter table "publisher2_tests" drop constraint "publisher2_tests_test2_id_foreign";
alter table "test2" drop constraint "test2_book_uuid_pk_foreign";
alter table "test2" drop constraint "test2_parent_id_foreign";
alter table "address2" drop constraint "address2_author_id_foreign";
alter table "author_to_friend" drop constraint "author_to_friend_author2_2_id_foreign";
alter table "author_to_friend" drop constraint "author_to_friend_author2_1_id_foreign";
alter table "author2_following" drop constraint "author2_following_author2_2_id_foreign";
alter table "author2_following" drop constraint "author2_following_author2_1_id_foreign";
alter table "book_to_tag_unordered" drop constraint "book_to_tag_unordered_book2_uuid_pk_foreign";
alter table "book_to_tag_unordered" drop constraint "book_to_tag_unordered_book_tag2_id_foreign";
alter table "book2_tags" drop constraint "book2_tags_book2_uuid_pk_foreign";
alter table "book2_tags" drop constraint "book2_tags_book_tag2_id_foreign";
alter table "book2" drop constraint "book2_author_id_foreign";
alter table "book2" drop constraint "book2_publisher_id_foreign";
alter table "author2" drop constraint "author2_favourite_author_id_foreign";
alter table "author2" drop constraint "author2_favourite_book_uuid_pk_foreign";
alter table "foo_param2" drop constraint "foo_param2_bar_id_foreign";
alter table "foo_param2" drop constraint "foo_param2_baz_id_foreign";
alter table "foo_bar2" drop constraint "foo_bar2_foo_bar_id_foreign";
alter table "foo_bar2" drop constraint "foo_bar2_baz_id_foreign";
alter table "car_owner2" drop constraint "car_owner2_car_name_car_year_foreign";
alter table "base_user2" drop constraint "base_user2_favourite_employee_id_foreign";
alter table "base_user2" drop constraint "base_user2_favourite_manager_id_foreign";
drop table if exists "user2_sandwiches" cascade constraint;
drop table if exists "user2_cars" cascade constraint;
drop table if exists "user2" cascade constraint;
drop table if exists "test2_bars" cascade constraint;
drop table if exists "configuration2" cascade constraint;
drop table if exists "publisher2_tests" cascade constraint;
drop table if exists "test2" cascade constraint;
drop table if exists "sandwich" cascade constraint;
drop table if exists "address2" cascade constraint;
drop table if exists "author_to_friend" cascade constraint;
drop table if exists "author2_following" cascade constraint;
drop table if exists "book_to_tag_unordered" cascade constraint;
drop table if exists "book2_tags" cascade constraint;
drop table if exists "book2" cascade constraint;
drop table if exists "author2" cascade constraint;
drop table if exists "publisher2" cascade constraint;
drop table if exists "foo_param2" cascade constraint;
drop table if exists "foo_bar2" cascade constraint;
drop table if exists "foo_baz2" cascade constraint;
drop table if exists "dummy2" cascade constraint;
drop table if exists "car_owner2" cascade constraint;
drop table if exists "car2" cascade constraint;
drop table if exists "book_tag2" cascade constraint;
drop table if exists "base_user2" cascade constraint;

create table "base_user2" ("id" number(10) generated always as identity not null primary key, "first_name" varchar2(100) not null, "last_name" varchar2(100) not null, "type" varchar2(8) not null, "owner_prop" varchar2(255) null, "favourite_employee_id" number(10) null, "favourite_manager_id" number(10) null, "employee_prop" number(10) null, "manager_prop" varchar2(255) null);
create index "base_user2_type_index" on "base_user2" ("type");
create unique index "base_user2_favourite_manager_id_unique" on "base_user2" (case when "favourite_manager_id" is not null then "favourite_manager_id" end);
create unique index "base_user2_employee_prop_unique" on "base_user2" (case when "employee_prop" is not null then "employee_prop" end);
alter table "base_user2" add constraint "base_user2_type_check" check ("type" in ('employee', 'manager', 'owner'));

create table "book_tag2" ("id" number(10) generated always as identity not null primary key, "name" varchar2(50) not null);

create table "car2" ("name" varchar2(100) not null, "year" number(10) not null, "price" number(10) not null, primary key ("name", "year"));
create index "car2_name_index" on "car2" ("name");
create index "car2_year_index" on "car2" ("year");

create table "car_owner2" ("id" number(10) generated always as identity not null primary key, "name" varchar2(255) not null, "car_name" varchar2(100) not null, "car_year" number(10) not null);
create index "car_owner2_car_name_car_year_index" on "car_owner2" ("car_name", "car_year");

create table "dummy2" ("id" number(10) generated always as identity not null primary key);

create table "foo_baz2" ("id" number(10) generated always as identity not null primary key, "name" varchar2(255) not null, "code" varchar2(255) not null, "version" timestamp(3) with time zone default current_timestamp not null);

create table "foo_bar2" ("id" number(10) generated always as identity not null primary key, "name" varchar2(255) not null, "name with space" varchar2(255) null, "baz_id" number(10) null, "foo_bar_id" number(10) null, "version" timestamp(0) with time zone default current_timestamp not null, "blob" blob null, "blob2" blob null, "array" clob null, "object_property" json null);
create unique index "foo_bar2_baz_id_unique" on "foo_bar2" (case when "baz_id" is not null then "baz_id" end);
create unique index "foo_bar2_foo_bar_id_unique" on "foo_bar2" (case when "foo_bar_id" is not null then "foo_bar_id" end);

create table "foo_param2" ("bar_id" number(10) not null, "baz_id" number(10) not null, "value" varchar2(255) not null, "version" timestamp(3) with time zone default current_timestamp not null, primary key ("bar_id", "baz_id"));

create table "publisher2" ("id" number(10) generated always as identity not null primary key, "name" varchar2(255) default 'asd' not null, "type" varchar2(6) default 'local' not null, "type2" varchar2(6) default 'LOCAL' not null, "enum1" number(5) null, "enum2" number(3) null, "enum3" number(3) null, "enum4" varchar2(1) null, "enum5" varchar2(1) null);
alter table "publisher2" add constraint "publisher2_type_check" check ("type" in ('local', 'global'));
alter table "publisher2" add constraint "publisher2_type2_check" check ("type2" in ('LOCAL', 'GLOBAL'));
alter table "publisher2" add constraint "publisher2_enum4_check" check ("enum4" in ('a', 'b', 'c'));
alter table "publisher2" add constraint "publisher2_enum5_check" check ("enum5" in ('a'));

create table "author2" ("id" number(10) generated always as identity not null primary key, "created_at" timestamp(3) with time zone default current_timestamp(3) not null, "updated_at" timestamp(3) with time zone default current_timestamp(3) not null, "name" varchar2(255) not null, "email" varchar2(255) not null, "age" number(10) null, "terms_accepted" boolean default 0 not null, "optional" boolean null, "identities" clob null, "born" varchar2(10) null, "born_time" varchar2(8) null, "favourite_book_uuid_pk" raw(16) null, "favourite_author_id" number(10) null, "identity" json null);
create unique index "custom_email_unique_name" on "author2" ("email");
create index "author2_terms_accepted_index" on "author2" ("terms_accepted");
create index "author2_born_index" on "author2" ("born");
create index "born_time_idx" on "author2" ("born_time");
create index "custom_idx_name_123" on "author2" ("name");
create index "author2_name_age_index" on "author2" ("name", "age");
create unique index "author2_name_email_unique" on "author2" ("name", "email");

create table "book2" ("uuid_pk" raw(16) not null, "created_at" timestamp(3) with time zone default current_timestamp(3) not null, "isbn" char(13) null, "title" varchar2(255) default '' null, "perex" clob null, "price" number(8, 2) null, "double" binary_double null, "meta" json null, "author_id" number(10) not null, "publisher_id" number(10) null, primary key ("uuid_pk"));
create unique index "book2_isbn_unique" on "book2" (case when "isbn" is not null then "isbn" end);
create index "book2_title_index" on "book2" ("title");

create table "book2_tags" ("order" number(10) generated always as identity not null primary key, "book2_uuid_pk" raw(16) not null, "book_tag2_id" number(19) not null);

create table "book_to_tag_unordered" ("book2_uuid_pk" raw(16) not null, "book_tag2_id" number(19) not null, primary key ("book2_uuid_pk", "book_tag2_id"));

create table "author2_following" ("author2_1_id" number(10) not null, "author2_2_id" number(10) not null, primary key ("author2_1_id", "author2_2_id"));

create table "author_to_friend" ("author2_1_id" number(10) not null, "author2_2_id" number(10) not null, primary key ("author2_1_id", "author2_2_id"));

create table "address2" ("author_id" number(10) not null, "value" varchar2(255) not null, primary key ("author_id"));
comment on table "address2" is 'This is address table';
comment on column "address2"."value" is 'This is address property';

create table "sandwich" ("id" number(10) generated always as identity not null primary key, "name" varchar2(255) not null, "price" number(10) not null);

create table "test2" ("id" number(10) generated always as identity not null primary key, "name" varchar2(255) null, "book_uuid_pk" raw(16) null, "parent_id" number(10) null, "version" number(10) default 1 not null);
create unique index "test2_book_uuid_pk_unique" on "test2" (case when "book_uuid_pk" is not null then "book_uuid_pk" end);

create table "publisher2_tests" ("id" number(10) generated always as identity not null primary key, "publisher2_id" number(10) not null, "test2_id" number(10) not null);

create table "configuration2" ("property" varchar2(255) not null, "test_id" number(10) not null, "value" varchar2(255) not null, primary key ("property", "test_id"));

create table "test2_bars" ("test2_id" number(10) not null, "foo_bar2_id" number(10) not null, primary key ("test2_id", "foo_bar2_id"));

create table "user2" ("first_name" varchar2(100) not null, "last_name" varchar2(100) not null, "foo" number(10) null, "favourite_car_name" varchar2(100) null, "favourite_car_year" number(10) null, primary key ("first_name", "last_name"));
create unique index "user2_favourite_car_name_favourite_car_year_unique" on "user2" (case when "favourite_car_name" is not null and "favourite_car_year" is not null then "favourite_car_name" end, case when "favourite_car_name" is not null and "favourite_car_year" is not null then "favourite_car_year" end);

create table "user2_cars" ("user2_first_name" varchar2(100) not null, "user2_last_name" varchar2(100) not null, "car2_name" varchar2(100) not null, "car2_year" number(10) not null, primary key ("user2_first_name", "user2_last_name", "car2_name", "car2_year"));

create table "user2_sandwiches" ("user2_first_name" varchar2(100) not null, "user2_last_name" varchar2(100) not null, "sandwich_id" number(10) not null, primary key ("user2_first_name", "user2_last_name", "sandwich_id"));

alter table "base_user2" add constraint "base_user2_favourite_employee_id_foreign" foreign key ("favourite_employee_id") references "base_user2" ("id");
alter table "base_user2" add constraint "base_user2_favourite_manager_id_foreign" foreign key ("favourite_manager_id") references "base_user2" ("id");

alter table "car_owner2" add constraint "car_owner2_car_name_car_year_foreign" foreign key ("car_name", "car_year") references "car2" ("name", "year");

alter table "foo_bar2" add constraint "foo_bar2_baz_id_foreign" foreign key ("baz_id") references "foo_baz2" ("id");
alter table "foo_bar2" add constraint "foo_bar2_foo_bar_id_foreign" foreign key ("foo_bar_id") references "foo_bar2" ("id");

alter table "foo_param2" add constraint "foo_param2_bar_id_foreign" foreign key ("bar_id") references "foo_bar2" ("id");
alter table "foo_param2" add constraint "foo_param2_baz_id_foreign" foreign key ("baz_id") references "foo_baz2" ("id");

alter table "author2" add constraint "author2_favourite_book_uuid_pk_foreign" foreign key ("favourite_book_uuid_pk") references "book2" ("uuid_pk") on delete cascade;
alter table "author2" add constraint "author2_favourite_author_id_foreign" foreign key ("favourite_author_id") references "author2" ("id");

alter table "book2" add constraint "book2_author_id_foreign" foreign key ("author_id") references "author2" ("id");
alter table "book2" add constraint "book2_publisher_id_foreign" foreign key ("publisher_id") references "publisher2" ("id") on delete cascade;

alter table "book2_tags" add constraint "book2_tags_book2_uuid_pk_foreign" foreign key ("book2_uuid_pk") references "book2" ("uuid_pk") on delete cascade;
alter table "book2_tags" add constraint "book2_tags_book_tag2_id_foreign" foreign key ("book_tag2_id") references "book_tag2" ("id") on delete cascade;

alter table "book_to_tag_unordered" add constraint "book_to_tag_unordered_book2_uuid_pk_foreign" foreign key ("book2_uuid_pk") references "book2" ("uuid_pk") on delete cascade;
alter table "book_to_tag_unordered" add constraint "book_to_tag_unordered_book_tag2_id_foreign" foreign key ("book_tag2_id") references "book_tag2" ("id") on delete cascade;

alter table "author2_following" add constraint "author2_following_author2_1_id_foreign" foreign key ("author2_1_id") references "author2" ("id");
alter table "author2_following" add constraint "author2_following_author2_2_id_foreign" foreign key ("author2_2_id") references "author2" ("id");

alter table "author_to_friend" add constraint "author_to_friend_author2_1_id_foreign" foreign key ("author2_1_id") references "author2" ("id");
alter table "author_to_friend" add constraint "author_to_friend_author2_2_id_foreign" foreign key ("author2_2_id") references "author2" ("id");

alter table "address2" add constraint "address2_author_id_foreign" foreign key ("author_id") references "author2" ("id") on delete cascade;

alter table "test2" add constraint "test2_book_uuid_pk_foreign" foreign key ("book_uuid_pk") references "book2" ("uuid_pk");
alter table "test2" add constraint "test2_parent_id_foreign" foreign key ("parent_id") references "test2" ("id");

alter table "publisher2_tests" add constraint "publisher2_tests_publisher2_id_foreign" foreign key ("publisher2_id") references "publisher2" ("id") on delete cascade;
alter table "publisher2_tests" add constraint "publisher2_tests_test2_id_foreign" foreign key ("test2_id") references "test2" ("id") on delete cascade;

alter table "configuration2" add constraint "configuration2_test_id_foreign" foreign key ("test_id") references "test2" ("id");

alter table "test2_bars" add constraint "test2_bars_test2_id_foreign" foreign key ("test2_id") references "test2" ("id") on delete cascade;
alter table "test2_bars" add constraint "test2_bars_foo_bar2_id_foreign" foreign key ("foo_bar2_id") references "foo_bar2" ("id") on delete cascade;

alter table "user2" add constraint "user2_favourite_car_name_favourite_car_year_foreign" foreign key ("favourite_car_name", "favourite_car_year") references "car2" ("name", "year");

alter table "user2_cars" add constraint "user2_cars_user2_first_name_user2_last_name_foreign" foreign key ("user2_first_name", "user2_last_name") references "user2" ("first_name", "last_name") on delete cascade;
alter table "user2_cars" add constraint "user2_cars_car2_name_car2_year_foreign" foreign key ("car2_name", "car2_year") references "car2" ("name", "year") on delete cascade;

alter table "user2_sandwiches" add constraint "user2_sandwiches_user2_first_name_user2_last_name_foreign" foreign key ("user2_first_name", "user2_last_name") references "user2" ("first_name", "last_name") on delete cascade;
alter table "user2_sandwiches" add constraint "user2_sandwiches_sandwich_id_foreign" foreign key ("sandwich_id") references "sandwich" ("id") on delete cascade;
