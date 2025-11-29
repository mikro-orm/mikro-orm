import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

test('4911', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '4911',
    discovery: {
      warnWhenNoEntities: false,
    },
    ensureDatabase: false,
    extensions: [EntityGenerator],
  });

  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(`
CREATE TABLE "public"."dcim_device" (
    "created" timestamptz,
    "id" int8 NOT NULL,
    "name" varchar,
    "_name" varchar,
    "asset_tag" varchar,
    "position" numeric,
    "face" varchar NOT NULL,
    "vc_position" int2 CHECK (vc_position >= 0),
    "vc_priority" int2 CHECK (vc_priority >= 0),
    "cluster_id" int8,
    "role_id" int8 NOT NULL,
    "device_type_id" int8 NOT NULL,
    "location_id" int8,
    "platform_id" int8,
    "primary_ip4_id" int8,
    "primary_ip6_id" int8,
    "rack_id" int8,
    "site_id" int8 NOT NULL,
    "tenant_id" int8,
    "virtual_chassis_id" int8,
    "airflow" varchar NOT NULL,
    "config_template_id" int8,
    "oob_ip_id" int8,
    PRIMARY KEY ("id")
);
CREATE INDEX dcim_device_virtual_chassis_id_aed51693 ON "public"."dcim_device" USING BTREE (virtual_chassis_id);
CREATE UNIQUE INDEX dcim_device_unique_virtual_chassis_vc_position ON "public"."dcim_device" USING BTREE (virtual_chassis_id, vc_position);
CREATE UNIQUE INDEX dcim_device_unique_rack_position_face ON "public"."dcim_device" USING BTREE (rack_id, position, face);
CREATE UNIQUE INDEX dcim_device_unique_name_site_tenant ON "public"."dcim_device" (lower(name), site_id, tenant_id);
CREATE UNIQUE INDEX dcim_device_unique_name_site ON "public"."dcim_device" (lower(name), site_id) WHERE tenant_id IS NULL;
CREATE INDEX dcim_device_tenant_id_dcea7969 ON "public"."dcim_device" USING BTREE (tenant_id);
CREATE INDEX dcim_device_site_id_ff897cf6 ON "public"."dcim_device" USING BTREE (site_id);
CREATE INDEX dcim_device_rack_id_23bde71f ON "public"."dcim_device" USING BTREE (rack_id);
CREATE UNIQUE INDEX dcim_device_primary_ip6_id_key ON "public"."dcim_device" USING BTREE (primary_ip6_id);
CREATE UNIQUE INDEX dcim_device_primary_ip4_id_key ON "public"."dcim_device" USING BTREE (primary_ip4_id);
CREATE INDEX dcim_device_platform_id_468138f1 ON "public"."dcim_device" USING BTREE (platform_id);
CREATE INDEX dcim_device_oob_ip_id_key ON "public"."dcim_device" USING BTREE (oob_ip_id);
CREATE INDEX dcim_device_location_id_11a7bedb ON "public"."dcim_device" USING BTREE (location_id);
CREATE INDEX dcim_device_device_type_id_d61b4086 ON "public"."dcim_device" USING BTREE (device_type_id);
CREATE INDEX dcim_device_device_role_id_682e8188 ON "public"."dcim_device" USING BTREE (role_id);
CREATE INDEX dcim_device_config_template_id_316328c4 ON "public"."dcim_device" USING BTREE (config_template_id);
CREATE INDEX dcim_device_cluster_id_cf852f78 ON "public"."dcim_device" USING BTREE (cluster_id);
CREATE UNIQUE INDEX dcim_device_asset_tag_key ON "public"."dcim_device" USING BTREE (asset_tag);
CREATE INDEX dcim_device_asset_tag_8dac1079_like ON "public"."dcim_device" USING BTREE (asset_tag varchar_pattern_ops);
  `);
  }

  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot();
  await orm.close(true);
});
