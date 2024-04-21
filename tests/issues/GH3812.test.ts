import {
  Collection,
  Entity,
  MikroORM,
  ModifyContext,
  ModifyHint,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Enum,
  wrap,
  Ref,
} from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

export abstract class BaseEntity {

  @PrimaryKey()
  id: string = v4();

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ nullable: true })
  deletedAt?: Date | null;

}

export enum StepType {
  ASSY = 'ASSY',
  INSP = 'INSP',
  TEST = 'TEST',
  PTG = 'PTG',
}

@Entity()
export class Step extends BaseEntity {

  @Property()
  name!: string;

  @Property()
  number!: string;

  @Property()
  order!: number;

  @Enum(() => StepType)
  type!: StepType;

  @ManyToOne(() => Step, { ref: true, nullable: true })
  subStep?: Ref<Step>;

}

@Entity()
export class SerialNumber extends BaseEntity {

  @Property()
  serialNumber!: number;

  @OneToMany(() => Log, log => log.serialNumber)
  logs = new Collection<Log>(this);

}

@Entity()
export class Log extends BaseEntity {

  @ManyToOne(() => SerialNumber)
  serialNumber!: SerialNumber;

  @ManyToOne(() => Step, { ref: true, nullable: true })
  step?: Ref<Step>;

  @Property({ type: 'date', nullable: true })
  operationDate?: string | null;

  @Property({ default: false })
  current: boolean = false;

  @Property({ default: false })
  returned: boolean = false;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Step, SerialNumber, Log],
    dbName: `:memory:`,
  });

  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('GH 3812', async () => {
  const user = orm.em.create(SerialNumber, {
    id: '559fccf7-11f0-4e5a-8e15-ae29b98ddeb3',
    createdAt: '2022-11-30T15:54:51.000Z',
    updatedAt: '2022-11-30T15:54:51.000Z',
    deletedAt: null,
    serialNumber: 1231,
    logs: [
      {
        id: 'a73827bc-70aa-4a2b-aa9f-055fc387a022',
        createdAt: '2022-11-30T15:55:06.000Z',
        updatedAt: '2022-11-30T15:55:06.000Z',
        deletedAt: null,
        step: {
          id: '1728c421-cf23-4618-9518-e12c385a39ff',
          createdAt: '2022-11-30T14:26:16.000Z',
          updatedAt: '2022-11-30T14:26:16.000Z',
          deletedAt: null,
          name: 'ASSY',
          number: '3',
          order: 0,
          type: StepType.ASSY,
        },
        operationDate: null,
        current: true,
        returned: true,
        serialNumber: '559fccf7-11f0-4e5a-8e15-ae29b98ddeb3',
      },
      {
        id: '728fc9bb-c44a-4310-a397-7a4a2f4620c2',
        createdAt: '2022-11-30T15:54:53.000Z',
        updatedAt: '2022-11-30T15:55:06.000Z',
        deletedAt: '2022-11-30T15:55:06.000Z',
        step: {
          id: '1728c421-cf23-4618-9518-e12c385a39ff',
          createdAt: '2022-11-30T14:26:16.000Z',
          updatedAt: '2022-11-30T14:26:16.000Z',
          deletedAt: null,
          name: 'ASSY',
          number: '3',
          order: 0,
          type: StepType.ASSY,
          subStep: {
            id: '29b64d55-d583-44ed-8407-65968a150057',
            createdAt: '2022-11-30T15:26:16.000Z',
            updatedAt: '2022-11-30T15:26:16.000Z',
            deletedAt: null,
            name: 'INSP',
            number: '20',
            order: 3,
            type: StepType.INSP,
          },
        },
        operationDate: '2022-11-30',
        current: false,
        returned: false,
        serialNumber: '559fccf7-11f0-4e5a-8e15-ae29b98ddeb3',
      },
      {
        id: 'f29aa5d1-6036-4e00-938f-483581b72184',
        createdAt: '2022-11-30T15:55:04.000Z',
        updatedAt: '2022-11-30T15:55:06.000Z',
        deletedAt: null,
        step: {
          id: '09b64d55-d583-44ed-8407-65968a150057',
          createdAt: '2022-11-30T14:26:16.000Z',
          updatedAt: '2022-11-30T14:26:16.000Z',
          deletedAt: null,
          name: 'ASSY',
          number: '50',
          order: 1,
          type: StepType.ASSY,
          subStep: {
            id: '19b64d55-d583-44ed-8407-65968a150057',
            createdAt: '2022-11-30T15:26:16.000Z',
            updatedAt: '2022-11-30T15:26:16.000Z',
            deletedAt: null,
            name: 'INSP',
            number: '10',
            order: 2,
            type: StepType.INSP,
          },
        },
        operationDate: '2022-11-30',
        current: false,
        returned: false,
        serialNumber: '559fccf7-11f0-4e5a-8e15-ae29b98ddeb3',
      },
    ],
  });
  await orm.em.persistAndFlush(user);
  orm.em.clear();

  // with EM
  const res1 = await orm.em.find(SerialNumber, {}, { populate: ['logs.step.subStep'] });
  expect(res1).toHaveLength(1);
  expect(wrap(res1[0]).toJSON().logs[0].serialNumber).toBe('559fccf7-11f0-4e5a-8e15-ae29b98ddeb3');
  expect(wrap(res1[0]).toJSON().logs[0].step?.name).toBe('ASSY');

  orm.em.clear();

  type T11 = ModifyHint<'sn', never, never, 'logs'>;
  type T12 = ModifyHint<'sn', { l: 'logs' }, 'logs', 'l.step'>;
  type T13 = ModifyHint<'sn', { l: 'logs'; s: 'logs.step' }, 'logs' | 'logs.step', 's.subStep'>;
  type T21 = ModifyContext<never, 'logs', 'l'>;
  type T22 = ModifyContext<{ l: 'logs' }, 'l.step', 's'>;
  type T23 = ModifyContext<{ l: 'logs'; s: 'logs.step' }, 's.subStep', 's2'>;

  const res2 = await orm.em
    .createQueryBuilder(SerialNumber, 'sn')
    .select('*')
    .leftJoinAndSelect('sn.logs', 'l')
    .leftJoinAndSelect('l.step', 's')
    .leftJoinAndSelect('s.subStep', 's2')
    .getResultList();
  expect(res2).toHaveLength(1);
  expect(wrap(res2[0]).toJSON().logs[0].serialNumber).toBe('559fccf7-11f0-4e5a-8e15-ae29b98ddeb3');
  expect(wrap(res2[0]).toJSON().logs[0].step?.name).toBe('ASSY');
  expect(wrap(res2[0]).toJSON().logs[0].step?.subStep?.name).toBe('INSP');
});
