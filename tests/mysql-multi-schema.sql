set names utf8mb4;
set foreign_key_checks = 0;

drop database if exists mikro_orm_test_multi_2;
drop database if exists mikro_orm_test_multi_1;

create database if not exists mikro_orm_test_multi_1;
create database if not exists mikro_orm_test_multi_2;

create table `mikro_orm_test_multi_2`.`foo_baz_schema2` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `version` datetime(3) not null default current_timestamp(3)) default character set utf8mb4 engine = InnoDB;

create table `mikro_orm_test_multi_1`.`foo_bar_schema2` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `baz_id` int(11) unsigned null, `foo_bar_id` int(11) unsigned null, `version` datetime not null default current_timestamp, `blob` blob null, `array` text null, `object` json null) default character set utf8mb4 engine = InnoDB;

create table `mikro_orm_test_multi_2`.`foo_bar_schema2` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `baz_id` int(11) unsigned null, `foo_bar_id` int(11) unsigned null, `version` datetime not null default current_timestamp, `blob` blob null, `array` text null, `object` json null) default character set utf8mb4 engine = InnoDB;

alter table `mikro_orm_test_multi_1`.`foo_bar_schema2` add index `foo_bar_schema2_baz_id_index`(`baz_id`);
alter table `mikro_orm_test_multi_1`.`foo_bar_schema2` add unique `foo_bar_schema2_baz_id_unique`(`baz_id`);
alter table `mikro_orm_test_multi_1`.`foo_bar_schema2` add index `foo_bar_schema2_foo_bar_id_index`(`foo_bar_id`);
alter table `mikro_orm_test_multi_1`.`foo_bar_schema2` add unique `foo_bar_schema2_foo_bar_id_unique`(`foo_bar_id`);

alter table `mikro_orm_test_multi_1`.`foo_bar_schema2` add constraint `foo_bar_schema2_baz_id_foreign` foreign key (`baz_id`) references `mikro_orm_test_multi_2`.`foo_baz_schema2` (`id`) on update cascade on delete set null;
alter table `mikro_orm_test_multi_1`.`foo_bar_schema2` add constraint `foo_bar_schema2_foo_bar_id_foreign` foreign key (`foo_bar_id`) references `mikro_orm_test_multi_1`.`foo_bar_schema2` (`id`) on update cascade on delete set null;

set foreign_key_checks = 1;