---
title: Smart Nested Populate
---

`MikroORM` is capable of loading large nested structures while maintaining good performance, querying each database table only once. Imagine you have this nested structure:

- `Book` has one `Publisher` (M:1), one `Author` (M:1) and many `BookTag`s (M:N)
- `Publisher` has many `Test`s (M:N)

When you use nested populate while querying all `BookTag`s, this is what happens in the background:

```ts
const tags = await em.findAll(BookTag, { populate: ['books.publisher.tests', 'books.author'] });
console.log(tags[0].books[0].publisher.tests[0].name); // prints name of nested test
console.log(tags[0].books[0].author.name); // prints name of nested author
```

1. Load all `BookTag`s
2. Load all `Book`s associated with previously loaded `BookTag`s
3. Load all `Publisher`s associated with previously loaded `Book`s
4. Load all `Test`s associated with previously loaded `Publisher`s
5. Load all `Author`s associated with previously loaded `Book`s

> You can also populate all relationships by passing `populate: true`.

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

```ts
db.getCollection("book-tag").find({}).toArray();
db.getCollection("book").find({"tags":{"$in":[...]}}).toArray();
db.getCollection("publisher").find({"_id":{"$in":[...]}}).toArray();
db.getCollection("test").find({"_id":{"$in":[...]}}).toArray();
db.getCollection("author").find({"_id":{"$in":[...]}}).toArray();
```

## Filter on populated entities

The request to populate can be ambiguous. For example, let's say as a hypothetical that there's a `Book` called `'One'` with tags `'Fiction'` and `'Hard Cover'`.

Then you run the following:

```ts
const books = await em.find(Book, { tags: { name: 'Fiction' } }, {
  populate: ['tags'],
});
```

You're requesting books that have the tag of `'Fiction'` then asking to populate the tags on each book. Did you mean that you want to populate **all** tags on each book that matches the filter? If so, you'd expect that book `'One'` would have both `'Fiction'` and `'Hard Cover'` populated. Or did you mean that we should only populate the tags that match the outer filter? If so you'd expect that book `'One'` would only have `'Fiction'` in the populated collection because the outer filter specified that.

Both behaviors are useful in different cases, so MikroORM provides an option that allows you to control this called `populateWhere`. There are two options, `INFER` and `ALL`. The default is `ALL` which will ensure that all possible members of the collection are fetched in the populate (e.g. the the first interpretation above).

You can specify this globally:

```ts
const orm = await MikroORM.init({
    // We want our populate fetches to respect the outer filter passed in a where condition.
    populateWhere: PopulateHint.INFER,
});
```

Or you can override this on a query by query basis:

```ts
const books = await em.find(Book, { tags: { name: 'Fiction' } }, {
  populate: ['tags'],
  populateWhere: PopulateHint.INFER,
});
```

Using `PopulateHint.INFER` in this case instructs MikroORM to interpret the find as per the second interpretation above.

A value provided on a specific query overrides whatever default is specified globally.

## Loading strategies

The way that MikroORM fetches the data in a populate is also configurable. By default MikroORM uses a "where in" strategy which runs one separate query for each level of a populate. If you're using an SQL database you can also ask MikroORM to use a join for all tables involved in the populate and run it as a single query. This is again configurable globally or per query.

For more information see the [Loading Strategies section](./loading-strategies.md).

## Populating already loaded entities

To populate existing entities, you can use `em.populate()`.

```ts
const authors = await em.createQueryBuilder(Author).select('*').getResult();
await em.populate(authors, ['books.tags']);

// now your Author entities will have `books` collections populated,
// as well as they will have their `tags` collections populated.
console.log(authors[0].books[0].tags[0]); // initialized BookTag
```
