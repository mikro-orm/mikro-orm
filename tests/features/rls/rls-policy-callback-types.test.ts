import { defineEntity, EntitySchema, p } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

// Type-level coverage: policy expression callbacks receive the property-to-column mapping typed from
// the entity in every declaration style that knows the entity type (see the RLS guide, policy options).

test('policy callback columns are typed from the decorated class', () => {
  @Entity({
    policies: [
      {
        using: columns => {
          // @ts-expect-error unknown property
          void columns.doesNotExist;
          return `${columns.tenantId} = current_setting('app.tenant')::uuid`;
        },
      },
    ],
  })
  class DecoratedArticle {
    @PrimaryKey()
    id!: number;

    @Property({ type: 'uuid' })
    tenantId!: string;
  }

  expect(DecoratedArticle.name).toBe('DecoratedArticle');
});

test('policy callback columns are typed from the EntitySchema class option', () => {
  class SchemaArticle {
    id!: number;
    tenantId!: string;
  }

  const schema = new EntitySchema({
    class: SchemaArticle,
    properties: {
      id: { type: 'number', primary: true },
      tenantId: { type: 'uuid' },
    },
    policies: [
      {
        using: columns => {
          // @ts-expect-error unknown property
          void columns.doesNotExist;
          return `${columns.tenantId} = current_setting('app.tenant')::uuid`;
        },
      },
    ],
  });

  expect(schema.meta.policies).toHaveLength(1);
});

test('policy callback columns are typed from the inferred defineEntity properties', () => {
  const schema = defineEntity({
    name: 'DefinedArticle',
    properties: {
      id: p.integer().primary(),
      tenantId: p.uuid(),
    },
    policies: [
      {
        using: columns => {
          // @ts-expect-error unknown property
          void columns.doesNotExist;
          return `${columns.tenantId} = current_setting('app.tenant')::uuid`;
        },
      },
    ],
  });

  expect(schema.meta.policies).toHaveLength(1);
});
