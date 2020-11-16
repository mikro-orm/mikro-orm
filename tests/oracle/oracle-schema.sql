create table "sandwich" ("id" integer not null primary key, "name" varchar2(55) not null, "price" number(11) not null)
DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE ('CREATE SEQUENCE "sandwich_seq"');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = 'P'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = 'sandwich';  execute immediate ('create or replace trigger "sandwich_autoinc_trg"  BEFORE INSERT on "sandwich"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "sandwich_seq".nextval into :new."' || PK_NAME || '" from dual;        select count("' || PK_NAME || '") into checking from "sandwich"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'); END;

create table "publisher" ("id" integer not null primary key, "name" varchar2(255) not null, "type" varchar2(6) check ("type" in ('local', 'global')) not null, "type2" varchar2(6) check ("type2" in ('LOCAL', 'GLOBAL')) not null, "enum1" number(3) null, "enum2" number(3) null, "enum3" number(3) null, "enum4" varchar2(1) check ("enum4" in ('a', 'b', 'c')) null)
DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE ('CREATE SEQUENCE "publisher_seq"');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = 'P'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = 'publisher';  execute immediate ('create or replace trigger "publisher_autoinc_trg"  BEFORE INSERT on "publisher"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "publisher_seq".nextval into :new."' || PK_NAME || '" from dual;        select count("' || PK_NAME || '") into checking from "publisher"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'); END;

create table "label" ("uuid" varchar2(40) not null, "name" varchar2(255) not null)
alter table "label" add constraint "label_pkey" primary key ("uuid")

create table "foo_baz" ("id" integer not null primary key, "name" varchar2(255) not null, "version" timestamp(3) with time zone default current_timestamp(3) not null)
DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE ('CREATE SEQUENCE "foo_baz_seq"');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = 'P'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = 'foo_baz';  execute immediate ('create or replace trigger "foo_baz_autoinc_trg"  BEFORE INSERT on "foo_baz"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "foo_baz_seq".nextval into :new."' || PK_NAME || '" from dual;        select count("' || PK_NAME || '") into checking from "foo_baz"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'); END;

create table "foo_bar" ("id" integer not null primary key, "name" varchar2(255) not null, "baz_id" number(11) null, "foo_bar_id" number(11) null, "version" timestamp with time zone default current_timestamp not null, "blob" blob null, "array" clob null, "object" clob null)
DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE ('CREATE SEQUENCE "foo_bar_seq"');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = 'P'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = 'foo_bar';  execute immediate ('create or replace trigger "foo_bar_autoinc_trg"  BEFORE INSERT on "foo_bar"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "foo_bar_seq".nextval into :new."' || PK_NAME || '" from dual;        select count("' || PK_NAME || '") into checking from "foo_bar"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'); END;
create index "foo_bar_baz_id_index" on "foo_bar" ("baz_id")
alter table "foo_bar" add constraint "foo_bar_baz_id_unique" unique ("baz_id")
create index "foo_bar_foo_bar_id_index" on "foo_bar" ("foo_bar_id")
alter table "foo_bar" add constraint "foo_bar_foo_bar_id_unique" unique ("foo_bar_id")

create table "foo_param" ("bar_id" number(11) not null, "baz_id" number(11) not null, "value" varchar2(255) not null)
create index "foo_param_bar_id_index" on "foo_param" ("bar_id")
create index "foo_param_baz_id_index" on "foo_param" ("baz_id")
alter table "foo_param" add constraint "foo_param_pkey" primary key ("bar_id", "baz_id")

create table "dummy" ("id" integer not null primary key)
DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE ('CREATE SEQUENCE "dummy_seq"');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = 'P'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = 'dummy';  execute immediate ('create or replace trigger "dummy_autoinc_trg"  BEFORE INSERT on "dummy"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "dummy_seq".nextval into :new."' || PK_NAME || '" from dual;        select count("' || PK_NAME || '") into checking from "dummy"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'); END;

create table "car" ("name" varchar2(100) not null, "year" number(11) not null, "price" number(11) not null)
create index "car_name_index" on "car" ("name")
create index "car_year_index" on "car" ("year")
alter table "car" add constraint "car_pkey" primary key ("name", "year")

create table "car_owner" ("id" integer not null primary key, "name" varchar2(255) not null, "car_name" varchar2(100) not null, "car_year" number(11) not null)
DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE ('CREATE SEQUENCE "car_owner_seq"');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = 'P'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = 'car_owner';  execute immediate ('create or replace trigger "car_owner_autoinc_trg"  BEFORE INSERT on "car_owner"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "car_owner_seq".nextval into :new."' || PK_NAME || '" from dual;        select count("' || PK_NAME || '") into checking from "car_owner"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'); END;
create index "car_owner_car_name_car_year_index" on "car_owner" ("car_name", "car_year")

create table "user" ("first_name" varchar2(100) not null, "last_name" varchar2(100) not null, "foo" number(11) null, "favourite_car_name" varchar2(100) null, "favourite_car_year" number(11) null)
alter table "user" add constraint "user_favourite_car_name_unique" unique ("favourite_car_name")
alter table "user" add constraint "user_favourite_car_year_unique" unique ("favourite_car_year")
alter table "user" add constraint "user_pkey" primary key ("first_name", "last_name")
create index "user_favourite_car_name_favourite_car_year_index" on "user" ("favourite_car_name", "favourite_car_year")

create table "user_sandwiches" ("user_first_name" varchar2(100) not null, "user_last_name" varchar2(100) not null, "sandwich_id" number(11) not null)
create index "user_sandwiches_sandwich_id_index" on "user_sandwiches" ("sandwich_id")
alter table "user_sandwiches" add constraint "user_sandwiches_pkey" primary key ("user_first_name", "user_last_name", "sandwich_id")
create index "user_sandwiches_user_first_name_user_last_name_index" on "user_sandwiches" ("user_first_name", "user_last_name")

create table "user_cars" ("user_first_name" varchar2(100) not null, "user_last_name" varchar2(100) not null, "car_name" varchar2(100) not null, "car_year" number(11) not null)
alter table "user_cars" add constraint "user_cars_pkey" primary key ("user_first_name", "user_last_name", "car_name", "car_year")
create index "user_cars_user_first_name_user_last_name_index" on "user_cars" ("user_first_name", "user_last_name")
create index "user_cars_car_name_car_year_index" on "user_cars" ("car_name", "car_year")

create table "book_tag" ("id" number(19) not null, "name" varchar2(50) not null)
alter table "book_tag" add constraint "book_tag_pkey" primary key ("id")

create table "base_user" ("id" integer not null primary key, "first_name" varchar2(100) not null, "last_name" varchar2(100) not null, "type" varchar2(8) check ("type" in ('employee', 'manager', 'owner')) not null, "owner_prop" varchar2(255) null, "favourite_employee_id" number(11) null, "favourite_manager_id" number(11) null, "employee_prop" number(11) null, "manager_prop" varchar2(255) null)
DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE ('CREATE SEQUENCE "base_user_seq"');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = 'P'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = 'base_user';  execute immediate ('create or replace trigger "base_user_autoinc_trg"  BEFORE INSERT on "base_user"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "base_user_seq".nextval into :new."' || PK_NAME || '" from dual;        select count("' || PK_NAME || '") into checking from "base_user"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'); END;
create index "base_user_type_index" on "base_user" ("type")
create index "base_user_favourite_employee_id_index" on "base_user" ("favourite_employee_id")
create index "base_user_favourite_manager_id_index" on "base_user" ("favourite_manager_id")
alter table "base_user" add constraint "base_user_favourite_manager_id_unique" unique ("favourite_manager_id")

create table "author" ("id" integer not null primary key, "created_at" timestamp(3) with time zone default current_timestamp(3) not null, "updated_at" timestamp(3) with time zone default current_timestamp(3) not null, "name" varchar2(255) not null, "email" varchar2(255) not null, "age" number(11) default null null, "terms_accepted" number(1) default 0 not null, "optional" number(1) null, "identities" clob null, "born" date null, "born_time" char(8) null, "favourite_book_uuid_pk" varchar2(36) null, "favourite_author_id" number(11) null)
DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE ('CREATE SEQUENCE "author_seq"');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = 'P'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = 'author';  execute immediate ('create or replace trigger "author_autoinc_trg"  BEFORE INSERT on "author"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "author_seq".nextval into :new."' || PK_NAME || '" from dual;        select count("' || PK_NAME || '") into checking from "author"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'); END;
create index "custom_email_index_name" on "author" ("email")
alter table "author" add constraint "custom_email_unique_name" unique ("email")
create index "author_terms_accepted_index" on "author" ("terms_accepted")
create index "author_born_index" on "author" ("born")
create index "born_time_idx" on "author" ("born_time")
create index "author_favourite_book_uuid_pk_index" on "author" ("favourite_book_uuid_pk")
create index "author_favourite_author_id_index" on "author" ("favourite_author_id")
create index "custom_idx_name_13" on "author" ("name")
create index "author_name_age_index" on "author" ("name", "age")
alter table "author" add constraint "author_name_email_unique" unique ("name", "email")

create table "book" ("uuid_pk" varchar2(36) not null, "created_at" timestamp(3) with time zone default current_timestamp(3) not null, "title" varchar2(255) default '' null, "perex" clob null, "price" float null, "double" double precision null, "meta" clob null, "author_id" number(11) not null, "publisher_id" number(11) null)
alter table "book" add constraint "book_pkey" primary key ("uuid_pk")
create index "book_author_id_index" on "book" ("author_id")
create index "book_publisher_id_index" on "book" ("publisher_id")

create table "test" ("id" integer not null primary key, "name" varchar2(255) null, "book_uuid_pk" varchar2(36) null, "version" number(11) default 1 not null)
DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE ('CREATE SEQUENCE "test_seq"');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = 'P'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = 'test';  execute immediate ('create or replace trigger "test_autoinc_trg"  BEFORE INSERT on "test"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "test_seq".nextval into :new."' || PK_NAME || '" from dual;        select count("' || PK_NAME || '") into checking from "test"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'); END;
create index "test_book_uuid_pk_index" on "test" ("book_uuid_pk")
alter table "test" add constraint "test_book_uuid_pk_unique" unique ("book_uuid_pk")

create table "configuration" ("property" varchar2(255) not null, "test_id" number(11) not null, "value" varchar2(255) not null)
create index "configuration_test_id_index" on "configuration" ("test_id")
alter table "configuration" add constraint "configuration_pkey" primary key ("property", "test_id")

create table "publisher_tests" ("id" integer not null primary key, "publisher_id" number(11) not null, "test_id" number(11) not null)
DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE ('CREATE SEQUENCE "publisher_tests_seq"');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = 'P'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = 'publisher_tests';  execute immediate ('create or replace trigger "publisher_tests_autoinc_trg"  BEFORE INSERT on "publisher_tests"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "publisher_tests_seq".nextval into :new."' || PK_NAME || '" from dual;        select count("' || PK_NAME || '") into checking from "publisher_tests"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'); END;
create index "publisher_tests_publisher_id_index" on "publisher_tests" ("publisher_id")
create index "publisher_tests_test_id_index" on "publisher_tests" ("test_id")

create table "book_tags" ("order" integer not null primary key, "book_uuid_pk" varchar2(36) not null, "book_tag_id" number(19) not null)
DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE ('CREATE SEQUENCE "book_tags_seq"');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = 'P'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = 'book_tags';  execute immediate ('create or replace trigger "book_tags_autoinc_trg"  BEFORE INSERT on "book_tags"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "book_tags_seq".nextval into :new."' || PK_NAME || '" from dual;        select count("' || PK_NAME || '") into checking from "book_tags"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'); END;
create index "book_tags_book_uuid_pk_index" on "book_tags" ("book_uuid_pk")
create index "book_tags_book_tag_id_index" on "book_tags" ("book_tag_id")

create table "book_to_tag_unordered" ("book_uuid_pk" varchar2(36) not null, "book_tag_id" number(19) not null)
create index "book_to_tag_unordered_book_uuid_pk_index" on "book_to_tag_unordered" ("book_uuid_pk")
create index "book_to_tag_unordered_book_tag_id_index" on "book_to_tag_unordered" ("book_tag_id")
alter table "book_to_tag_unordered" add constraint "book_to_tag_unordered_pkey" primary key ("book_uuid_pk", "book_tag_id")

create table "author_to_friend" ("author_1_id" number(11) not null, "author_2_id" number(11) not null)
create index "author_to_friend_author_1_id_index" on "author_to_friend" ("author_1_id")
create index "author_to_friend_author_2_id_index" on "author_to_friend" ("author_2_id")
alter table "author_to_friend" add constraint "author_to_friend_pkey" primary key ("author_1_id", "author_2_id")

create table "author_following" ("author_1_id" number(11) not null, "author_2_id" number(11) not null)
create index "author_following_author_1_id_index" on "author_following" ("author_1_id")
create index "author_following_author_2_id_index" on "author_following" ("author_2_id")
alter table "author_following" add constraint "author_following_pkey" primary key ("author_1_id", "author_2_id")

create table "address" ("author_id" number(11) not null, "value" varchar2(255) not null)
comment on table "address" is 'This is address table'
comment on column "address"."value" is 'This is address property'
alter table "address" add constraint "address_pkey" primary key ("author_id")

alter table "foo_bar" add constraint "foo_bar_baz_id_foreign" foreign key ("baz_id") references "foo_baz" ("id") on delete set null
alter table "foo_bar" add constraint "foo_bar_foo_bar_id_foreign" foreign key ("foo_bar_id") references "foo_bar" ("id") on delete set null

alter table "foo_param" add constraint "foo_param_bar_id_foreign" foreign key ("bar_id") references "foo_bar" ("id")
alter table "foo_param" add constraint "foo_param_baz_id_foreign" foreign key ("baz_id") references "foo_baz" ("id")

alter table "car_owner" add constraint "vuaCbWqjJ03hCbSQbqPBoHOnG+Q" foreign key ("car_name", "car_year") references "car" ("name", "year")

alter table "user" add constraint "JBxhYUkOpu7MbJnxPzEHBS+ErIk" foreign key ("favourite_car_name", "favourite_car_year") references "car" ("name", "year") on delete set null

alter table "user_sandwiches" add constraint "kC7AuoM5eu0O4TvzdQ3wFU9Fkss" foreign key ("user_first_name", "user_last_name") references "user" ("first_name", "last_name") on delete cascade
alter table "user_sandwiches" add constraint "YrF/zRtRkiA5hRm7Yrc4j5dzrz8" foreign key ("sandwich_id") references "sandwich" ("id") on delete cascade

alter table "user_cars" add constraint "rQBJqbrW5UJu7ELE6R62qHHfkcE" foreign key ("user_first_name", "user_last_name") references "user" ("first_name", "last_name") on delete cascade
alter table "user_cars" add constraint "6RD/n622Ap5A48/F18uFUnm2cuQ" foreign key ("car_name", "car_year") references "car" ("name", "year") on delete cascade

alter table "base_user" add constraint "hW5N0uAs6g5ig2gP0tpZvAnWlY0" foreign key ("favourite_employee_id") references "base_user" ("id") on delete set null
alter table "base_user" add constraint "cUz3eTPMAsobqWw0pO8WOf5vnLM" foreign key ("favourite_manager_id") references "base_user" ("id") on delete set null

alter table "author" add constraint "y5dzH7uMUD26XSVJG963+IZMOh4" foreign key ("favourite_book_uuid_pk") references "book" ("uuid_pk") on delete cascade
alter table "author" add constraint "7ScDfMBmQtndnl4ioSl0ry3o2PA" foreign key ("favourite_author_id") references "author" ("id") on delete set null

alter table "book" add constraint "book_author_id_foreign" foreign key ("author_id") references "author" ("id")
alter table "book" add constraint "book_publisher_id_foreign" foreign key ("publisher_id") references "publisher" ("id") on delete cascade

alter table "test" add constraint "test_book_uuid_pk_foreign" foreign key ("book_uuid_pk") references "book" ("uuid_pk") on delete set null

alter table "configuration" add constraint "configuration_test_id_foreign" foreign key ("test_id") references "test" ("id")

alter table "publisher_tests" add constraint "eI/lsV4b4i0XolKi3nzzOgw+ROc" foreign key ("publisher_id") references "publisher" ("id") on delete cascade
alter table "publisher_tests" add constraint "sVwg67zQ3eVP1yztWXKd7dkFQNg" foreign key ("test_id") references "test" ("id") on delete cascade

alter table "book_tags" add constraint "book_tags_book_uuid_pk_foreign" foreign key ("book_uuid_pk") references "book" ("uuid_pk") on delete cascade
alter table "book_tags" add constraint "book_tags_book_tag_id_foreign" foreign key ("book_tag_id") references "book_tag" ("id") on delete cascade

alter table "book_to_tag_unordered" add constraint "xV3U1Vqb6VOBzTk4AyvUyCyNa4M" foreign key ("book_uuid_pk") references "book" ("uuid_pk") on delete cascade
alter table "book_to_tag_unordered" add constraint "SNYtdC1ATLTCyvcIAStoei5vKRQ" foreign key ("book_tag_id") references "book_tag" ("id") on delete cascade

alter table "author_to_friend" add constraint "SnAGN1+wAQYsEi+m4WsdZ52/tgc" foreign key ("author_1_id") references "author" ("id") on delete cascade
alter table "author_to_friend" add constraint "m773A9a7aqkiil5mXx4htMxMYZo" foreign key ("author_2_id") references "author" ("id") on delete cascade

alter table "author_following" add constraint "joLFkckn1VncR+eqvFZD+mKSi98" foreign key ("author_1_id") references "author" ("id") on delete cascade
alter table "author_following" add constraint "/QFPwJv+C/orvVMMAGLnL4Ottm4" foreign key ("author_2_id") references "author" ("id") on delete cascade

alter table "address" add constraint "address_author_id_foreign" foreign key ("author_id") references "author" ("id") on delete cascade
