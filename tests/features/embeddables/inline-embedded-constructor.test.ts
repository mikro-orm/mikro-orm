import { EntityProperty, EntitySchema, MikroORM, Type } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

class LectureId {

  readonly id: string;

  constructor(id?: string) {
    this.id = id ?? v4();
  }

  toString() {
    return this.id;
  }

}

class Lecture {

  id: LectureId;
  title: string;
  period?: Period;

  constructor(props: {
    id: LectureId | string;
    title: string;
    period?: Period;
  }) {
    this.id = typeof props.id === 'string' ? new LectureId(props.id) : props.id;
    this.title = props.title;
    this.period = props.period;
  }

  static create(command: { title: string }) {
    const id = new LectureId();
    return new Lecture({
      id,
      ...command,
    });
  }

  start() {
    this.period = new Period({
      start: new Date(),
    });
  }

  end() {
    this.period = this.period?.setEndDate(new Date());
  }

  toJSON() {
    return {
      id: this.id.id,
      title: this.title,
      period: this.period?.toJSON(),
    };
  }

}

type PeriodProps = {
  start: Date;
  end?: Date;
};

class Period {

  readonly start: Date;
  readonly end: Date | null;

  constructor(props: PeriodProps) {
    this.validate(props);
    this.start = props.start;
    this.end = props.end ?? null;
  }

  private validate(props: PeriodProps) {
    if (!props.start) {
      throw new Error('The start date is required');
    }

    if (props.end != null && props.start > props.end) {
      throw new Error('The start date must be before the end date');
    }
  }

  setEndDate(newEndDate: Date): Period {
    return new Period({ start: this.start, end: newEndDate });
  }

  toJSON() {
    return {
      start: this.start,
      end: this.end,
    };
  }

}

class LectureIdSchemaType extends Type<LectureId, string> {

  convertToDatabaseValue(valueObject: LectureId | undefined | null): string {
    return valueObject instanceof LectureId
      ? valueObject.id
      : (valueObject as unknown as string);
  }

  convertToJSValue(value: string): LectureId {
    return new LectureId(value);
  }

  getColumnType(prop: EntityProperty) {
    return `varchar(24)`;
  }

}

const PeriodSchema = new EntitySchema<Period>({
  class: Period,
  embeddable: true,
  properties: {
    start: {
      type: Date,
    },
    end: {
      type: Date,
      nullable: true,
    },
  },
  forceConstructor: true,
});

const LectureSchema = new EntitySchema<Lecture>({
  class: Lecture,
  properties: {
    id: {
      type: new LectureIdSchemaType(),
      primary: true,
    },
    title: { type: 'varchar(255)' },
    period: {
      kind: 'embedded',
      entity: 'Period',
      nullable: true,
      prefix: 'period_',
    },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [LectureSchema, PeriodSchema],
    dbName: ':memory:',
    forceEntityConstructor: true,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close();
});

it('should create the required entities', async () => {
  const lecture = Lecture.create({
    title: 'Databases 101',
  });
  orm.em.persist(lecture);

  await orm.em.flush();
  orm.em.clear();

  const insertedLecture = await orm.em.findOne(Lecture, { id: lecture.id });

  insertedLecture!.start();
  await orm.em.flush();
  orm.em.clear();

  const updatedLecture = await orm.em.findOne(Lecture, { id: lecture.id });
  expect(updatedLecture?.period?.start).toEqual(
    insertedLecture!.period!.start,
  );
  expect(updatedLecture?.period?.end).toEqual(insertedLecture!.period!.end);
});
