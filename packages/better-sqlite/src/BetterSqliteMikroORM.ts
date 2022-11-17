import { defineConfig, MikroORM } from '@mikro-orm/core';
import type { Options } from '@mikro-orm/core';
import { BetterSqliteDriver } from './BetterSqliteDriver';

/**
 * @inheritDoc
 */
export class BetterSqliteMikroORM extends MikroORM<BetterSqliteDriver> {
	private static DRIVER = BetterSqliteDriver;
}

export type BetterSqliteOptions = Options<BetterSqliteDriver>;

/* istanbul ignore next */
export function defineBetterSqliteConfig(options: BetterSqliteOptions) {
	return defineConfig({ driver: BetterSqliteDriver, ...options });
}
