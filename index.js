const npm = require('npm');
const sinopia = require('sinopia');
const path = require('path');
const pify = require('pify');
const rimraf = pify(require('rimraf'));
const mkdirp = pify(require('mkdirp'));
const _ = require('lodash');
const fs = pify(require('fs'));
const inquirer = require("inquirer");
const ncp = require('ncp').ncp;

ncp.limit = 16;

var server;

const paths = {
  temp: '.tmp',
  storage: '.tmp/storage',
  export: 'export/storage'
};

var packagesToInstall = [];
var packagesAlreadyInstalled = [];

function getFolderPackages() {
  return fs.readdir(paths.storage)
    .then(files => _.without(files, '.sinopia-db.json'));
}

function reinstallReq() {
  if (packagesToInstall.length == 0) {
    return Promise.resolve();
  }

  return pify(npm.commands.install.bind(npm.commands))(paths.temp, packagesToInstall)
    .then(function () {
      packagesAlreadyInstalled = packagesAlreadyInstalled.concat(packagesToInstall);

      return getFolderPackages();
    }, err => console.log(err))
    .then(function (folderPackages) {
      packagesToInstall = _.difference(folderPackages, packagesAlreadyInstalled);

      return reinstallReq();
    });
}

function megaFunction() {
  return rimraf(path.resolve(process.env.APPDATA, "npm-cache"))
    .then(() => rimraf(paths.temp))
    .then(() => mkdirp(paths.storage))
    .then(() => new Promise((resolve, reject) => {
      server = sinopia({
        storage: paths.storage,
        "uplinks": {
          "npmjs": {
            "url": "http://registry.npmjs.org/"
          }
        },
        "packages": {
          "*": {
            "allow_access": "$all",
            "allow_publish": "$all",
            "proxy": "npmjs"
          }
        },
        self_path: paths.temp
      })
        .listen(4873, 'localhost', err=> {
          if (err) {
            return reject(err);
          }

          resolve();
        });
    }))
    .then(() => pify(npm.load.bind(npm))({registry: "http://localhost:4873/"}))
    .then(() => {
      npm.on("log", message => console.log(message));
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
    .then(function () {
      if (server) {
        server.close();
      }

      process.exit();
    });
}

function askPackage() {
  return inquirer.prompt([
    {
      type: "input",
      name: "package",
      message: "What is the name of the package you want to cache?"
    },
    {
      type: "confirm",
      name: "askAgain",
      message: "Want to enter another package (just hit enter for YES)?",
      default: true
    }
  ])
    .then(answers => {
      packagesToInstall.push(answers.package);

      if (answers.askAgain) {
        return askPackage();
      }
    });
}

if (process.argv.length > 2) {
  packagesToInstall = process.argv.slice(2);
  console.log('Going to cache these packages: ' + packagesToInstall.join(', '));

  megaFunction();
  return;
}

askPackage()
  .then(function () {
    console.log('Going to cache these packages: ' + packagesToInstall.join(', '));

    return inquirer.prompt([{
      type: "confirm",
      name: "confirm",
      message: "Is this OK (just hit enter for YES)?",
      default: true
    }])
      .then(answers => {
        if (answers.confirm) {
          return megaFunction();
        }
      });
  });
