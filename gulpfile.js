'use strict'

let gulp = require('gulp');
let bump = require('gulp-bump')
let babel = require('gulp-babel');
let sourcemaps = require('gulp-sourcemaps');
let changed = require('gulp-changed');
let runSequence = require('run-sequence');
let compilerOptions = {
	moduleIds: false,
	comments: false,
	compact: false,
	sourceMap: true,
	presets: [ "babel-preset-es2015-node5", "stage-0"],
	plugins: []
};

gulp.task('build-js', () =>
	gulp.src("src/*.js")
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(babel(compilerOptions))
		.pipe(sourcemaps.write({includeContent: true}))
		.pipe(gulp.dest("./dist")));

gulp.task('bump-version', () =>
	gulp.src('./package.json')
		.pipe(bump({type: 'patch'}))
		.pipe(gulp.dest('./')));


gulp.task('build', callback => runSequence(['build-js'], callback));
