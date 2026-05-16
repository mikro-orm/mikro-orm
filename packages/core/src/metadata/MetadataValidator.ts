import type { EntityMetadata, EntityName, EntityProperty } from '../typings.js';
import type { Routine } from './Routine.js';
import { Utils } from '../utils/Utils.js';
import { type MetadataDiscoveryOptions } from '../utils/Configuration.js';
import { normalizePartitionNameForComparison, splitCommaSeparatedIdentifiers } from '../utils/partition-utils.js';
import { MetadataError } from '../errors.js';
import { ReferenceKind } from '../enums.js';
import type { MetadataStorage } from './MetadataStorage.js';

type PartitionExpression = NonNullable<EntityMetadata['partitionBy']>['expression'];

/**
 * List of property names that could lead to prototype pollution vulnerabilities.
 * These names should never be used as entity property names because they could
 * allow malicious code to modify object prototypes when property values are assigned.
 *
 * - `__proto__`: Could modify the prototype chain
 * - `constructor`: Could modify the constructor property
 * - `prototype`: Could modify the prototype object
 *
 * @internal
 */
const DANGEROUS_PROPERTY_NAMES = ['__proto__', 'constructor', 'prototype'] as const;

/**
 * @internal
 */
export class MetadataValidator {
  validateEntityDefinition<T>(metadata: MetadataStorage, name: EntityName<T>, options: MetadataDiscoveryOptions): void {
    const meta = metadata.get(name);

    // View entities (expression with view flag) behave like regular tables but are read-only
    // They can have primary keys and are created as actual database views
    if (meta.view) {
      this.validateViewEntity(meta);
      return;
    }

    // Virtual entities (expression without view flag) have restrictions - no PKs, limited relation types
    // Note: meta.virtual is set later in sync(), so we check for expression && !view here
    if (meta.virtual || (meta.expression && !meta.view)) {
      if (meta.partitionBy) {
        throw new MetadataError(`Virtual entity ${meta.className} cannot define partitionBy`);
      }

      for (const prop of Utils.values(meta.properties)) {
        if (
          ![ReferenceKind.SCALAR, ReferenceKind.EMBEDDED, ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(
            prop.kind,
          )
        ) {
          throw new MetadataError(
            `Only scalars, embedded properties and to-many relations are allowed inside virtual entity. Found '${prop.kind}' in ${meta.className}.${prop.name}`,
          );
        }

        if (prop.primary) {
          throw new MetadataError(
            `Virtual entity ${meta.className} cannot have primary key ${meta.className}.${prop.name}`,
          );
        }
      }

      return;
    }

    // entities have PK
    if (!meta.embeddable && (!meta.primaryKeys || meta.primaryKeys.length === 0)) {
      throw MetadataError.fromMissingPrimaryKey(meta);
    }

    this.validateVersionField(meta);
    this.validateDuplicateFieldNames(meta, options);
    this.validateIndexes(meta, meta.indexes ?? [], 'index');
    this.validateIndexes(meta, meta.uniques ?? [], 'unique');
    this.validatePartitioning(meta);
    this.validatePropertyNames(meta);

    for (const prop of Utils.values(meta.properties)) {
      if (prop.kind !== ReferenceKind.SCALAR) {
        this.validateReference(meta, prop, options);
        this.validateBidirectional(meta, prop);
      } else if (metadata.getByClassName(prop.type, false)) {
        throw MetadataError.propertyTargetsEntityType(meta, prop, metadata.getByClassName(prop.type));
      }
    }
  }

  validateRoutineDefinition(routine: Routine): void {
    if (!routine.type) {
      throw new MetadataError(
        `Routine ${routine.routineName} is missing the required 'type' option ('procedure' | 'function').`,
      );
    }

    if (routine.body != null && routine.expression != null) {
      throw new MetadataError(
        `Routine ${routine.routineName} defines both 'body' and 'expression'. Use one or the other.`,
      );
    }

    if (routine.body == null && routine.expression == null && routine.bodyJs == null) {
      throw new MetadataError(`Routine ${routine.routineName} must define a 'body', 'expression', or 'bodyJs'.`);
    }

    if (routine.type === 'function' && routine.returns == null) {
      throw new MetadataError(`Function routine ${routine.routineName} must declare a 'returns' option.`);
    }

    if (routine.type === 'procedure' && routine.bodyJs != null) {
      throw new MetadataError(
        `Routine ${routine.routineName} declares 'bodyJs' on a procedure. JS fallbacks are only supported for functions — SQLite has no analog for stored procedures.`,
      );
    }

    for (const param of routine.params) {
      const dir = param.direction;

      if (dir !== 'in' && dir !== 'out' && dir !== 'inout') {
        throw new MetadataError(
          `Routine ${routine.routineName}.${param.name} has invalid direction '${dir}'. Expected 'in', 'out', or 'inout'.`,
        );
      }

      if ((dir === 'out' || dir === 'inout') && !param.ref) {
        throw new MetadataError(
          `Routine ${routine.routineName}.${param.name} is declared as '${dir}' but missing 'ref: true'. OUT/INOUT parameters must be passed as ScalarReference.`,
        );
      }

      if (routine.type === 'function' && dir !== 'in') {
        throw new MetadataError(
          `Function routine ${routine.routineName}.${param.name} declares direction '${dir}'. Functions only support IN parameters — use a procedure for OUT/INOUT semantics.`,
        );
      }
    }
  }

  validateDiscovered(discovered: EntityMetadata[], options: MetadataDiscoveryOptions): void {
    if (discovered.length === 0 && options.warnWhenNoEntities) {
      throw MetadataError.noEntityDiscovered();
    }

    // Validate no mixing of STI and TPT in the same hierarchy
    this.validateInheritanceStrategies(discovered);

    const tableNames = discovered.filter(
      meta =>
        !meta.abstract &&
        !meta.embeddable &&
        meta === meta.root &&
        (meta.tableName || meta.collection) &&
        meta.schema !== '*',
    );
    const duplicateTableNames = Utils.findDuplicates(
      tableNames.map(meta => {
        const tableName = meta.tableName || meta.collection;
        return (meta.schema ? '.' + meta.schema : '') + tableName;
      }),
    );

    if (duplicateTableNames.length > 0 && options.checkDuplicateTableNames) {
      throw MetadataError.duplicateEntityDiscovered(duplicateTableNames);
    }

    // validate we found at least one entity (not just abstract/base entities)
    if (discovered.filter(meta => meta.name).length === 0 && options.warnWhenNoEntities) {
      throw MetadataError.onlyAbstractEntitiesDiscovered();
    }

    const unwrap = (type: string) =>
      type
        .replace(/Array<(.*)>/, '$1') // unwrap array
        .replace(/\[]$/, '') // remove array suffix
        .replace(/\((.*)\)/, '$1'); // unwrap union types

    const name = <T>(p: EntityName<T> | (() => EntityName<T>)): string => {
      if (typeof p === 'function' && !p.prototype) {
        return Utils.className((p as () => EntityName<T>)());
      }

      return Utils.className(p);
    };

    const pivotProps = new Map<string, { prop: EntityProperty; meta: EntityMetadata }[]>();

    // check for not discovered entities
    discovered.forEach(meta =>
      Object.values(meta.properties).forEach(prop => {
        if (
          prop.kind !== ReferenceKind.SCALAR &&
          !unwrap(prop.type)
            .split(/ ?\| ?/)
            .every(type => discovered.find(m => m.className === type))
        ) {
          throw MetadataError.fromUnknownEntity(prop.type, `${meta.className}.${prop.name}`);
        }

        if (prop.pivotEntity) {
          const props = pivotProps.get(name(prop.pivotEntity)) ?? [];
          props.push({ meta, prop });
          pivotProps.set(name(prop.pivotEntity), props);
        }
      }),
    );

    pivotProps.forEach(props => {
      // if the pivot entity is used in more than one property, check if they are linked
      if (props.length > 1 && props.every(p => !p.prop.mappedBy && !p.prop.inversedBy)) {
        throw MetadataError.invalidManyToManyWithPivotEntity(
          props[0].meta,
          props[0].prop,
          props[1].meta,
          props[1].prop,
        );
      }
    });
  }

  private validatePartitioning(meta: EntityMetadata): void {
    if (!meta.partitionBy) {
      return;
    }

    if (!this.hasPartitionExpression(meta.partitionBy.expression)) {
      throw new MetadataError(`Entity ${meta.className} has invalid partitionBy option: missing expression`);
    }

    // Inheritance (STI/TPT) and partitioning both drive table layout, so combining them would
    // require non-trivial DDL coordination that the schema generator does not produce today.
    const hasInheritance =
      !!meta.root.discriminatorColumn || meta.root.inheritanceType === 'tpt' || meta.root.inheritance === 'tpt';

    if (hasInheritance) {
      throw new MetadataError(
        `Entity ${meta.className} has invalid partitionBy option: combining partitioning with inheritance is not supported`,
      );
    }

    this.validatePartitionKeyConstraints(meta);

    if (meta.partitionBy.type === 'hash') {
      const { partitions } = meta.partitionBy;

      if (Array.isArray(partitions)) {
        if (partitions.length === 0) {
          throw new MetadataError(
            `Entity ${meta.className} has invalid partitionBy option: hash partition name list must not be empty`,
          );
        }

        const blank = partitions.find(name => typeof name !== 'string' || !name.trim());

        if (blank !== undefined) {
          throw new MetadataError(
            `Entity ${meta.className} has invalid partitionBy option: hash partition names must be non-empty strings`,
          );
        }

        const ambiguous = partitions.find(name => !this.hasValidPartitionName(name));

        if (ambiguous) {
          throw new MetadataError(
            `Entity ${meta.className} has invalid partitionBy option: partition name '${ambiguous}' contains more than one '.' — use at most one '.' to separate schema from table`,
          );
        }

        const duplicate = this.findDuplicatePartitionName(partitions as string[]);

        if (duplicate !== undefined) {
          throw new MetadataError(
            `Entity ${meta.className} has invalid partitionBy option: duplicate hash partition name '${duplicate}'`,
          );
        }

        return;
      }

      if (typeof partitions !== 'number' || !Number.isInteger(partitions) || partitions < 1) {
        throw new MetadataError(
          `Entity ${meta.className} has invalid partitionBy option: hash partition count must be a positive integer`,
        );
      }

      return;
    }

    if (!Array.isArray(meta.partitionBy.partitions) || meta.partitionBy.partitions.length === 0) {
      throw new MetadataError(
        `Entity ${meta.className} has invalid partitionBy option: list/range partitions must be a non-empty array`,
      );
    }

    if (meta.partitionBy.partitions.some(partition => !partition.values?.trim())) {
      throw new MetadataError(
        `Entity ${meta.className} has invalid partitionBy option: every partition must define values`,
      );
    }

    const ambiguousName = meta.partitionBy.partitions.find(
      partition => partition.name != null && !this.hasValidPartitionName(partition.name),
    );

    if (ambiguousName) {
      throw new MetadataError(
        `Entity ${meta.className} has invalid partitionBy option: partition name '${ambiguousName.name}' contains more than one '.' — use at most one '.' to separate schema from table`,
      );
    }

    // Include auto-generated default names (`${tableName}_${index}`, matching
    // `createExplicitPartitions` in the sql package) so an explicit name that collides with
    // an unnamed peer's default is caught here rather than at DDL execution time.
    const resolvedNames = meta.partitionBy.partitions.map(
      (partition, index) => partition.name ?? `${meta.tableName}_${index}`,
    );
    const duplicate = this.findDuplicatePartitionName(resolvedNames);

    if (duplicate !== undefined) {
      throw new MetadataError(
        `Entity ${meta.className} has invalid partitionBy option: duplicate partition name '${duplicate}'`,
      );
    }
  }

  /**
   * Find the first partition name whose normalized form (case-folded for unquoted segments,
   * quoted segments preserved) has already been seen. Returns the offending name in its
   * original form for the error message.
   */
  private findDuplicatePartitionName(names: string[]): string | undefined {
    const seen = new Set<string>();

    for (const name of names) {
      const normalized = normalizePartitionNameForComparison(name);

      if (seen.has(normalized)) {
        return name;
      }

      seen.add(normalized);
    }

    return undefined;
  }

  /**
   * Partition names may be bare (`child`), schema-qualified (`schema.child`), or use quoted
   * identifiers (`"my.schema"."child"`). Reject anything with more than one unquoted `.`.
   */
  private hasValidPartitionName(name: string): boolean {
    let depth = 0;
    let dots = 0;

    for (let i = 0; i < name.length; i++) {
      const ch = name[i];

      if (ch === '"') {
        if (name[i + 1] === '"') {
          i++;
          continue;
        }

        depth = depth === 0 ? 1 : 0;
        continue;
      }

      if (ch === '.' && depth === 0) {
        dots++;
      }
    }

    return dots <= 1;
  }

  private hasPartitionExpression(expression: PartitionExpression | undefined): boolean {
    if (expression == null) {
      return false;
    }

    if (typeof expression === 'function') {
      return true;
    }

    if (Array.isArray(expression)) {
      return expression.length > 0 && expression.every(key => typeof key === 'string' && key.trim().length > 0);
    }

    return String(expression).trim().length > 0;
  }

  private validatePartitionKeyConstraints(meta: EntityMetadata): void {
    const partitionFields = this.getPartitionKeyFields(meta);

    if (!partitionFields?.length) {
      return;
    }

    const primaryKeyFields = meta.root.getPrimaryProps().flatMap(prop => prop.fieldNames);

    if (partitionFields.some(field => !primaryKeyFields.includes(field))) {
      throw new MetadataError(
        `Entity ${meta.className} has invalid partitionBy option: primary key must include partition key columns '${partitionFields.join("', '")}'`,
      );
    }

    for (const prop of Object.values(meta.root.properties)) {
      if (!prop.unique || !prop.fieldNames?.length) {
        continue;
      }

      if (partitionFields.some(field => !prop.fieldNames!.includes(field))) {
        throw new MetadataError(
          `Entity ${meta.root.className} has invalid partitionBy option: unique property ${meta.root.className}.${prop.name} must include partition key columns '${partitionFields.join("', '")}'`,
        );
      }
    }

    for (const unique of meta.root.uniques ?? []) {
      const fields = this.getConstraintFields(meta.root, unique.properties);

      if (!fields?.length) {
        continue;
      }

      if (partitionFields.some(field => !fields.includes(field))) {
        const constraint = unique.name ? `unique constraint '${unique.name}'` : 'unique constraint';
        throw new MetadataError(
          `Entity ${meta.root.className} has invalid partitionBy option: ${constraint} must include partition key columns '${partitionFields.join("', '")}'`,
        );
      }
    }
  }

  /**
   * Returns the list of physical field names that a partition expression references, or
   * `undefined` when the expression is opaque (callback, or raw SQL like `date_trunc('day', x)`
   * that we cannot statically parse). Opaque expressions intentionally bypass the primary-key /
   * unique-constraint coverage checks — users are trusted to ensure the referenced columns are
   * part of the partition key, since PostgreSQL will surface the violation at DDL execution.
   */
  private getPartitionKeyFields(meta: EntityMetadata): string[] | undefined {
    const expression = meta.partitionBy?.expression;

    if (!expression || typeof expression === 'function') {
      return undefined;
    }

    if (Array.isArray(expression)) {
      return expression.map(key => this.resolvePartitionKeyField(meta, key));
    }

    const keys = splitCommaSeparatedIdentifiers(String(expression).trim());

    if (!keys) {
      return undefined;
    }

    return keys.map(key => this.resolvePartitionKeyField(meta, key));
  }

  private resolvePartitionKeyField(meta: EntityMetadata, key: string): string {
    const trimmed = key.trim().replaceAll('"', '');

    if (!trimmed) {
      throw new MetadataError(`Entity ${meta.className} has invalid partitionBy option: empty partition key`);
    }

    const prop =
      meta.root.properties[trimmed] ??
      Object.values(meta.root.properties).find(
        candidate => candidate.fieldNames?.length === 1 && candidate.fieldNames[0] === trimmed,
      );

    if (!prop) {
      throw new MetadataError(
        `Entity ${meta.className} has invalid partitionBy option: unknown partition key '${key.trim()}'`,
      );
    }

    if (prop.fieldNames?.length !== 1) {
      throw new MetadataError(
        `Entity ${meta.className} has invalid partitionBy option: partition key '${key.trim()}' maps to multiple columns ('${prop.fieldNames?.join("', '")}'); list them explicitly as partition keys`,
      );
    }

    return prop.fieldNames[0];
  }

  private getConstraintFields(meta: EntityMetadata, properties?: string | string[]): string[] | undefined {
    if (!properties) {
      return undefined;
    }

    const fields = Utils.asArray(properties).flatMap(propName => {
      const prop = meta.root.properties[propName];
      return prop?.fieldNames ?? [];
    });

    return fields.length > 0 ? fields : undefined;
  }

  private validateReference(meta: EntityMetadata, prop: EntityProperty, options: MetadataDiscoveryOptions): void {
    // references do have types
    if (!prop.type) {
      throw MetadataError.fromWrongTypeDefinition(meta, prop);
    }

    // Polymorphic relations have multiple targets, validate PK compatibility
    if (prop.polymorphic && prop.polymorphTargets) {
      this.validatePolymorphicTargets(meta, prop);
      return;
    }

    const targetMeta = prop.targetMeta;

    // references do have type of known entity
    if (!targetMeta) {
      throw MetadataError.fromWrongTypeDefinition(meta, prop);
    }

    if (targetMeta.abstract && !targetMeta.root?.inheritanceType && !targetMeta.embeddable) {
      throw MetadataError.targetIsAbstract(meta, prop);
    }

    if (
      [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) &&
      prop.persist === false &&
      targetMeta.compositePK &&
      options.checkNonPersistentCompositeProps
    ) {
      throw MetadataError.nonPersistentCompositeProp(meta, prop);
    }

    this.validateTargetKey(meta, prop, targetMeta);
  }

  private validateTargetKey(meta: EntityMetadata, prop: EntityProperty, targetMeta: EntityMetadata): void {
    if (!prop.targetKey) {
      return;
    }

    // targetKey is not supported for ManyToMany relations
    if (prop.kind === ReferenceKind.MANY_TO_MANY) {
      throw MetadataError.targetKeyOnManyToMany(meta, prop);
    }

    // targetKey must point to an existing property
    const targetProp = targetMeta.properties[prop.targetKey];

    if (!targetProp) {
      throw MetadataError.targetKeyNotFound(meta, prop);
    }

    // targetKey must point to a unique property (composite unique is not sufficient)
    if (!this.isPropertyUnique(targetProp, targetMeta)) {
      throw MetadataError.targetKeyNotUnique(meta, prop);
    }
  }

  /**
   * Checks if a property has a unique constraint (either via `unique: true` or single-property `@Unique` decorator).
   * Composite unique constraints are not sufficient for targetKey.
   */
  private isPropertyUnique(prop: EntityProperty, meta: EntityMetadata): boolean {
    if (prop.unique || (prop.primary && meta.primaryKeys.length === 1)) {
      return true;
    }

    // Check for single-property unique constraint via @Unique decorator
    return !!meta.uniques?.some(u => {
      const props = Utils.asArray(u.properties);
      return props.length === 1 && props[0] === prop.name && !u.options;
    });
  }

  private validatePolymorphicTargets(meta: EntityMetadata, prop: EntityProperty): void {
    const targets = prop.polymorphTargets!;

    // Union-target M:N stores one scalar target FK per pivot row, so composite-PK targets
    // can't round-trip through this schema.
    if (prop.kind === ReferenceKind.MANY_TO_MANY && targets.length > 1) {
      for (const target of targets) {
        if (target.compositePK) {
          throw MetadataError.incompatiblePolymorphicTargets(
            meta,
            prop,
            targets[0],
            target,
            `${target.className} has a composite primary key; union-target polymorphic M:N does not support composite-PK targets.`,
          );
        }
      }
    }

    // Validate targetKey exists and is compatible across all targets
    if (prop.targetKey) {
      for (const target of targets) {
        const targetProp = target.properties[prop.targetKey];

        if (!targetProp) {
          throw MetadataError.targetKeyNotFound(meta, prop, target);
        }

        // targetKey must point to a unique property (composite unique is not sufficient)
        if (!this.isPropertyUnique(targetProp, target)) {
          throw MetadataError.targetKeyNotUnique(meta, prop, target);
        }
      }
    }

    const firstPKs = targets[0].getPrimaryProps();

    for (let i = 1; i < targets.length; i++) {
      const target = targets[i];
      const targetPKs = target.getPrimaryProps();

      if (targetPKs.length !== firstPKs.length) {
        throw MetadataError.incompatiblePolymorphicTargets(
          meta,
          prop,
          targets[0],
          target,
          'different number of primary keys',
        );
      }

      for (let j = 0; j < firstPKs.length; j++) {
        const firstPK = firstPKs[j];
        const targetPK = targetPKs[j];

        if (firstPK.runtimeType !== targetPK.runtimeType) {
          throw MetadataError.incompatiblePolymorphicTargets(
            meta,
            prop,
            targets[0],
            target,
            `incompatible primary key types: ${firstPK.name} (${firstPK.runtimeType}) vs ${targetPK.name} (${targetPK.runtimeType})`,
          );
        }
      }
    }
  }

  private validateBidirectional(meta: EntityMetadata, prop: EntityProperty): void {
    if (prop.inversedBy) {
      this.validateOwningSide(meta, prop);
    } else if (prop.mappedBy) {
      this.validateInverseSide(meta, prop);
    } else if (prop.kind === ReferenceKind.ONE_TO_MANY && !prop.mappedBy) {
      // 1:m property has `mappedBy`
      throw MetadataError.fromMissingOption(meta, prop, 'mappedBy');
    }
  }

  private validateOwningSide(meta: EntityMetadata, prop: EntityProperty): void {
    // For polymorphic relations, inversedBy may point to multiple entity types
    if (prop.polymorphic && prop.polymorphTargets?.length) {
      // For polymorphic relations, validate inversedBy against each target
      // The inverse property should exist on the target entities and reference back to this property
      for (const targetMeta of prop.polymorphTargets) {
        const inverse = targetMeta.properties[prop.inversedBy];

        // The inverse property is optional - some targets may not have it
        if (!inverse) {
          continue;
        }

        // Validate the inverse property
        if (inverse.targetMeta?.root.class !== meta.root.class) {
          throw MetadataError.fromWrongReference(meta, prop, 'inversedBy', inverse);
        }

        // inverse side is not defined as owner
        if (inverse.inversedBy || inverse.owner) {
          throw MetadataError.fromWrongOwnership(meta, prop, 'inversedBy');
        }
      }
      return;
    }

    const inverse = prop.targetMeta!.properties[prop.inversedBy];

    // has correct `inversedBy` on owning side
    if (!inverse) {
      throw MetadataError.fromWrongReference(meta, prop, 'inversedBy');
    }

    const targetClass = inverse.targetMeta?.root.class;

    // has correct `inversedBy` reference type
    if (inverse.type !== meta.className && targetClass !== meta.root.class) {
      throw MetadataError.fromWrongReference(meta, prop, 'inversedBy', inverse);
    }

    // inverse side is not defined as owner
    if (inverse.inversedBy || inverse.owner) {
      throw MetadataError.fromWrongOwnership(meta, prop, 'inversedBy');
    }
  }

  private validateInverseSide(meta: EntityMetadata, prop: EntityProperty): void {
    const owner = prop.targetMeta!.properties[prop.mappedBy];

    // has correct `mappedBy` on inverse side
    if (prop.mappedBy && !owner) {
      throw MetadataError.fromWrongReference(meta, prop, 'mappedBy');
    }

    // has correct `mappedBy` reference type
    // For polymorphic relations, check if this entity is one of the polymorphic targets
    const isValidPolymorphicInverse =
      owner.polymorphic && owner.polymorphTargets?.some(target => target.class === meta.root.class);
    if (
      !isValidPolymorphicInverse &&
      owner.type !== meta.className &&
      owner.targetMeta?.root.class !== meta.root.class
    ) {
      throw MetadataError.fromWrongReference(meta, prop, 'mappedBy', owner);
    }

    // owning side is not defined as inverse
    if (owner.mappedBy) {
      throw MetadataError.fromWrongOwnership(meta, prop, 'mappedBy');
    }

    // owning side is not defined as inverse
    const valid = [
      { owner: ReferenceKind.MANY_TO_ONE, inverse: ReferenceKind.ONE_TO_MANY },
      { owner: ReferenceKind.MANY_TO_MANY, inverse: ReferenceKind.MANY_TO_MANY },
      { owner: ReferenceKind.ONE_TO_ONE, inverse: ReferenceKind.ONE_TO_ONE },
    ];

    if (!valid.find(spec => spec.owner === owner.kind && spec.inverse === prop.kind)) {
      throw MetadataError.fromWrongReferenceKind(meta, owner, prop);
    }

    if (prop.primary) {
      throw MetadataError.fromInversideSidePrimary(meta, owner, prop);
    }
  }

  private validateIndexes(
    meta: EntityMetadata,
    indexes: { properties?: string | string[] }[],
    type: 'index' | 'unique',
  ): void {
    for (const index of indexes) {
      for (const propName of Utils.asArray(index.properties)) {
        const prop = meta.properties[propName] ?? meta.root.properties[propName];

        if (
          !prop &&
          !Object.values(meta.properties).some(p => propName.startsWith(p.name + '.')) &&
          !Object.values(meta.root.properties).some(p => propName.startsWith(p.name + '.'))
        ) {
          throw MetadataError.unknownIndexProperty(meta, propName, type);
        }
      }
    }
  }

  private validateDuplicateFieldNames(meta: EntityMetadata, options: MetadataDiscoveryOptions): void {
    const candidates = Object.values(meta.properties)
      .filter(
        prop =>
          prop.persist !== false &&
          !prop.inherited &&
          prop.fieldNames?.length === 1 &&
          (prop.kind !== ReferenceKind.EMBEDDED || prop.object),
      )
      .map(prop => prop.fieldNames[0]);
    const duplicates = Utils.findDuplicates(candidates);

    if (duplicates.length > 0 && options.checkDuplicateFieldNames) {
      const pairs = duplicates.flatMap(name => {
        return Object.values(meta.properties)
          .filter(p => p.fieldNames?.[0] === name)
          .map(prop => {
            return [prop.embedded ? prop.embedded.join('.') : prop.name, prop.fieldNames[0]] as [string, string];
          });
      });

      throw MetadataError.duplicateFieldName(meta.class, pairs);
    }
  }

  private validateVersionField(meta: EntityMetadata): void {
    if (!meta.versionProperty) {
      return;
    }

    const props = Object.values(meta.properties).filter(p => p.version);

    if (props.length > 1) {
      throw MetadataError.multipleVersionFields(
        meta,
        props.map(p => p.name),
      );
    }

    const prop = meta.properties[meta.versionProperty];
    const type = prop.runtimeType ?? prop.columnTypes?.[0] ?? prop.type;

    if (type !== 'number' && type !== 'Date' && !type.startsWith('timestamp') && !type.startsWith('datetime')) {
      throw MetadataError.invalidVersionFieldType(meta);
    }
  }

  /**
   * Validates that entity properties do not use dangerous names that could lead to
   * prototype pollution vulnerabilities. This validation ensures that property names
   * cannot be exploited to modify object prototypes when values are assigned during
   * entity hydration or persistence operations.
   *
   * @internal
   */
  private validatePropertyNames(meta: EntityMetadata): void {
    for (const prop of Utils.values(meta.properties)) {
      if (DANGEROUS_PROPERTY_NAMES.includes(prop.name as any)) {
        throw MetadataError.dangerousPropertyName(meta, prop);
      }
    }
  }

  /**
   * Validates view entity configuration.
   * View entities must have an expression.
   */
  private validateViewEntity(meta: EntityMetadata): void {
    // View entities must have an expression
    if (!meta.expression) {
      throw MetadataError.viewEntityWithoutExpression(meta);
    }

    // Views are not partitionable - reject explicitly instead of silently ignoring
    if (meta.partitionBy) {
      throw new MetadataError(`View entity ${meta.className} cannot define partitionBy`);
    }

    // Validate indexes if present
    this.validateIndexes(meta, meta.indexes ?? [], 'index');
    this.validateIndexes(meta, meta.uniques ?? [], 'unique');

    // Validate property names
    this.validatePropertyNames(meta);
  }

  /**
   * Validates that STI and TPT are not mixed in the same inheritance hierarchy.
   * An entity hierarchy can use either STI (discriminatorColumn) or TPT (inheritance: 'tpt'),
   * but not both.
   *
   * Note: This validation runs before `initTablePerTypeInheritance` sets `inheritanceType`,
   * so we check the raw `inheritance` option from the decorator/schema.
   */
  private validateInheritanceStrategies(discovered: EntityMetadata[]): void {
    const checkedRoots = new Set<EntityMetadata>();

    for (const meta of discovered) {
      if (meta.embeddable) {
        continue;
      }

      const root = meta.root;

      if (checkedRoots.has(root)) {
        continue;
      }

      checkedRoots.add(root);

      const hasSTI = !!root.discriminatorColumn;
      const hasTPT = root.inheritanceType === 'tpt' || (root as any).inheritance === 'tpt';

      if (hasSTI && hasTPT) {
        throw MetadataError.mixedInheritanceStrategies(root, meta);
      }
    }
  }
}
