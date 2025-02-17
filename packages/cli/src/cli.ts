#!/usr/bin/env node

import { CLIHelper } from './CLIHelper.js';
import { CLIConfigurator } from './CLIConfigurator.js';

const argv = await CLIConfigurator.configure();
const args = await argv.parse(process.argv.slice(2));

if (args._.length === 0) {
  CLIHelper.showHelp();
}
