---
title: Query Builder API
---

`QueryBuilder` provides fluent interface with these methods:

```typescript
select(fields: Field<T> | Field<T>[], distinct?: boolean): QueryBuilder;
addSelect(fields: string | string[]): QueryBuilder;
insert(data: any): QueryBuilder;
update(data: any): QueryBuilder;
delete(cond?: QBFilterQuery): QueryBuilder;
truncate(): QueryBuilder;
count(field?: string | string[], distinct?: boolean): QueryBuilder;
join(field: string, alias: string, cond?: QBFilterQuery, type?: 'leftJoin' | 'innerJoin' | 'pivotJoin', path?: string): QueryBuilder;
leftJoin(field: string, alias: string, cond?: QBFilterQuery): QueryBuilder;
withSubQuery(subQuery: KnexQueryBuilder, alias: string): QueryBuilder;
where(cond: QBFilterQuery<T>, operator?: keyof typeof GroupOperator): QueryBuilder;
where(cond: string, params?: any[], operator?: keyof typeof GroupOperator): QueryBuilder;
andWhere(cond: QBFilterQuery<T>): QueryBuilder;
andWhere(cond: string, params?: any[]): QueryBuilder;
orWhere(cond: QBFilterQuery<T>): QueryBuilder;
orWhere(cond: string, params?: any[]): QueryBuilder;
orderBy(orderBy: QueryOrderMap): QueryBuilder;
groupBy(fields: (string | keyof T) | (string | keyof T)[]): QueryBuilder;
having(cond?: QBFilterQuery | string, params?: any[]): QueryBuilder;
raw(sql: string): Raw;
limit(limit?: number, offset?: number): QueryBuilder;
offset(offset?: number): QueryBuilder;
withSchema(schema?: string): QueryBuilder;
setLockMode(mode?: LockMode): QueryBuilder;
setFlag(flag: QueryFlag): QueryBuilder;
unsetFlag(flag: QueryFlag): QueryBuilder;
getKnexQuery(): KnexQueryBuilder;
getQuery(): string;
getParams(): readonly Value[];
getAliasForJoinPath(path: string): string | undefined;
getNextAlias(prefix?: string): string;
execute<U = any>(method?: 'all' | 'get' | 'run', mapResults?: boolean): Promise<U>;
getResult(): Promise<T[]>;
getResultList(): Promise<T[]>;
getSingleResult(): Promise<T | null>;
/**
 * Returns knex instance with sub-query aliased with given alias.
 * You can provide `EntityName.propName` as alias, then the field name will be used based on the metadata
 */
as(alias: string): KnexQueryBuilder;
clone(): QueryBuilder<T>;
getKnex(): KnexQueryBuilder;
```
