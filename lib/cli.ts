import yargs from 'yargs';
import { CLIHelper } from './cli/CLIHelper';

require('yargonaut')
  .style('blue')
  .style('yellow', 'required')
  .helpStyle('green')
  .errorsStyle('red');

const args = CLIHelper.configure().parse(process.argv.slice(2)) as { _: string[] };

if (args._.length === 0) {
  yargs.showHelp();
}
