pragma foreign_keys = off;

drop table if exists `book5`;

create virtual table book5 using fts5(id, title);

pragma foreign_keys = on;
