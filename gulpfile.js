var gulp = require('gulp');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var browserify = require('browserify');
var plugins = require('gulp-load-plugins')();


var bundler = watchify(browserify('./public/js/index.js', watchify.args)
  .transform('babelify', {presets: ['es2015', 'react']}));
bundler.on('update', bundle);
bundler.on('log', plugins.util.log);


function bundle() {
  return bundler.bundle()
    // log errors
    .on('error', plugins.util.log.bind(plugins.util, 'Browserify Error'))
    .pipe(source('index.js'))
    // build sourcemaps
    .pipe(require('vinyl-buffer')())
    .pipe(plugins.sourcemaps.init({loadMaps: true})) // loads map from browserify file
    .pipe(plugins.sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest('./public/dest'))
    .pipe(plugins.livereload());
}


gulp.task('scss:lint', function() {
  gulp.src('./public/scss/**/*.scss')
    .pipe(plugins.sassLint())
    .pipe(plugins.sassLint.format())
    .pipe(plugins.sassLint.failOnError());
});


gulp.task('scss:compileDev', function() {
  gulp.src('./public/scss/**/*.scss')
    //build sourcemaps
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass({errLogToConsole: true}))
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest('./public/css'))
    .pipe(plugins.livereload());
});


gulp.task('scss:compile', ['fonts:copy'], function() {
  gulp.src('./public/scss/**/*.scss')
    .pipe(plugins.sass({errLogToConsole: true}))
    .pipe(gulp.dest('./public/css'));
});


gulp.task('css:minify', ['scss:compile'], function() {
  gulp.src('./public/css/*.css')
    .pipe(plugins.cleanCss())
    .pipe(gulp.dest('./public/css'));
});


gulp.task('js:develop', function() {
  bundle();
});


gulp.task('js:compress', function() {
  var bundleStream = browserify('./public/js/index.js')
    .transform('babelify', {presets: ['es2015', 'react']})
    .bundle();

  bundleStream
    .pipe(source('index.js'))
    .pipe(plugins.streamify(plugins.uglify()))
    .pipe(require('vinyl-buffer')())
    .pipe(plugins.sourcemaps.init({loadMaps: true}))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest('./public/dest'));
});


gulp.task('scss:develop', ['scss:lint', 'scss:compileDev']);


gulp.task('fonts:copy', function() {
  gulp.src(['./node_modules/font-awesome/fonts/*', './node_modules/bootstrap-sass/assets/fonts/bootstrap/*'])
    .pipe(gulp.dest('./public/dest/fonts'));
});


gulp.task('css:copy', function() {
  gulp.src('./node_modules/mapbox.js/theme/**/*')
    .pipe(gulp.dest('./public/css/mapbox'));
});


gulp.task('develop', function() {
  plugins.livereload.listen();

  require('nodemon')({
    script: 'bin/www',
    stdout: true
  }).on('readable', function() {
    this.stdout.on('data', function(chunk) {
      if (/^listening/.test(chunk)) {
        plugins.livereload.reload();
      }
      process.stdout.write(chunk);
    });
  });

  gulp.watch('public/**/*.scss', ['scss:develop']);

  gulp.watch('public/**/!(dest)/**/*.+(jsx|js)', ['js:develop']);
});


gulp.task('build', [
  'fonts:copy',
  'css:copy',
  'css:minify',
  'js:compress'
]);
