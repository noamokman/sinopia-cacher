var npm = require('npm');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var sinopia = require('sinopia');
var path = require('path');
var Q = require('q');
var _ = require('lodash');
var fs = require('fs');
var inquirer = require("inquirer");
var mv = require('mv');

var server;

var paths = {
  temp: '.tmp',
  storage: '.tmp/storage',
  export: 'export/storage'
};

var packagesToInstall = [];
var packagesAlreadyInstalled = [];

function getFolderPackages() {
  return Q.nfcall(fs.readdir, paths.storage)
    .then(function (files) {
      return _.without(files, '.sinopia-db.json');
    });
}

function reinstallReq() {
  if (packagesToInstall.length == 0) {
    return Q();
  }

  return Q.ninvoke(npm.commands, 'install', paths.temp, packagesToInstall)
    .then(function () {
      packagesAlreadyInstalled = packagesAlreadyInstalled.concat(packagesToInstall);

      return getFolderPackages();
    })
    .then(function (folderPackages) {
      packagesToInstall = _.difference(folderPackages, packagesAlreadyInstalled);

      return reinstallReq();
    });
}

function megaFunction() {
  return Q.nfcall(rimraf, path.resolve(process.env.APPDATA, "npm-cache"))
    .then(function () {
      return Q.nfcall(mkdirp, paths.temp);
    })
    .then(function () {
      var deferred = Q.defer();

      server = sinopia({
        storage: paths.storage,
        "uplinks": {
          "npmjs": {
            "url": "https://registry.npmjs.org/"
          }
        },
        "packages": {
          "*": {
            "allow_access": "$all",
            "allow_publish": "$all",
            "proxy": "npmjs"
          }
        }
      })
        .listen(4873, 'localhost', deferred.makeNodeResolver());

      return deferred.promise;
    })
    .then(function () {
      return Q.ninvoke(npm, 'load', {registry: "http://localhost:4873/"});
    })
    .then(function () {
      npm.on("log", function (message) {
        console.log(message);
      });
    })
    .then(reinstallReq)
    .then(function () {
      if (server) {
        server.close();
        server = null;
      }
    })
    .then(function () {
      return Q.nfcall(mv, paths.storage , paths.export, {mkdirp: true});
    })
    .then(function () {
      return Q.nfcall(rimraf, paths.temp);
    })
    .then(function () {
      console.log('all done!');
    })
    .catch(function (err) {
      console.error(err);
    })
    .finally(function () {
      if (server) {
        server.close();
      }
    });
}

function askPackage() {
  var deferred = Q.defer();

  inquirer.prompt([
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
  ], function (answers) {
    packagesToInstall.push(answers.package);

    if (answers.askAgain) {
      deferred.resolve(askPackage());
    } else {
      deferred.resolve();
    }
  });

  return deferred.promise;
}

askPackage()
  .then(function () {
    var deferred = Q.defer();

    console.log('Going to cache these packages: ' + packagesToInstall.join(', '));

    inquirer.prompt([{
      type: "confirm",
      name: "confirm",
      message: "Is this OK (just hit enter for YES)?",
      default: true
    }], function (answers) {
      if (answers.confirm) {
        deferred.resolve(megaFunction());
      } else {
        deferred.resolve();
      }
    });

    return deferred.promise;
  });