#!/usr/bin/env -S node --loader ts-node/esm --no-warnings

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('@jercle/yargonaut')
  .style('blue')
  .style('yellow', 'required')
  .helpStyle('green')
  .errorsStyle('red');

import { CLIConfigurator } from './CLIConfigurator';
import { CLIHelper } from './CLIHelper';

(async () => {
  const argv = await CLIConfigurator.configure();
  const args = await argv.parse(process.argv.slice(2)) as { _: string[] };

  if (args._.length === 0) {
    CLIHelper.showHelp();
  }
})();
