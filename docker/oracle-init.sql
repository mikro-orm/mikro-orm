-- Optimize Oracle for test performance: skip redo log wait on commits
alter system set commit_wait = 'NOWAIT' scope=memory;
alter system set commit_logging = 'BATCH' scope=memory;

-- Skip recycle bin for faster DROP TABLE
alter system set recyclebin = OFF scope=spfile;

-- Disable account locking on failed logins (tests connect as non-existent users triggering ORA-01017)
alter profile default limit failed_login_attempts unlimited;
alter session set container = freepdb1;
alter profile default limit failed_login_attempts unlimited;

-- Performance tuning inside the PDB
alter system set commit_wait = 'NOWAIT' scope=memory;
alter system set commit_logging = 'BATCH' scope=memory;
alter system set recyclebin = OFF scope=spfile;

-- Pre-create tablespace and test users to avoid CREATE USER overhead during tests
create tablespace "mikro_orm" datafile 'mikro_orm.dbf' size 100M autoextend on;

create user "mikro_orm_test" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource to "mikro_orm_test";

create user "mikro_orm_test_2" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource to "mikro_orm_test_2";

create user "mikro_orm_test_sg" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource to "mikro_orm_test_sg";

create user "mikro_orm_test_sg2" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource to "mikro_orm_test_sg2";

create user "mikro_orm_test_sg3" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource to "mikro_orm_test_sg3";

create user "mikro_orm_test_multi_schemas" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource, dba to "mikro_orm_test_multi_schemas";

-- Pre-create namespaces for multi-schema tests
create user "n1" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource to "n1";
create user "n2" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource to "n2";
create user "n3" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource to "n3";
create user "n4" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource to "n4";
create user "n5" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource to "n5";

-- Pre-create namespaces for schema-generator multi-schema tests
create user "s1" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource to "s1";
create user "s2" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource to "s2";

create user "mikro_orm_test_schemas" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource, dba to "mikro_orm_test_schemas";

create user "mikro_orm_test_streaming" identified by "oracle123" default tablespace "mikro_orm" quota unlimited on "mikro_orm";
grant connect, resource to "mikro_orm_test_streaming";
