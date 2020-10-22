---
id: "mysqlexceptionconverter"
title: "Class: MySqlExceptionConverter"
sidebar_label: "MySqlExceptionConverter"
---

## Hierarchy

* ExceptionConverter

  ↳ **MySqlExceptionConverter**

## Methods

### convertException

▸ **convertException**(`exception`: [Error](driverexception.md#error) & [Dictionary](../index.md#dictionary)): DriverException

*Overrides void*

*Defined in [packages/mysql-base/src/MySqlExceptionConverter.ts:15](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/mysql-base/src/MySqlExceptionConverter.ts#L15)*

**`link`** http://dev.mysql.com/doc/refman/5.7/en/error-messages-client.html

**`link`** http://dev.mysql.com/doc/refman/5.7/en/error-messages-server.html

**`link`** https://github.com/doctrine/dbal/blob/master/src/Driver/AbstractMySQLDriver.php

#### Parameters:

Name | Type |
------ | ------ |
`exception` | [Error](driverexception.md#error) & [Dictionary](../index.md#dictionary) |

**Returns:** DriverException
