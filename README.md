# sinopia-cacher

[![Greenkeeper badge](https://badges.greenkeeper.io/noamokman/sinopia-cacher.svg)](https://greenkeeper.io/)

A cacher for sinopia

# Usage
## Download
```sh
git clone https://github.com/noamokman/sinopia-cacher.git
cd sinopia-cacher
npm install
```
## Run
#### option 1 - interactive
```sh
node index.js
```
#### option 2 - non-interactive
package names are seperated by a space
```sh
node index.js my-awesome-package another-awesome-package ...
```
## Output
all cached packages are saved to a local directory named `export`

## Remarks
* The script is finished only when you see the text `all done!`
* The script can run multiple times and it will accumulate the cached packages
* It is recommended to cache a small amount of packages at a time
