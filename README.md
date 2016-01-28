[![NPM version][npm-image]][npm-url]

A gulp task for compiling a package which has local dependencies installed via [jspm-local](https://github.com/Netatwork-de/jspm-local).

Together with [gulp-jspm-local](https://github.com/Netatwork-de/gulp-jspm-local) this can be used to compile the current package and all dependencies.

It runs 'npm install' and, when needed 'jspm install' and 'gulp build' on each dependency.

## Installation

Install `gulp-compile-dependencies` using npm into your local repository.

```bash
npm install gulp-compile-dependencies --save-dev
```
## Usage

Setup a gulp task `compile-dependencies` using this code:

```js
'use strict'

let gulp = require('gulp');
let dependencies = require('gulp-compile-dependencies')
let tools = require('gulp-jspm-local');
let runSequence = require('run-sequence');

gulp.task('compile-solution', () =>
	dependencies.buildDependencies()
		.then(() => tools.updateLocalDependencies())
		.then(() => dependencies.executeJspm())
		.then(() => runSequence("export")));
```


## License

[Apache 2.0](/LICENSE)

[npm-url]: https://npmjs.org/package/gulp-compile-dependencies
[npm-image]: http://img.shields.io/npm/v/gulp-compile-dependencies.svg
