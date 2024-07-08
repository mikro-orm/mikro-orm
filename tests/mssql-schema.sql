exec sp_MSforeachtable 'alter table ? nocheck constraint all';

if object_id('[address2]', 'U') is not null DROP TABLE [address2];
if object_id('[author2_following]', 'U') is not null DROP TABLE [author2_following];
if object_id('[author_to_friend]', 'U') is not null DROP TABLE [author_to_friend];
if object_id('[book_to_tag_unordered]', 'U') is not null DROP TABLE [book_to_tag_unordered];
if object_id('[book2_tags]', 'U') is not null DROP TABLE [book2_tags];
if object_id('[publisher2_tests]', 'U') is not null DROP TABLE [publisher2_tests];
if object_id('[configuration2]', 'U') is not null DROP TABLE [configuration2];
if object_id('[test2]', 'U') is not null DROP TABLE [test2];
if object_id('[book2]', 'U') is not null DROP TABLE [book2];
if object_id('[author2]', 'U') is not null DROP TABLE [author2];
if object_id('[base_user2]', 'U') is not null DROP TABLE [base_user2];
if object_id('[book_tag2]', 'U') is not null DROP TABLE [book_tag2];
if object_id('[user2_cars]', 'U') is not null DROP TABLE [user2_cars];
if object_id('[user2_sandwiches]', 'U') is not null DROP TABLE [user2_sandwiches];
if object_id('[user2]', 'U') is not null DROP TABLE [user2];
if object_id('[car_owner2]', 'U') is not null DROP TABLE [car_owner2];
if object_id('[car2]', 'U') is not null DROP TABLE [car2];
if object_id('[dummy2]', 'U') is not null DROP TABLE [dummy2];
if object_id('[foo_param2]', 'U') is not null DROP TABLE [foo_param2];
if object_id('[foo_bar2]', 'U') is not null DROP TABLE [foo_bar2];
if object_id('[foo_baz2]', 'U') is not null DROP TABLE [foo_baz2];
if object_id('[label2]', 'U') is not null DROP TABLE [label2];
if object_id('[publisher2]', 'U') is not null DROP TABLE [publisher2];
if object_id('[sandwich]', 'U') is not null DROP TABLE [sandwich];

CREATE TABLE [sandwich] ([id] int identity(1,1) not null primary key, [name] nvarchar(255) not null, [price] int not null);

CREATE TABLE [publisher2] ([id] int identity(1,1) not null primary key, [name] nvarchar(255) not null CONSTRAINT [publisher2_name_default] DEFAULT 'asd', [type] nvarchar(100) not null CONSTRAINT [publisher2_type_default] DEFAULT 'local', [type2] nvarchar(100) not null CONSTRAINT [publisher2_type2_default] DEFAULT 'LOCAL', [enum1] tinyint null, [enum2] tinyint null, [enum3] tinyint null, [enum4] nvarchar(100) null);

CREATE TABLE [label2] ([uuid] uniqueidentifier not null, [name] nvarchar(255) not null, CONSTRAINT [label2_pkey] PRIMARY KEY ([uuid]));

CREATE TABLE [foo_baz2] ([id] int identity(1,1) not null primary key, [name] nvarchar(255) not null, [code] varchar(255) not null, [version] datetime not null default current_timestamp);

CREATE TABLE [foo_bar2] ([id] int identity(1,1) not null primary key, [name] nvarchar(255) not null, [baz_id] int null, [foo_bar_id] int null, [version] datetime2(3) not null default current_timestamp, [blob] varbinary(max) null, [array] text null, [object] text null);
CREATE UNIQUE INDEX [foo_bar2_baz_id_unique] ON [foo_bar2] ([baz_id]) WHERE [baz_id] IS NOT NULL;
CREATE UNIQUE INDEX [foo_bar2_foo_bar_id_unique] ON [foo_bar2] ([foo_bar_id]) WHERE [foo_bar_id] IS NOT NULL;

CREATE TABLE [foo_param2] ([bar_id] int not null, [baz_id] int not null, [value] nvarchar(255) not null, CONSTRAINT [foo_param2_pkey] PRIMARY KEY ([bar_id], [baz_id]));

CREATE TABLE [dummy2] ([id] int identity(1,1) not null primary key);

CREATE TABLE [car2] ([name] nvarchar(100) not null, [year] int not null, [price] int not null, CONSTRAINT [car2_pkey] PRIMARY KEY ([name], [year]));
CREATE INDEX [car2_name_index] ON [car2] ([name]);
CREATE INDEX [car2_year_index] ON [car2] ([year]);

CREATE TABLE [car_owner2] ([id] int identity(1,1) not null primary key, [name] nvarchar(255) not null, [car_name] nvarchar(100) not null, [car_year] int not null);

CREATE TABLE [user2] ([first_name] nvarchar(100) not null, [last_name] nvarchar(100) not null, [foo] int null, [favourite_car_name] nvarchar(100) null, [favourite_car_year] int null, CONSTRAINT [user2_pkey] PRIMARY KEY ([first_name], [last_name]));
CREATE UNIQUE INDEX [user2_favourite_car_name_unique] ON [user2] ([favourite_car_name]) WHERE [favourite_car_name] IS NOT NULL;
CREATE UNIQUE INDEX [user2_favourite_car_year_unique] ON [user2] ([favourite_car_year]) WHERE [favourite_car_year] IS NOT NULL;

CREATE TABLE [user2_sandwiches] ([user2_first_name] nvarchar(100) not null, [user2_last_name] nvarchar(100) not null, [sandwich_id] int not null, CONSTRAINT [user2_sandwiches_pkey] PRIMARY KEY ([user2_first_name], [user2_last_name], [sandwich_id]));

CREATE TABLE [user2_cars] ([user2_first_name] nvarchar(100) not null, [user2_last_name] nvarchar(100) not null, [car2_name] nvarchar(100) not null, [car2_year] int not null, CONSTRAINT [user2_cars_pkey] PRIMARY KEY ([user2_first_name], [user2_last_name], [car2_name], [car2_year]));

CREATE TABLE [book_tag2] ([id] bigint identity(1,1) not null primary key, [name] nvarchar(50) not null);

CREATE TABLE [base_user2] ([id] int identity(1,1) not null primary key, [first_name] nvarchar(100) not null, [last_name] nvarchar(100) not null, [type] nvarchar(100) check ([type] in ('employee', 'manager', 'owner')) not null, [owner_prop] nvarchar(255) null, [favourite_employee_id] int null, [favourite_manager_id] int null, [employee_prop] int null, [manager_prop] nvarchar(255) null);
CREATE INDEX [base_user2_type_index] ON [base_user2] ([type]);
CREATE UNIQUE INDEX [base_user2_favourite_manager_id_unique] ON [base_user2] ([favourite_manager_id]) WHERE [favourite_manager_id] IS NOT NULL;

CREATE TABLE [author2] ([id] int identity(1,1) not null primary key, [created_at] datetime not null default current_timestamp, [updated_at] datetime not null default current_timestamp, [name] nvarchar(255) not null, [email] nvarchar(255) not null, [age] int null default null, [terms_accepted] bit not null default 0, [optional] bit null, [identities] text null, [born] date null, [born_time] time null, [favourite_book_uuid_pk] uniqueidentifier null, [favourite_author_id] int null);
CREATE INDEX [custom_email_index_name] ON [author2] ([email]);
CREATE UNIQUE INDEX [custom_email_unique_name] ON [author2] ([email]) WHERE [email] IS NOT NULL;
CREATE INDEX [author2_terms_accepted_index] ON [author2] ([terms_accepted]);
CREATE INDEX [author2_born_index] ON [author2] ([born]);
CREATE INDEX [born_time_idx] ON [author2] ([born_time]);
CREATE INDEX [custom_idx_name_123] ON [author2] ([name]);
CREATE INDEX [author2_name_age_index] ON [author2] ([name], [age]);
CREATE UNIQUE INDEX [author2_name_email_unique] ON [author2] ([name], [email]) WHERE [name] IS NOT NULL AND [email] IS NOT NULL;

CREATE TABLE [book2] ([uuid_pk] uniqueidentifier not null, [created_at] datetime2(3) not null CONSTRAINT [book2_created_at_default] default current_timestamp, [isbn] nchar(13) null, [title] nvarchar(255) null CONSTRAINT [book2_title_default] default '', [perex] text null, [price] float(24) null, [double] float(53) null, [meta] nvarchar(max) null, [author_id] int not null, [publisher_id] int null, CONSTRAINT [book2_pkey] PRIMARY KEY ([uuid_pk]));
CREATE UNIQUE INDEX [book2_isbn_unique] ON [book2] ([isbn]) WHERE [isbn] IS NOT NULL;

CREATE TABLE [test2] ([id] int identity(1,1) not null primary key, [name] nvarchar(255) null, [book_uuid_pk] uniqueidentifier null, [version] int not null default 1);
CREATE UNIQUE INDEX [test2_book_uuid_pk_unique] ON [test2] ([book_uuid_pk]) WHERE [book_uuid_pk] IS NOT NULL;

CREATE TABLE [configuration2] ([property] nvarchar(255) not null, [test_id] int not null, [value] nvarchar(255) not null, CONSTRAINT [configuration2_pkey] PRIMARY KEY ([property], [test_id]));

CREATE TABLE [publisher2_tests] ([id] int identity(1,1) not null primary key, [publisher2_id] int not null, [test2_id] int not null);

CREATE TABLE [book2_tags] ([order] int identity(1,1) not null primary key, [book2_uuid_pk] uniqueidentifier not null, [book_tag2_id] bigint not null);

CREATE TABLE [book_to_tag_unordered] ([book2_uuid_pk] uniqueidentifier not null, [book_tag2_id] bigint not null, CONSTRAINT [book_to_tag_unordered_pkey] PRIMARY KEY ([book2_uuid_pk], [book_tag2_id]));

CREATE TABLE [author_to_friend] ([author2_1_id] int not null, [author2_2_id] int not null, CONSTRAINT [author_to_friend_pkey] PRIMARY KEY ([author2_1_id], [author2_2_id]));

CREATE TABLE [author2_following] ([author2_1_id] int not null, [author2_2_id] int not null, CONSTRAINT [author2_following_pkey] PRIMARY KEY ([author2_1_id], [author2_2_id]));

CREATE TABLE [address2] ([author_id] int not null, [value] nvarchar(255) not null, CONSTRAINT [address2_pkey] PRIMARY KEY ([author_id]));
CREATE UNIQUE INDEX [address2_author_id_unique] ON [address2] ([author_id]) WHERE [author_id] IS NOT NULL;

ALTER TABLE [foo_bar2] ADD CONSTRAINT [foo_bar2_baz_id_foreign] FOREIGN KEY ([baz_id]) REFERENCES [foo_baz2] ([id]) ON UPDATE cascade ON DELETE set null;
ALTER TABLE [foo_bar2] ADD CONSTRAINT [foo_bar2_foo_bar_id_foreign] FOREIGN KEY ([foo_bar_id]) REFERENCES [foo_bar2] ([id]) ON UPDATE no action ON DELETE no action;

ALTER TABLE [foo_param2] ADD CONSTRAINT [foo_param2_bar_id_foreign] FOREIGN KEY ([bar_id]) REFERENCES [foo_bar2] ([id]);
ALTER TABLE [foo_param2] ADD CONSTRAINT [foo_param2_baz_id_foreign] FOREIGN KEY ([baz_id]) REFERENCES [foo_baz2] ([id]);

ALTER TABLE [car_owner2] ADD CONSTRAINT [car_owner2_car_name_car_year_foreign] FOREIGN KEY ([car_name], [car_year]) REFERENCES [car2] ([name], [year]) ON UPDATE cascade;

ALTER TABLE [user2] ADD CONSTRAINT [user2_favourite_car_name_favourite_car_year_foreign] FOREIGN KEY ([favourite_car_name], [favourite_car_year]) REFERENCES [car2] ([name], [year]) ON UPDATE cascade ON DELETE set null;

ALTER TABLE [user2_sandwiches] ADD CONSTRAINT [user2_sandwiches_user2_first_name_user2_last_name_foreign] FOREIGN KEY ([user2_first_name], [user2_last_name]) REFERENCES [user2] ([first_name], [last_name]) ON UPDATE cascade ON DELETE cascade;
ALTER TABLE [user2_sandwiches] ADD CONSTRAINT [user2_sandwiches_sandwich_id_foreign] FOREIGN KEY ([sandwich_id]) REFERENCES [sandwich] ([id]) ON UPDATE cascade ON DELETE cascade;

ALTER TABLE [user2_cars] ADD CONSTRAINT [user2_cars_user2_first_name_user2_last_name_foreign] FOREIGN KEY ([user2_first_name], [user2_last_name]) REFERENCES [user2] ([first_name], [last_name]);
ALTER TABLE [user2_cars] ADD CONSTRAINT [user2_cars_car2_name_car2_year_foreign] FOREIGN KEY ([car2_name], [car2_year]) REFERENCES [car2] ([name], [year]);

ALTER TABLE [base_user2] ADD CONSTRAINT [base_user2_favourite_employee_id_foreign] FOREIGN KEY ([favourite_employee_id]) REFERENCES [base_user2] ([id]);
ALTER TABLE [base_user2] ADD CONSTRAINT [base_user2_favourite_manager_id_foreign] FOREIGN KEY ([favourite_manager_id]) REFERENCES [base_user2] ([id]);

ALTER TABLE [author2] ADD CONSTRAINT [author2_favourite_book_uuid_pk_foreign] FOREIGN KEY ([favourite_book_uuid_pk]) REFERENCES [book2] ([uuid_pk]);
ALTER TABLE [author2] ADD CONSTRAINT [author2_favourite_author_id_foreign] FOREIGN KEY ([favourite_author_id]) REFERENCES [author2] ([id]);

ALTER TABLE [book2] ADD CONSTRAINT [book2_author_id_foreign] FOREIGN KEY ([author_id]) REFERENCES [author2] ([id]);
ALTER TABLE [book2] ADD CONSTRAINT [book2_publisher_id_foreign] FOREIGN KEY ([publisher_id]) REFERENCES [publisher2] ([id]) ON UPDATE cascade ON DELETE cascade;

ALTER TABLE [test2] ADD CONSTRAINT [test2_book_uuid_pk_foreign] FOREIGN KEY ([book_uuid_pk]) REFERENCES [book2] ([uuid_pk]) ON DELETE set null;

ALTER TABLE [configuration2] ADD CONSTRAINT [configuration2_test_id_foreign] FOREIGN KEY ([test_id]) REFERENCES [test2] ([id]) ON UPDATE cascade;

ALTER TABLE [publisher2_tests] ADD CONSTRAINT [publisher2_tests_publisher2_id_foreign] FOREIGN KEY ([publisher2_id]) REFERENCES [publisher2] ([id]);
ALTER TABLE [publisher2_tests] ADD CONSTRAINT [publisher2_tests_test2_id_foreign] FOREIGN KEY ([test2_id]) REFERENCES [test2] ([id]);

ALTER TABLE [book2_tags] ADD CONSTRAINT [book2_tags_book2_uuid_pk_foreign] FOREIGN KEY ([book2_uuid_pk]) REFERENCES [book2] ([uuid_pk]) ON UPDATE cascade ON DELETE cascade;
ALTER TABLE [book2_tags] ADD CONSTRAINT [book2_tags_book_tag2_id_foreign] FOREIGN KEY ([book_tag2_id]) REFERENCES [book_tag2] ([id]) ON UPDATE cascade ON DELETE cascade;

ALTER TABLE [book_to_tag_unordered] ADD CONSTRAINT [book_to_tag_unordered_book2_uuid_pk_foreign] FOREIGN KEY ([book2_uuid_pk]) REFERENCES [book2] ([uuid_pk]) ON UPDATE cascade ON DELETE cascade;
ALTER TABLE [book_to_tag_unordered] ADD CONSTRAINT [book_to_tag_unordered_book_tag2_id_foreign] FOREIGN KEY ([book_tag2_id]) REFERENCES [book_tag2] ([id]) ON UPDATE cascade ON DELETE cascade;

ALTER TABLE [author_to_friend] ADD CONSTRAINT [author_to_friend_author2_1_id_foreign] FOREIGN KEY ([author2_1_id]) REFERENCES [author2] ([id]);
ALTER TABLE [author_to_friend] ADD CONSTRAINT [author_to_friend_author2_2_id_foreign] FOREIGN KEY ([author2_2_id]) REFERENCES [author2] ([id]);

ALTER TABLE [author2_following] ADD CONSTRAINT [author2_following_author2_1_id_foreign] FOREIGN KEY ([author2_1_id]) REFERENCES [author2] ([id]);
ALTER TABLE [author2_following] ADD CONSTRAINT [author2_following_author2_2_id_foreign] FOREIGN KEY ([author2_2_id]) REFERENCES [author2] ([id]);

exec sp_MSforeachtable 'alter table ? check constraint all';
