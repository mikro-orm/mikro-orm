---
title: Transactional Outbox Pattern
sidebar_label: Transactional Outbox
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

When building event-driven applications, you often want to publish domain events (e.g., `UserCreated`, `OrderPlaced`) only after the corresponding database transaction commits. A naive approach — emitting events in an `afterTransactionCommit` hook — leaves a dangerous window: if the process crashes after commit but before the events are published, those events are lost, leading to an inconsistent state.

The **transactional outbox pattern** solves this by persisting events into an `outbox` table as part of the same transaction. A separate process then reads from that table and publishes the events to a message broker or event bus. This guarantees at-least-once delivery: events are never lost because they share the same transactional boundary as the business data.

## Defining the Outbox Entity

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
]
  }
>
  <TabItem value="define-entity-class">

```ts title="./entities/OutboxEvent.ts"
import { defineEntity, p } from '@mikro-orm/core';

const OutboxEventSchema = defineEntity({
  name: 'OutboxEvent',
  properties: {
    id: p.integer().primary(),
    eventType: p.string(),
    payload: p.json<Record<string, unknown>>(),
    createdAt: p.datetime().onCreate(() => new Date()),
    processed: p.boolean().default(false),
  },
});

export class OutboxEvent extends OutboxEventSchema.class {}
OutboxEventSchema.setClass(OutboxEvent);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/OutboxEvent.ts"
import { type InferEntity, defineEntity, p } from '@mikro-orm/core';

export const OutboxEvent = defineEntity({
  name: 'OutboxEvent',
  properties: {
    id: p.integer().primary(),
    eventType: p.string(),
    payload: p.json<Record<string, unknown>>(),
    createdAt: p.datetime().onCreate(() => new Date()),
    processed: p.boolean().default(false),
  },
});

export type IOutboxEvent = InferEntity<typeof OutboxEvent>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts title="./entities/OutboxEvent.ts"
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class OutboxEvent {

  @PrimaryKey()
  id!: number;

  @Property()
  eventType!: string;

  @Property({ type: 'json' })
  payload!: Record<string, unknown>;

  @Property()
  createdAt = new Date();

  @Property()
  processed = false;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/OutboxEvent.ts"
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class OutboxEvent {

  @PrimaryKey()
  id!: number;

  @Property()
  eventType!: string;

  @Property()
  payload!: Record<string, unknown>;

  @Property()
  createdAt = new Date();

  @Property()
  processed = false;

}
```

  </TabItem>
</Tabs>

## Writing Events Inside the Transaction

Since outbox events are regular entities, you persist them alongside your business entities. They participate in the same `em.flush()` transaction:

```ts
await em.transactional(async em => {
  const user = em.create(User, { name, email });

  em.create(OutboxEvent, {
    eventType: 'User_create',
    payload: { name, email },
  });
});
// At this point both the user row and the outbox row
// are committed — or neither is, if the transaction fails.
```

### Automating with an onFlush Subscriber

To avoid manually creating outbox events in every transaction, you can use an `onFlush` subscriber to inspect computed change sets and enqueue events automatically:

```ts
import { ChangeSetType, EventSubscriber, FlushEventArgs } from '@mikro-orm/core';
import { OutboxEvent } from './entities/OutboxEvent.js';

export class OutboxSubscriber implements EventSubscriber {

  async onFlush(args: FlushEventArgs) {
    for (const cs of args.uow.getChangeSets()) {
      if (cs.meta.className === 'OutboxEvent') {
        continue; // don't create outbox events for outbox events
      }

      // skip internal early update change sets (used for self-referencing relations)
      if (cs.type === ChangeSetType.UPDATE_EARLY) {
        continue;
      }

      const event = args.em.create(OutboxEvent, {
        eventType: `${cs.meta.className}_${cs.type}`,
        payload: cs.getPrimaryKey(true),
      });

      args.uow.computeChangeSet(event);
    }
  }

}
```

Register it in your ORM config:

```ts
MikroORM.init({
  subscribers: [new OutboxSubscriber()],
});
```

## Publishing Events

A separate worker polls the outbox table, publishes events, and marks them as processed. This can be a cron job, a background worker, or a dedicated microservice:

```ts
async function processOutbox(orm: MikroORM) {
  const em = orm.em.fork();

  const events = await em.find(
    OutboxEvent,
    { processed: false },
    { orderBy: { createdAt: 'ASC' }, limit: 100 },
  );

  for (const event of events) {
    await publishToMessageBroker(event.eventType, event.payload);
    event.processed = true;
  }

  await em.flush();
}
```

A few things to keep in mind:

- **Consumers must be idempotent.** Since this guarantees at-least-once delivery (not exactly-once), the same event might be published more than once — for example, if the worker crashes after publishing some events but before `em.flush()` marks them as processed, those events will be re-published on the next run.
- **Use pessimistic locking for concurrent workers.** If you run multiple publisher instances, use `FOR UPDATE SKIP LOCKED` to avoid processing the same event twice:

```ts
import { LockMode } from '@mikro-orm/core';

const events = await em.find(
  OutboxEvent,
  { processed: false },
  {
    orderBy: { createdAt: 'ASC' },
    limit: 100,
    lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
  },
);
```

- **Clean up old events.** Periodically delete processed events to keep the table small:

```ts
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - 7);

await em.nativeDelete(OutboxEvent, {
  processed: true,
  createdAt: { $lt: cutoff },
});
```

## Why Not Emit Events in a Hook?

It might be tempting to publish events directly in an `afterFlush` or `afterTransactionCommit` hook. While this approach is simpler, it has a critical flaw: if the process crashes after the transaction commits but before the events are emitted, the events are permanently lost. There is no way to recover them since nothing was persisted.

The outbox pattern eliminates this window by making event persistence part of the transaction itself. The worst case is that an event gets published more than once — which is easily handled with idempotent consumers.
