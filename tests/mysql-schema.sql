set names utf8mb4;
set foreign_key_checks = 0;

drop table if exists `address2`;
drop table if exists `author2_following`;
drop table if exists `author_to_friend`;
drop table if exists `book_to_tag_unordered`;
drop table if exists `book2_tags`;
drop table if exists `publisher2_tests`;
drop table if exists `test2_bars`;
drop table if exists `configuration2`;
drop table if exists `test2`;
drop table if exists `book2`;
drop table if exists `author2`;
drop table if exists `base_user2`;
drop table if exists `book_tag2`;
drop table if exists `user2_cars`;
drop table if exists `user2_sandwiches`;
drop table if exists `user2`;
drop table if exists `car_owner2`;
drop table if exists `car2`;
drop table if exists `dummy2`;
drop table if exists `foo_param2`;
drop table if exists `foo_bar2`;
drop table if exists `foo_baz2`;
drop table if exists `publisher2`;
drop table if exists `sandwich`;
drop table if exists `new_table`;

drop table if exists `author2_to_author2`;
drop table if exists `book2_to_book_tag2`;
drop table if exists `publisher2_to_test2`;
drop table if exists `user2_to_car2`;

set names utf8mb4;
set foreign_key_checks = 0;

create table `sandwich` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `price` int(11) not null) default character set utf8mb4 engine = InnoDB;

create table `publisher2` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `type` enum('local', 'global') not null, `type2` enum('LOCAL', 'GLOBAL') not null, `enum1` tinyint null, `enum2` tinyint null, `enum3` tinyint null, `enum4` enum('a', 'b', 'c') null) default character set utf8mb4 engine = InnoDB;

create table `foo_baz2` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `version` datetime(3) not null default current_timestamp(3)) default character set utf8mb4 engine = InnoDB;

create table `foo_bar2` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `baz_id` int(11) unsigned null, `foo_bar_id` int(11) unsigned null, `version` datetime not null default current_timestamp, `blob` blob null, `array` text null, `object` json null) default character set utf8mb4 engine = InnoDB;
alter table `foo_bar2` add index `foo_bar2_baz_id_index`(`baz_id`);
alter table `foo_bar2` add unique `foo_bar2_baz_id_unique`(`baz_id`);
alter table `foo_bar2` add index `foo_bar2_foo_bar_id_index`(`foo_bar_id`);
alter table `foo_bar2` add unique `foo_bar2_foo_bar_id_unique`(`foo_bar_id`);

create table `foo_param2` (`bar_id` int(11) unsigned not null, `baz_id` int(11) unsigned not null, `value` varchar(255) not null) default character set utf8mb4 engine = InnoDB;
alter table `foo_param2` add index `foo_param2_bar_id_index`(`bar_id`);
alter table `foo_param2` add index `foo_param2_baz_id_index`(`baz_id`);
alter table `foo_param2` add primary key `foo_param2_pkey`(`bar_id`, `baz_id`);

create table `dummy2` (`id` int unsigned not null auto_increment primary key) default character set utf8mb4 engine = InnoDB;

create table `car2` (`name` varchar(100) not null, `year` int(11) unsigned not null, `price` int(11) not null) default character set utf8mb4 engine = InnoDB;
alter table `car2` add index `car2_name_index`(`name`);
alter table `car2` add index `car2_year_index`(`year`);
alter table `car2` add primary key `car2_pkey`(`name`, `year`);

create table `car_owner2` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `car_name` varchar(100) not null, `car_year` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;
alter table `car_owner2` add index `car_owner2_car_name_car_year_index`(`car_name`, `car_year`);

create table `user2` (`first_name` varchar(100) not null, `last_name` varchar(100) not null, `foo` int(11) null, `favourite_car_name` varchar(100) null, `favourite_car_year` int(11) unsigned null) default character set utf8mb4 engine = InnoDB;
alter table `user2` add unique `user2_favourite_car_name_favourite_car_year_unique`(`favourite_car_name`, `favourite_car_year`);
alter table `user2` add primary key `user2_pkey`(`first_name`, `last_name`);
alter table `user2` add index `user2_favourite_car_name_favourite_car_year_index`(`favourite_car_name`, `favourite_car_year`);

create table `user2_sandwiches` (`user2_first_name` varchar(100) not null, `user2_last_name` varchar(100) not null, `sandwich_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;
alter table `user2_sandwiches` add index `user2_sandwiches_sandwich_id_index`(`sandwich_id`);
alter table `user2_sandwiches` add primary key `user2_sandwiches_pkey`(`user2_first_name`, `user2_last_name`, `sandwich_id`);
alter table `user2_sandwiches` add index `user2_sandwiches_user2_first_name_user2_last_name_index`(`user2_first_name`, `user2_last_name`);

create table `user2_cars` (`user2_first_name` varchar(100) not null, `user2_last_name` varchar(100) not null, `car2_name` varchar(100) not null, `car2_year` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;
alter table `user2_cars` add primary key `user2_cars_pkey`(`user2_first_name`, `user2_last_name`, `car2_name`, `car2_year`);
alter table `user2_cars` add index `user2_cars_user2_first_name_user2_last_name_index`(`user2_first_name`, `user2_last_name`);
alter table `user2_cars` add index `user2_cars_car2_name_car2_year_index`(`car2_name`, `car2_year`);

create table `book_tag2` (`id` bigint unsigned not null auto_increment primary key, `name` varchar(50) not null) default character set utf8mb4 engine = InnoDB;

create table `base_user2` (`id` int unsigned not null auto_increment primary key, `first_name` varchar(100) not null, `last_name` varchar(100) not null, `type` enum('employee', 'manager', 'owner') not null, `owner_prop` varchar(255) null, `favourite_employee_id` int(11) unsigned null, `favourite_manager_id` int(11) unsigned null, `employee_prop` int(11) null, `manager_prop` varchar(255) null) default character set utf8mb4 engine = InnoDB;
alter table `base_user2` add index `base_user2_type_index`(`type`);
alter table `base_user2` add index `base_user2_favourite_employee_id_index`(`favourite_employee_id`);
alter table `base_user2` add index `base_user2_favourite_manager_id_index`(`favourite_manager_id`);
alter table `base_user2` add unique `base_user2_favourite_manager_id_unique`(`favourite_manager_id`);

create table `author2` (`id` int unsigned not null auto_increment primary key, `created_at` datetime(3) not null default current_timestamp(3), `updated_at` datetime(3) not null default current_timestamp(3), `name` varchar(255) not null, `email` varchar(255) not null, `age` int(11) null default null, `terms_accepted` tinyint(1) not null default false, `optional` tinyint(1) null, `identities` text null, `born` date null, `born_time` time null, `favourite_book_uuid_pk` varchar(36) null, `favourite_author_id` int(11) unsigned null) default character set utf8mb4 engine = InnoDB;
alter table `author2` add index `custom_email_index_name`(`email`);
alter table `author2` add unique `custom_email_unique_name`(`email`);
alter table `author2` add index `author2_terms_accepted_index`(`terms_accepted`);
alter table `author2` add index `author2_born_index`(`born`);
alter table `author2` add index `born_time_idx`(`born_time`);
alter table `author2` add index `author2_favourite_book_uuid_pk_index`(`favourite_book_uuid_pk`);
alter table `author2` add index `author2_favourite_author_id_index`(`favourite_author_id`);
alter table `author2` add index `custom_idx_name_123`(`name`);
alter table `author2` add index `author2_name_age_index`(`name`, `age`);
alter table `author2` add unique `author2_name_email_unique`(`name`, `email`);

create table `book2` (`uuid_pk` varchar(36) not null, `created_at` datetime(3) not null default current_timestamp(3), `title` varchar(255) null default '', `perex` text null, `price` float null, `double` double null, `meta` json null, `author_id` int(11) unsigned not null, `publisher_id` int(11) unsigned null, `foo` varchar(255) null default 'lol') default character set utf8mb4 engine = InnoDB;
alter table `book2` add primary key `book2_pkey`(`uuid_pk`);
alter table `book2` add index `book2_author_id_index`(`author_id`);
alter table `book2` add index `book2_publisher_id_index`(`publisher_id`);

create table `test2` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) null, `book_uuid_pk` varchar(36) null, `version` int(11) not null default 1, `foo___bar` int(11) unsigned null, `foo___baz` int(11) unsigned null) default character set utf8mb4 engine = InnoDB;
alter table `test2` add index `test2_book_uuid_pk_index`(`book_uuid_pk`);
alter table `test2` add unique `test2_book_uuid_pk_unique`(`book_uuid_pk`);
alter table `test2` add index `test2_foo___bar_index`(`foo___bar`);
alter table `test2` add unique `test2_foo___bar_unique`(`foo___bar`);

create table `configuration2` (`property` varchar(255) not null, `test_id` int(11) unsigned not null, `value` varchar(255) not null) default character set utf8mb4 engine = InnoDB;
alter table `configuration2` add index `configuration2_test_id_index`(`test_id`);
alter table `configuration2` add primary key `configuration2_pkey`(`property`, `test_id`);

create table `publisher2_tests` (`id` int unsigned not null auto_increment primary key, `publisher2_id` int(11) unsigned not null, `test2_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;
alter table `publisher2_tests` add index `publisher2_tests_publisher2_id_index`(`publisher2_id`);
alter table `publisher2_tests` add index `publisher2_tests_test2_id_index`(`test2_id`);

create table `test2_bars` (`test2_id` int(11) unsigned not null, `foo_bar2_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;
alter table `test2_bars` add index `test2_bars_test2_id_index`(`test2_id`);
alter table `test2_bars` add index `test2_bars_foo_bar2_id_index`(`foo_bar2_id`);
alter table `test2_bars` add primary key `test2_bars_pkey`(`test2_id`, `foo_bar2_id`);

create table `book2_tags` (`order` int unsigned not null auto_increment primary key, `book2_uuid_pk` varchar(36) not null, `book_tag2_id` bigint unsigned not null) default character set utf8mb4 engine = InnoDB;
alter table `book2_tags` add index `book2_tags_book2_uuid_pk_index`(`book2_uuid_pk`);
alter table `book2_tags` add index `book2_tags_book_tag2_id_index`(`book_tag2_id`);

create table `book_to_tag_unordered` (`book2_uuid_pk` varchar(36) not null, `book_tag2_id` bigint unsigned not null) default character set utf8mb4 engine = InnoDB;
alter table `book_to_tag_unordered` add index `book_to_tag_unordered_book2_uuid_pk_index`(`book2_uuid_pk`);
alter table `book_to_tag_unordered` add index `book_to_tag_unordered_book_tag2_id_index`(`book_tag2_id`);
alter table `book_to_tag_unordered` add primary key `book_to_tag_unordered_pkey`(`book2_uuid_pk`, `book_tag2_id`);

create table `author_to_friend` (`author2_1_id` int(11) unsigned not null, `author2_2_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;
alter table `author_to_friend` add index `author_to_friend_author2_1_id_index`(`author2_1_id`);
alter table `author_to_friend` add index `author_to_friend_author2_2_id_index`(`author2_2_id`);
alter table `author_to_friend` add primary key `author_to_friend_pkey`(`author2_1_id`, `author2_2_id`);

create table `author2_following` (`author2_1_id` int(11) unsigned not null, `author2_2_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;
alter table `author2_following` add index `author2_following_author2_1_id_index`(`author2_1_id`);
alter table `author2_following` add index `author2_following_author2_2_id_index`(`author2_2_id`);
alter table `author2_following` add primary key `author2_following_pkey`(`author2_1_id`, `author2_2_id`);

create table `address2` (`author_id` int(11) unsigned not null, `value` varchar(255) not null comment 'This is address property') default character set utf8mb4 engine = InnoDB comment = 'This is address table';
alter table `address2` add primary key `address2_pkey`(`author_id`);
alter table `address2` add index `address2_author_id_index`(`author_id`);
alter table `address2` add unique `address2_author_id_unique`(`author_id`);

alter table `foo_bar2` add constraint `foo_bar2_baz_id_foreign` foreign key (`baz_id`) references `foo_baz2` (`id`) on update cascade on delete set null;
alter table `foo_bar2` add constraint `foo_bar2_foo_bar_id_foreign` foreign key (`foo_bar_id`) references `foo_bar2` (`id`) on update cascade on delete set null;

alter table `foo_param2` add constraint `foo_param2_bar_id_foreign` foreign key (`bar_id`) references `foo_bar2` (`id`) on update cascade;
alter table `foo_param2` add constraint `foo_param2_baz_id_foreign` foreign key (`baz_id`) references `foo_baz2` (`id`) on update cascade;

alter table `car_owner2` add constraint `car_owner2_car_name_car_year_foreign` foreign key (`car_name`, `car_year`) references `car2` (`name`, `year`) on update cascade;

alter table `user2` add constraint `user2_favourite_car_name_favourite_car_year_foreign` foreign key (`favourite_car_name`, `favourite_car_year`) references `car2` (`name`, `year`) on update cascade on delete set null;

alter table `user2_sandwiches` add constraint `user2_sandwiches_user2_first_name_user2_last_name_foreign` foreign key (`user2_first_name`, `user2_last_name`) references `user2` (`first_name`, `last_name`) on update cascade on delete cascade;
alter table `user2_sandwiches` add constraint `user2_sandwiches_sandwich_id_foreign` foreign key (`sandwich_id`) references `sandwich` (`id`) on update cascade on delete cascade;

alter table `user2_cars` add constraint `user2_cars_user2_first_name_user2_last_name_foreign` foreign key (`user2_first_name`, `user2_last_name`) references `user2` (`first_name`, `last_name`) on update cascade on delete cascade;
alter table `user2_cars` add constraint `user2_cars_car2_name_car2_year_foreign` foreign key (`car2_name`, `car2_year`) references `car2` (`name`, `year`) on update cascade on delete cascade;

alter table `base_user2` add constraint `base_user2_favourite_employee_id_foreign` foreign key (`favourite_employee_id`) references `base_user2` (`id`) on update cascade on delete set null;
alter table `base_user2` add constraint `base_user2_favourite_manager_id_foreign` foreign key (`favourite_manager_id`) references `base_user2` (`id`) on update cascade on delete set null;

alter table `author2` add constraint `author2_favourite_book_uuid_pk_foreign` foreign key (`favourite_book_uuid_pk`) references `book2` (`uuid_pk`) on update no action on delete cascade;
alter table `author2` add constraint `author2_favourite_author_id_foreign` foreign key (`favourite_author_id`) references `author2` (`id`) on update cascade on delete set null;

alter table `book2` add constraint `book2_author_id_foreign` foreign key (`author_id`) references `author2` (`id`);
alter table `book2` add constraint `book2_publisher_id_foreign` foreign key (`publisher_id`) references `publisher2` (`id`) on update cascade on delete cascade;

alter table `test2` add constraint `test2_book_uuid_pk_foreign` foreign key (`book_uuid_pk`) references `book2` (`uuid_pk`) on delete set null;
alter table `test2` add constraint `test2_foo___bar_foreign` foreign key (`foo___bar`) references `foo_bar2` (`id`) on update cascade on delete set null;

alter table `configuration2` add constraint `configuration2_test_id_foreign` foreign key (`test_id`) references `test2` (`id`) on update cascade;

alter table `publisher2_tests` add constraint `publisher2_tests_publisher2_id_foreign` foreign key (`publisher2_id`) references `publisher2` (`id`) on update cascade on delete cascade;
alter table `publisher2_tests` add constraint `publisher2_tests_test2_id_foreign` foreign key (`test2_id`) references `test2` (`id`) on update cascade on delete cascade;

alter table `test2_bars` add constraint `test2_bars_test2_id_foreign` foreign key (`test2_id`) references `test2` (`id`) on update cascade on delete cascade;
alter table `test2_bars` add constraint `test2_bars_foo_bar2_id_foreign` foreign key (`foo_bar2_id`) references `foo_bar2` (`id`) on update cascade on delete cascade;

alter table `book2_tags` add constraint `book2_tags_book2_uuid_pk_foreign` foreign key (`book2_uuid_pk`) references `book2` (`uuid_pk`) on update cascade on delete cascade;
alter table `book2_tags` add constraint `book2_tags_book_tag2_id_foreign` foreign key (`book_tag2_id`) references `book_tag2` (`id`) on update cascade on delete cascade;

alter table `book_to_tag_unordered` add constraint `book_to_tag_unordered_book2_uuid_pk_foreign` foreign key (`book2_uuid_pk`) references `book2` (`uuid_pk`) on update cascade on delete cascade;
alter table `book_to_tag_unordered` add constraint `book_to_tag_unordered_book_tag2_id_foreign` foreign key (`book_tag2_id`) references `book_tag2` (`id`) on update cascade on delete cascade;

alter table `author_to_friend` add constraint `author_to_friend_author2_1_id_foreign` foreign key (`author2_1_id`) references `author2` (`id`) on update cascade on delete cascade;
alter table `author_to_friend` add constraint `author_to_friend_author2_2_id_foreign` foreign key (`author2_2_id`) references `author2` (`id`) on update cascade on delete cascade;

alter table `author2_following` add constraint `author2_following_author2_1_id_foreign` foreign key (`author2_1_id`) references `author2` (`id`) on update cascade on delete cascade;
alter table `author2_following` add constraint `author2_following_author2_2_id_foreign` foreign key (`author2_2_id`) references `author2` (`id`) on update cascade on delete cascade;

alter table `address2` add constraint `address2_author_id_foreign` foreign key (`author_id`) references `author2` (`id`) on update cascade on delete cascade;

set foreign_key_checks = 1;
