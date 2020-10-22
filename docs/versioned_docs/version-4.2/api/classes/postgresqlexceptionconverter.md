---
id: "postgresqlexceptionconverter"
title: "Class: PostgreSqlExceptionConverter"
sidebar_label: "PostgreSqlExceptionConverter"
---

## Hierarchy

* ExceptionConverter

  ↳ **PostgreSqlExceptionConverter**

## Methods

### convertException

▸ **convertException**(`exception`: [Error](driverexception.md#error) & [Dictionary](../index.md#dictionary)): DriverException

*Overrides void*

*Defined in [packages/postgresql/src/PostgreSqlExceptionConverter.ts:14](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/postgresql/src/PostgreSqlExceptionConverter.ts#L14)*

**`link`** http://www.postgresql.org/docs/9.4/static/errcodes-appendix.html

**`link`** https://github.com/doctrine/dbal/blob/master/src/Driver/AbstractPostgreSQLDriver.php

#### Parameters:

Name | Type |
------ | ------ |
`exception` | [Error](driverexception.md#error) & [Dictionary](../index.md#dictionary) |

**Returns:** DriverException
