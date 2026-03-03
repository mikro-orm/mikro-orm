import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Part {
  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;
}

@Entity()
class Job {
  @PrimaryKey()
  id!: string;

  @OneToMany(() => JobConnection, so => so.job, { orphanRemoval: true })
  jobConnections = new Collection<JobConnection>(this);
}

@Entity()
class JobConnection {
  @PrimaryKey()
  id!: string;

  @OneToMany(() => OrderItem, e => e.jobConnection, { orphanRemoval: true })
  orderItems = new Collection<OrderItem>(this);

  @ManyToOne(() => Job)
  job?: Job;
}

@Entity()
class OrderItem {
  @PrimaryKey()
  id!: string;

  @ManyToOne(() => Part, { eager: true })
  part!: Part;

  @ManyToOne(() => JobConnection)
  jobConnection?: JobConnection;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Part, OrderItem, JobConnection, Job],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test(`nested eager not respected when populating non-eager parent`, async () => {
  orm.em.create(Job, {
    id: '1',
    jobConnections: [
      {
        id: '1',
        orderItems: [{ id: '1', part: { id: '1', name: 'part' } }],
      },
    ],
  });
  orm.em.create(Job, {
    id: '2',
    jobConnections: [
      {
        id: '2',
        orderItems: [{ id: '2', part: { id: '2', name: 'part' } }],
      },
    ],
  });
  await orm.em.flush();
  orm.em.clear();

  const jobs = await orm.em.findAll(Job, {
    populate: ['jobConnections.orderItems'],
  });

  expect(jobs[0].jobConnections[0].orderItems[0].part.name).toBeDefined();
});
