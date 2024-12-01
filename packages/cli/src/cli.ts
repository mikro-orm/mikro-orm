#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('@jercle/yargonaut')
  .style('blue')
  .style('yellow', 'required')
  .helpStyle('green')
  .errorsStyle('red');

import { CLIHelper } from './CLIHelper';
import { CLIConfigurator } from './CLIConfigurator';

void (async () => {
  const argv = CLIConfigurator.configure();
  const args = await argv.parse(process.argv.slice(2));

  if (args._.length === 0) {
    CLIHelper.showHelp();
  }
})();
