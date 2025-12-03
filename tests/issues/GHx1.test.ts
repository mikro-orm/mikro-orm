import { MikroORM } from '@mikro-orm/core';
import { Entity, Enum, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqliteDriver } from '@mikro-orm/sqlite';

enum TaskStatus {
  OPENED = 'OPENED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
}

@Entity()
class Status {

  @Enum({ primary: true, length: 20, items: () => TaskStatus })
  name!: TaskStatus;

  @Property()
  displayName!: string;

}

@Entity()
class Task {

  @PrimaryKey()
  id!: number;

  @ManyToOne({
    entity: () => Status,
    default: TaskStatus.OPENED,
  })
  status!: Status;

}

test(`default value for relation property`, async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Task, Status],
    driver: SqliteDriver,
    dbName: ':memory:',
  });
  await orm.schema.refresh();

  const status = new Status();
  status.name = TaskStatus.OPENED;
  status.displayName = 'opened';
  await orm.em.persist(status).flush();
  const task = new Task();
  await orm.em.persist(task).flush();
  expect(task.status).toBeInstanceOf(Status);
  const t1 = await orm.em.fork().findOneOrFail(Task, task);
  expect(t1.status).toBeInstanceOf(Status);

  await orm.close(true);
});

test(`default value for relation property (sqlite/returning)`, async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Task, Status],
    driver: SqliteDriver,
    dbName: ':memory:',
  });
  await orm.schema.refresh();

  const status = new Status();
  status.name = TaskStatus.OPENED;
  status.displayName = 'opened';
  await orm.em.persist(status).flush();
  const task = new Task();
  await orm.em.persist(task).flush();
  expect(task.status).toBeInstanceOf(Status);
  const t1 = await orm.em.fork().findOneOrFail(Task, task);
  expect(t1.status).toBeInstanceOf(Status);

  await orm.close(true);
});

test(`default value for relation property (postgres/returning)`, async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Task, Status],
    driver: PostgreSqlDriver,
    dbName: 'mikro_orm_test_x1',
  });
  await orm.schema.refresh();

  const status = new Status();
  status.name = TaskStatus.OPENED;
  status.displayName = 'opened';
  await orm.em.persist(status).flush();
  const task = new Task();
  await orm.em.persist(task).flush();
  expect(task.status).toBeInstanceOf(Status);
  const t1 = await orm.em.fork().findOneOrFail(Task, task);
  expect(t1.status).toBeInstanceOf(Status);

  await orm.close(true);
});
