---
---

# Smart query conditions

When you want to make complex queries, you can easily end up with a lot of boilerplate code
full of curly brackets:

```typescript
const res = await orm.em.find(Author, { $and: [
  { id: { $in: [1, 2, 7] }, },
  { id: { $nin: [3, 4] }, },
  { id: { $gt: 5 }, },
  { id: { $lt: 10 }, },
  { id: { $gte: 7 }, },
  { id: { $lte: 8 }, },
  { id: { $ne: 9 }, },
] })
```

For AND condition with single field, you can also do this:

```typescript
const res = await orm.em.find(Author, { 
  id: { 
    $in: [1, 2, 7],
    $nin: [3, 4],
    $gt: 5,
    $lt: 10,
    $gte: 7,
    $lte: 8,
    $ne: 9,
  },
})
```

Another way to do this by including the operator in your keys:

```typescript
const res = await orm.em.find(Author, { $and: [
  { 'id:in': [1, 2, 7] },
  { 'id:nin': [3, 4] },
  { 'id:gt': 5 },
  { 'id:lt': 10 },
  { 'id:gte': 7 },
  { 'id:lte': 8 },
  { 'id:ne': 9 },
] })
```

For comparison operators, you can also use their mathematical symbols:

```typescript
const res = await orm.em.find(Author, { $and: [
  { 'id >': 5 },
  { 'id <': 10 },
  { 'id >=': 7 },
  { 'id <=': 8 },
  { 'id !=': 9 },
] })
```
