SET NAMES utf8;
SET FOREIGN_KEY_CHECKS=0;


DROP TABLE IF EXISTS `author2`;

CREATE TABLE `author2` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) UNIQUE DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `terms_accepted` tinyint(1) DEFAULT NULL,
  `identities` json DEFAULT NULL,
  `born` datetime DEFAULT NULL,
  `favourite_book_uuid_pk` varchar(36) DEFAULT NULL,
  `favourite_author_id` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `favourite_book_uuid_pk` (`favourite_book_uuid_pk`),
  KEY `favourite_author_id` (`favourite_author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `book2`;

CREATE TABLE `book2` (
  `uuid_pk` varchar(36) NOT NULL,
  `created_at` datetime(3) DEFAULT NOW(3),
  `title` varchar(255) DEFAULT NULL,
  `perex` text DEFAULT NULL,
  `price` float DEFAULT NULL,
  `double` double DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `author_id` int(11) unsigned DEFAULT NULL,
  `publisher_id` int(11) unsigned DEFAULT NULL,
  `foo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`uuid_pk`),
  KEY `author_id` (`author_id`),
  KEY `publisher_id` (`publisher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `book_tag2`;

CREATE TABLE `book_tag2` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `publisher2`;

CREATE TABLE `publisher2` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `type` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `test2`;

CREATE TABLE `test2` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `foo_bar2`;

CREATE TABLE `foo_bar2` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `book2_to_book_tag2`;

CREATE TABLE `book2_to_book_tag2` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `book2_uuid_pk` varchar(36) DEFAULT NULL,
  `book_tag2_id` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `book2_uuid_pk` (`book2_uuid_pk`),
  KEY `book_tag2_id` (`book_tag2_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `publisher2_to_test2`;

CREATE TABLE `publisher2_to_test2` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `publisher2_id` int(11) unsigned DEFAULT NULL,
  `test2_id` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `publisher2_id` (`publisher2_id`),
  KEY `test2_id` (`test2_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


ALTER TABLE `author2`
  ADD CONSTRAINT `author2_ibfk_1` FOREIGN KEY (`favourite_book_uuid_pk`) REFERENCES `book2` (`uuid_pk`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `author2_ibfk_2` FOREIGN KEY (`favourite_author_id`) REFERENCES `author2` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE `book2`
  ADD CONSTRAINT `book2_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `author2` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `book2_ibfk_2` FOREIGN KEY (`publisher_id`) REFERENCES `publisher2` (`id`) ON DELETE SET NULL;


ALTER TABLE `book2_to_book_tag2`
  ADD CONSTRAINT `book2_to_book_tag2_ibfk_1` FOREIGN KEY (`book2_uuid_pk`) REFERENCES `book2` (`uuid_pk`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `book2_to_book_tag2_ibfk_2` FOREIGN KEY (`book_tag2_id`) REFERENCES `book_tag2` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE `publisher2_to_test2`
  ADD CONSTRAINT `publisher2_to_test2_ibfk_1` FOREIGN KEY (`publisher2_id`) REFERENCES `publisher2` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `publisher2_to_test2_ibfk_2` FOREIGN KEY (`test2_id`) REFERENCES `test2` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;


SET FOREIGN_KEY_CHECKS=1;
