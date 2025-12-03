import { MikroORM } from '@mikro-orm/sqlite';
import { CreateRequestContext, EnsureRequestContext, Entity, PrimaryKey } from '@mikro-orm/decorators/es';

@Entity()
class BarEntity {

  @PrimaryKey({ type: 'integer' })
  id!: number;

}

@Entity()
class FooEntity {

  @PrimaryKey({ type: 'integer' })
  id!: number;

}

class BarService {

  constructor(private orm: MikroORM) {}

  @EnsureRequestContext()
  async execute() {
    const barEntity = new BarEntity();
    this.orm.em.persist(barEntity);

    await this.orm.em.flush();
  }

  @CreateRequestContext()
  async execute2() {
    await this.execute();
  }

}

class FooService {

  constructor(
    private barService: BarService,
    private orm: MikroORM,
  ) {}

  @CreateRequestContext()
  async myMethod() {
    const fooEntity = new FooEntity();
    this.orm.em.persist(fooEntity);
    await this.orm.em.flush();

    await this.barService.execute();
  }

  @CreateRequestContext()
  async myMethod2() {
    const fooEntity = new FooEntity();
    this.orm.em.persist(fooEntity);
    await this.orm.em.flush();

    await this.barService.execute2();
  }

}

let fooORM: MikroORM;
let barORM: MikroORM;

beforeAll(async () => {
  fooORM = new MikroORM({
    entities: [FooEntity],
    dbName: ':memory:',
  });
  barORM = new MikroORM({
    entities: [BarEntity],
    dbName: ':memory:',
    contextName: 'BAR',
  });
  barORM.config.set('allowGlobalContext', false);
  fooORM.config.set('allowGlobalContext', false);

  await fooORM.schema.refresh();
  await barORM.schema.refresh();
});

afterAll(async () => {
  await fooORM.close();
  await barORM.close();
});

it('should not warn about using global context', async () => {
  const barService = new BarService(barORM);
  const fooService = new FooService(barService, fooORM);
  await fooService.myMethod();
  await fooService.myMethod2();
});
