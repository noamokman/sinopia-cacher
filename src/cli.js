import program from 'commander';
import pkg, {version} from './../package.json';
import updateNotifier from 'update-notifier';
import sinopiaCacher from './';

const notifier = updateNotifier({pkg});

program.version(version)
  .description('Cache a given node module to the given path')
  .arguments('<packages...>')
  .option('-p, --path <path>', 'The path to store the cached modules')
  .action(packages => {
    if (!program.path) {
      program.path = process.cwd();
    }

    notifier.notify();

    sinopiaCacher({path: program.path, packages})
      .then(() => {
        console.log('All done!');
      })
      .catch(err => console.error(err));
  });

/**
 * Handle cli arguments
 *
 * @param {string[]} argv - string array of the arguments
 */
module.exports = argv => {
  program.parse(argv);

  if (!program.args.length) {
    program.outputHelp();
  }
};