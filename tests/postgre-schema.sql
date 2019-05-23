SET NAMES 'utf8';
SET session_replication_role = 'replica';


DROP TABLE IF EXISTS "author2" CASCADE;
DROP SEQUENCE IF EXISTS "author2_seq";

CREATE SEQUENCE "author2_seq";
CREATE TABLE "author2" (
  "id" int check ("id" > 0) NOT NULL DEFAULT NEXTVAL('author2_seq'),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  "name" varchar(255) NOT NULL,
  "email" varchar(255) UNIQUE NOT NULL,
  "age" int DEFAULT NULL,
  "terms_accepted" boolean NOT NULL DEFAULT false,
  "identities" json DEFAULT NULL,
  "born" timestamp DEFAULT NULL,
  "favourite_book_uuid_pk" varchar(36) DEFAULT NULL,
  "favourite_author_id" int check ("favourite_author_id" > 0) DEFAULT NULL,
  PRIMARY KEY ("id")
);


DROP TABLE IF EXISTS "book2" CASCADE;
DROP SEQUENCE IF EXISTS "book2_seq";

CREATE TABLE "book2" (
  "uuid_pk" varchar(36) NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  "title" varchar(255) DEFAULT NULL,
  "perex" text DEFAULT NULL,
  "price" float DEFAULT NULL,
  "double" double precision DEFAULT NULL,
  "meta" json DEFAULT NULL,
  "foo" varchar(255) DEFAULT NULL,
  "author_id" int check ("author_id" > 0) DEFAULT NULL,
  "publisher_id" int check ("publisher_id" > 0) DEFAULT NULL,
  PRIMARY KEY ("uuid_pk")
);


DROP TABLE IF EXISTS "book_tag2" CASCADE;
DROP SEQUENCE IF EXISTS "book_tag2_seq";

CREATE SEQUENCE "book_tag2_seq";
CREATE TABLE "book_tag2" (
  "id" int check ("id" > 0) NOT NULL DEFAULT NEXTVAL('book_tag2_seq'),
  "name" varchar(50) NOT NULL,
  PRIMARY KEY ("id")
);


DROP TABLE IF EXISTS "publisher2" CASCADE;
DROP SEQUENCE IF EXISTS "publisher2_seq";

CREATE SEQUENCE "publisher2_seq";
CREATE TABLE "publisher2" (
  "id" int check ("id" > 0) NOT NULL DEFAULT NEXTVAL('publisher2_seq'),
  "name" varchar(255) NOT NULL,
  "type" varchar(10) NOT NULL,
  PRIMARY KEY ("id")
);


DROP TABLE IF EXISTS "test2" CASCADE;
DROP SEQUENCE IF EXISTS "test2_seq";

CREATE SEQUENCE "test2_seq";
CREATE TABLE "test2" (
  "id" int check ("id" > 0) NOT NULL DEFAULT NEXTVAL('test2_seq'),
  "name" varchar(255) DEFAULT NULL,
  "book_uuid_pk" varchar(36) UNIQUE DEFAULT NULL,
  "version" int NOT NULL DEFAULT 1,
  PRIMARY KEY ("id")
);


DROP TABLE IF EXISTS "foo_bar2" CASCADE;
DROP SEQUENCE IF EXISTS "foo_bar2_seq";

CREATE SEQUENCE "foo_bar2_seq";
CREATE TABLE "foo_bar2" (
  "id" int check ("id" > 0) NOT NULL DEFAULT NEXTVAL('foo_bar2_seq'),
  "name" varchar(255) NOT NULL,
  "baz_id" int check ("baz_id" > 0) UNIQUE DEFAULT NULL,
  "foo_bar_id" int check ("foo_bar_id" > 0) UNIQUE DEFAULT NULL,
  "version" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY ("id")
);


DROP TABLE IF EXISTS "foo_baz2" CASCADE;
DROP SEQUENCE IF EXISTS "foo_baz2_seq";

CREATE SEQUENCE "foo_baz2_seq";
CREATE TABLE "foo_baz2" (
  "id" int check ("id" > 0) NOT NULL DEFAULT NEXTVAL('foo_baz2_seq'),
  "name" varchar(255) NOT NULL,
  PRIMARY KEY ("id")
);


DROP TABLE IF EXISTS "book2_to_book_tag2" CASCADE;
DROP SEQUENCE IF EXISTS "book2_to_book_tag2_seq";

CREATE SEQUENCE "book2_to_book_tag2_seq";
CREATE TABLE "book2_to_book_tag2" (
  "id" int check ("id" > 0) NOT NULL DEFAULT NEXTVAL('book2_to_book_tag2_seq'),
  "book2_uuid_pk" varchar(36) NOT NULL,
  "book_tag2_id" int check ("book_tag2_id" > 0) NOT NULL,
  PRIMARY KEY ("id")
);


DROP TABLE IF EXISTS "publisher2_to_test2" CASCADE;
DROP SEQUENCE IF EXISTS "publisher2_to_test2_seq";

CREATE SEQUENCE "publisher2_to_test2_seq";
CREATE TABLE "publisher2_to_test2" (
  "id" int check ("id" > 0) NOT NULL DEFAULT NEXTVAL('publisher2_to_test2_seq'),
  "publisher2_id" int check ("publisher2_id" > 0) NOT NULL,
  "test2_id" int check ("test2_id" > 0) NOT NULL,
  PRIMARY KEY ("id")
);


ALTER TABLE "author2"
  ADD CONSTRAINT "author2_ibfk_1" FOREIGN KEY ("favourite_book_uuid_pk") REFERENCES "book2" ("uuid_pk") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "author2_ibfk_2" FOREIGN KEY ("favourite_author_id") REFERENCES "author2" ("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE "book2"
  ADD CONSTRAINT "book2_ibfk_1" FOREIGN KEY ("author_id") REFERENCES "author2" ("id") ON DELETE SET NULL,
  ADD CONSTRAINT "book2_ibfk_2" FOREIGN KEY ("publisher_id") REFERENCES "publisher2" ("id") ON DELETE SET NULL;


ALTER TABLE "test2"
  ADD CONSTRAINT "test2_ibfk_1" FOREIGN KEY ("book_uuid_pk") REFERENCES "book2" ("uuid_pk") ON DELETE SET NULL;


ALTER TABLE "foo_bar2"
  ADD CONSTRAINT "foo_bar2_ibfk_1" FOREIGN KEY ("baz_id") REFERENCES "foo_baz2" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "foo_bar2_ibfk_2" FOREIGN KEY ("foo_bar_id") REFERENCES "foo_bar2" ("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE "book2_to_book_tag2"
  ADD CONSTRAINT "book2_to_book_tag2_ibfk_1" FOREIGN KEY ("book2_uuid_pk") REFERENCES "book2" ("uuid_pk") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "book2_to_book_tag2_ibfk_2" FOREIGN KEY ("book_tag2_id") REFERENCES "book_tag2" ("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "publisher2_to_test2"
  ADD CONSTRAINT "publisher2_to_test2_ibfk_1" FOREIGN KEY ("publisher2_id") REFERENCES "publisher2" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "publisher2_to_test2_ibfk_2" FOREIGN KEY ("test2_id") REFERENCES "test2" ("id") ON DELETE CASCADE ON UPDATE CASCADE;


SET session_replication_role = 'origin';
