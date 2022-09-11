#!/usr/bin/env node --loader ts-node/esm

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('yargonaut')
  .style('blue')
  .style('yellow', 'required')
  .helpStyle('green')
  .errorsStyle('red');

import { CLIHelper } from './CLIHelper';
import { CLIConfigurator } from './CLIConfigurator';

(async () => {
  const args = (await CLIConfigurator.configure()).parse(process.argv.slice(2)) as { _: string[] };

  if (args._.length === 0) {
    CLIHelper.showHelp();
  }
})();
