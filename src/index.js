import npm from 'npm';
import verdaccio from 'verdaccio';
import pify from 'pify';
import fs from 'fs';
import tmp from 'tmp-promise';
import rimrafModule from 'rimraf';
import mkdirpModule from 'mkdirp';
const mkdirp = pify(mkdirpModule);
const rimraf = pify(rimrafModule);

const installShit = ({path, packages}) => {
  return pify(fs.writeFile)(`${path}\\lol.txt`, packages);
};

export default ({path, packages}) => {
  return tmp.dir({unsafeCleanup: true})
    .then(({path: tmpPath}) => {
      return installShit({packages, path: tmpPath});
    })
    .then();

  return tmp.dir()
    .then(() => mkdirp(paths.storage))
    .then(() => new Promise((resolve, reject) => {
      server = sinopia({
        storage: paths.storage,
        uplinks: {
          npmjs: {
            url: 'http://registry.npmjs.org/'
          }
        },
        packages: {
          '*': {
            allow_access: '$all',
            allow_publish: '$all',
            proxy: 'npmjs'
          }
        },
        self_path: paths.temp
      })
        .listen(4873, 'localhost', err => {
          if (err) {
            return reject(err);
          }

          resolve();
        });
    }))
    .then(() => pify(npm.load.bind(npm))({registry: 'http://localhost:4873/'}))
    .then(() => {
      npm.on('log', message => console.log(message));
    })
    .then(reinstallReq)
    .then(() => {
      if (server) {
        server.close();
        server = null;
      }
    })
    .then(() => mkdirp(paths.export))
    .then(() => pify(ncp)(paths.storage, paths.export))
    .then(() => rimraf(paths.temp))
    .then(() => console.log('all done!'))
    .catch(err => console.error(err))
    .then(() => {
      if (server) {
        server.close();
      }

      process.exit();
    });
};