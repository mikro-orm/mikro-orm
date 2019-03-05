---
---

# Smart nested populate

`MikroORM` is capable of loading large nested structures while maintaining good 
performance, querying each database table only once. Imagine you have this nested 
structure:

- `Book` has one `Publisher` (M:1), one `Author` (M:1) and many `BookTag`s (M:N)
- `Publisher` has many `Test`s (M:N)

When you use nested populate while querying all `BookTag`s, this is what happens in
the background:

```typescript
const tags = await orm.em.findAll(BookTag, ['books.publisher.tests', 'books.author']);
console.log(tags[0].books[0].publisher.tests[0].name); // prints name of nested test
console.log(tags[0].books[0].author.name); // prints name of nested author
```

1. Load all `BookTag`s
2. Load all `Book`s associated with previously loaded `BookTag`s
3. Load all `Publisher`s associated with previously loaded `Book`s
4. Load all `Test`s associated with previously loaded `Publisher`s
5. Load all `Author`s associated with previously loaded `Book`s

For SQL drivers with pivot tables this means:

```sql
SELECT `e0`.* FROM `book_tag` AS `e0`;

SELECT `e0`.*, `e1`.`book_id`, `e1`.`book_tag_id`
  FROM `book` AS `e0` LEFT JOIN `book_to_book_tag` AS `e1` ON `e0`.`id` = `e1`.`book_id`
  WHERE `e1`.`book_tag_id` IN (?, ?, ?, ?, ?)
  ORDER BY `e1`.`id` ASC;

SELECT `e0`.* FROM `publisher` AS `e0` WHERE `e0`.`id` IN (?, ?, ?);

SELECT `e0`.*, `e1`.`test_id`, `e1`.`publisher_id`
  FROM `test` AS `e0` LEFT JOIN `publisher_to_test` AS `e1` ON `e0`.`id` = `e1`.`test_id`
  WHERE `e1`.`publisher_id` IN (?, ?, ?)
  ORDER BY `e1`.`id` ASC;

SELECT `e0`.* FROM `author` AS `e0` WHERE `e0`.`id` IN (?);
```

For mongo driver its even simpler as no pivot tables are involved:

```typescript
db.getCollection("book-tag").find({}).toArray();
db.getCollection("book").find({"tags":{"$in":[...]}}).toArray();
db.getCollection("publisher").find({"_id":{"$in":[...]}}).toArray();
db.getCollection("test").find({"_id":{"$in":[...]}}).toArray();
db.getCollection("author").find({"_id":{"$in":[...]}}).toArray();
```

[&larr; Back to table of contents](index.md#table-of-contents)
