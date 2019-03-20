DROP TABLE IF EXISTS author2;
DROP SEQUENCE IF EXISTS author2_seq;

CREATE SEQUENCE author2_seq;

CREATE TABLE author2 (
  id int check (id > 0) NOT NULL DEFAULT NEXTVAL ('author2_seq'),
  created_at timestamp(3) DEFAULT NULL,
  updated_at timestamp(3) DEFAULT NULL,
  terms_accepted boolean DEFAULT NULL,
  name varchar(255) DEFAULT NULL,
  email varchar(255) DEFAULT NULL,
  born timestamp(0) DEFAULT NULL,
  favourite_book_id varchar(36) DEFAULT NULL,
  favourite_author_id int DEFAULT NULL,
  PRIMARY KEY (id)
);



DROP TABLE IF EXISTS book2_to_book_tag2;
DROP SEQUENCE IF EXISTS book2_to_book_tag2_seq;

CREATE SEQUENCE book2_to_book_tag2_seq;

CREATE TABLE book2_to_book_tag2 (
  id int check (id > 0) NOT NULL DEFAULT NEXTVAL ('book2_to_book_tag2_seq'),
  book2_uuid_pk varchar(36) DEFAULT NULL,
  book_tag2_id int DEFAULT NULL,
  PRIMARY KEY (id)
);



DROP TABLE IF EXISTS book_tag2;
DROP SEQUENCE IF EXISTS book_tag2_seq;

CREATE SEQUENCE book_tag2_seq;

CREATE TABLE book_tag2 (
  id int check (id > 0) NOT NULL DEFAULT NEXTVAL ('book_tag2_seq'),
  name varchar(50) DEFAULT NULL,
  PRIMARY KEY (id)
);



DROP TABLE IF EXISTS book2;

CREATE TABLE book2 (
  uuid_pk varchar(36) NOT NULL,
  created_at timestamp(3) DEFAULT NOW(),
  title varchar(255) DEFAULT NULL,
  foo varchar(255) DEFAULT NULL,
  author_id int DEFAULT NULL,
  publisher_id int DEFAULT NULL,
  PRIMARY KEY (uuid_pk)
);



DROP TABLE IF EXISTS publisher2_to_test2;
DROP SEQUENCE IF EXISTS publisher2_to_test2_seq;

CREATE SEQUENCE publisher2_to_test2_seq;

CREATE TABLE publisher2_to_test2 (
  id int check (id > 0) NOT NULL DEFAULT NEXTVAL ('publisher2_to_test2_seq'),
  publisher2_id int DEFAULT NULL,
  test2_id int DEFAULT NULL,
  PRIMARY KEY (id)
);



DROP TABLE IF EXISTS publisher2;
DROP SEQUENCE IF EXISTS publisher2_seq;

CREATE SEQUENCE publisher2_seq;

CREATE TABLE publisher2 (
  id int check (id > 0) NOT NULL DEFAULT NEXTVAL ('publisher2_seq'),
  name varchar(255) DEFAULT NULL,
  type varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
);



DROP TABLE IF EXISTS test2;
DROP SEQUENCE IF EXISTS test2_seq;

CREATE SEQUENCE test2_seq;

CREATE TABLE test2 (
  id int check (id > 0) NOT NULL DEFAULT NEXTVAL ('test2_seq'),
  name varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
);
