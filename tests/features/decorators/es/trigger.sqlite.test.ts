import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, Trigger } from '@mikro-orm/decorators/es';

@Entity()
@Trigger({
  name: 'trg_es_counter',
  timing: 'after',
  events: ['insert'],
  body: `UPDATE es_trigger_entity SET counter = counter + 1 WHERE id = NEW.id`,
})
class EsTriggerEntity {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'integer' })
  counter!: number;
}

describe('Trigger decorator (ES / TC39)', () => {
  test('registers trigger via ES decorator', async () => {
    const orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [EsTriggerEntity],
    });

    const meta = orm.getMetadata(EsTriggerEntity);
    expect(meta.triggers).toEqual([
      {
        name: 'trg_es_counter',
        timing: 'after',
        events: ['insert'],
        forEach: 'row',
        body: 'UPDATE es_trigger_entity SET counter = counter + 1 WHERE id = NEW.id',
      },
    ]);

    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toContain('create trigger');
    expect(sql).toContain('trg_es_counter');

    await orm.close();
  });
});
