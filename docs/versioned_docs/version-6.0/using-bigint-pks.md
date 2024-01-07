---
title: Using native BigInt PKs (MySQL and PostgreSQL)
---

Since v6, `bigint`s are represented by the native `BigInt` type, and as such, they don't require explicit type in the decorator options:

```ts
@PrimaryKey()
id: bigint;
```

You can also specify the target type you want your bigints to be mapped to:

```ts
@PrimaryKey({ type: new BigIntType('bigint') })
id1: bigint;

@PrimaryKey({ type: new BigIntType('string') })
id2: string;

@PrimaryKey({ type: new BigIntType('number') })
id3: number;
```

> JavaScript cannot represent all the possible values of a `bigint` when mapping to the `number` type - only values up to `Number.MAX_SAFE_INTEGER` (2^53 - 1) are safely supported.
