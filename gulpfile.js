'use strict'

var gulp = require('gulp');
var bump = require('gulp-bump')
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var changed = require('gulp-changed');
var runSequence = require('run-sequence');
var compilerOptions = {
  moduleIds: false,
  comments: false,
  compact: false,
	sourceMap: true,
  presets: [ "babel-preset-es2015-node5", "stage-0"],
  plugins: []
};

gulp.task('build-js', function() {
  return gulp.src("src/*.js")
	.pipe(sourcemaps.init({loadMaps: true}))
	.pipe(babel(compilerOptions))
	.pipe(sourcemaps.write({includeContent: true}))
	.pipe(gulp.dest("./dist"));
});

gulp.task('bump-version', function() {
  return gulp.src('./package.json')
  .pipe(bump({type: 'patch'}))
  .pipe(gulp.dest('./'));

})
 gulp.task('build', function(callback) {
  return runSequence(
	['build-js'],
	callback
  )});
