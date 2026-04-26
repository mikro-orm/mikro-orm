---
title: Query cancellation
sidebar_label: Query cancellation
---

Long-running queries can be cancelled via standard `AbortSignal`, either per-call or as a default for an EntityManager fork.

## Per-call signal

Every read/write entry point on the `EntityManager` (and `QueryBuilder`) accepts a `signal` option that aborts the query when the signal fires:

```ts
const ctrl = new AbortController();
setTimeout(() => ctrl.abort(), 5_000);

try {
  const users = await em.findAll(User, {
    where: { active: true },
    signal: ctrl.signal,
  });
} catch (e) {
  if (ctrl.signal.aborted) {
    // query was cancelled
  }
}
```

`signal` is supported on all read/write methods that take an options bag — `find`/`findOne`/`findAll`/`count`/`countBy`/`insert`/`update`/`delete`/`upsert`/`nativeUpdate`/`nativeDelete`/`stream`/`lock` and the matching `QueryBuilder` methods, plus `em.execute()` for raw queries (passed via `loggerContext`).

## Fork-level signal

Pass a `signal` to `em.fork()` (or `em.transactional()`) to apply it as a default to every query that runs against the forked context — useful for per-request cancellation in HTTP servers:

```ts
app.get('/users', async (req, res) => {
  const fork = orm.em.fork({ signal: req.signal });
  const users = await fork.findAll(User); // cancels if the client disconnects
  res.json(users);
});
```

Per-call `signal` overrides the fork-level default; a fork's signal is also inherited by nested forks and transactional callbacks unless explicitly overridden.

## Cancellation strategy

By default, when a signal fires the ORM stops awaiting the query but lets it continue running on the server until it settles — the connection only returns to the pool once the database replies. Set `inflightQueryAbortStrategy` to ask the database to actively cancel:

| Strategy           | Behavior                                                                                            |
|--------------------|-----------------------------------------------------------------------------------------------------|
| `'ignore query'`   | Default. Stop awaiting; query keeps running server-side until it settles.                           |
| `'cancel query'`   | Ask the database to cancel the running query. Falls back to `'ignore query'` if unsupported.        |
| `'kill session'`   | Terminate the database session/process. Falls back to `'cancel query'` if unsupported.              |

Per-driver mapping:

| Driver             | `cancel query`                       | `kill session`                            |
|--------------------|--------------------------------------|-------------------------------------------|
| PostgreSQL         | `pg_cancel_backend(pid)`             | `pg_terminate_backend(pid)`               |
| MySQL / MariaDB    | `KILL QUERY <id>`                    | `KILL <id>`                               |
| MSSQL              | tedious request cancel               | falls back to `cancel query`              |
| SQLite / libSQL    | falls back to `ignore query`         | falls back to `ignore query`              |
| MongoDB            | n/a — strategies are silently ignored, only the signal is honored (per-op abort) |

Most engines do not cancel writes mid-statement; partial commits are possible. If you need atomicity, run cancellable writes inside a transaction so a cancelled batch rolls back.

```ts
await em.findAll(User, {
  where: { /* ... */ },
  signal: ctrl.signal,
  inflightQueryAbortStrategy: 'cancel query',
});
```

You can also pair `inflightQueryAbortStrategy` with `em.fork({ signal, inflightQueryAbortStrategy })` to apply a strategy to every query against the fork.

## Streaming

For streaming queries (`em.stream()` / `qb.stream()`), `inflightQueryAbortStrategy` is silently treated as `'ignore query'` regardless of the value passed. The underlying driver only accepts a plain `AbortSignal` for streamed reads — there is no server-side cancel for an open cursor; aborting closes the cursor on the client.

```ts
const ctrl = new AbortController();
const stream = em.stream(Book, {
  where: { price: { $gt: 100 } },
  orderBy: { id: 'ASC' },
  signal: ctrl.signal,
});

for await (const book of stream) {
  if (shouldStop(book)) {
    ctrl.abort();
    break;
  }
}
```

## MongoDB

The MongoDB driver wires the signal directly into the native driver's per-op abort. `inflightQueryAbortStrategy` has no meaning there and is silently ignored. The signal is honored on `find`/`findOne`/`countBy`/`insert`/`update`/`delete`/`stream`/`aggregate`/`streamAggregate` and inside `em.transactional()`.
