'use strict';

import gulp from 'gulp';

import autoprefixer from 'autoprefixer';
import browsersync from 'browser-sync';
import calc from 'postcss-calc';
import cleancss from 'gulp-clean-css';
import cssnano from 'gulp-cssnano';
import del from 'del';
import imagemin from 'gulp-imagemin';
import inject from 'gulp-inject';
import lost from 'lost';
import pjson from './package.json';
import plumber from 'gulp-plumber';
import postcss from 'postcss';
import poststylus from 'poststylus';
import prettify from 'gulp-html-prettify';
import pug from 'gulp-pug';
import rucksack from 'rucksack-css';
import run from 'run-sequence';
import mqpacker from 'css-mqpacker';
import stylus from 'gulp-stylus';
import svgmin from 'gulp-svgmin';
import svgstore from 'gulp-svgstore';
import zip from 'gulp-zip';
import cmq from 'gulp-combine-mq';

const server = browsersync.create();

gulp.task('serve', ['markup', 'styles'], () => {
  server.init({
    server: 'app',
    notify: false,
    ui: false
  });

  gulp.watch('app/pages/**/*.pug', ['markup']);
  gulp.watch('app/styles/**/*.styl', ['styles']);

  gulp.watch('app/*.html').on('change', server.reload);
});

gulp.task('markup', () => {
  return gulp.src('app/pages/*.pug')
    .pipe(plumber())
    .pipe(pug())
    .pipe(gulp.dest('app'))
    .pipe(server.stream());
});

gulp.task('styles', () => {
  const processors = [
    lost,
    calc
  ];

  return gulp.src('app/styles/style.styl')
    .pipe(plumber())
    .pipe(stylus({
      use: [poststylus(processors)]
    }))
    .pipe(cmq())
    .pipe(gulp.dest('app/css'))
    .pipe(server.stream());
});

gulp.task('symbols', () => {
  const symbols = gulp.src('app/img/symbols/*.svg')
    .pipe(svgmin())
    .pipe(svgstore({inlineSvg: true}));

  const fileContents = (filePath, file) => file.contents.toString();

  return gulp.src('app/pages/parts/symbols.pug')
    .pipe(inject(symbols, {transform: fileContents}))
    .pipe(gulp.dest('app/pages/parts'));
});

gulp.task('dist', fn => {
  run(
    'dist:clean',
    'symbols',
    'dist:styles',
    'dist:markup',
    'dist:images',
    'dist:copy',
    'dist:zip',
    fn
  );
});

gulp.task('dist:copy', () => {
  return gulp.src([
    'app/fonts/*.{woff,woff2}',
    'app/img/*.png',
    'app/img/*.svg',
    'app/js/*.js'
  ], {base: 'app'})
  .pipe(gulp.dest('dist'));
});

gulp.task('dist:images', () => {
  return gulp.src('app/img/**/*.{png,jpg,gif}')
  .pipe(imagemin([
    // imagemin.optipng({optimizationLevel: 3}),
    imagemin.jpegtran({progressive: true})
  ]))
  .pipe(gulp.dest('dist/img'));
});

gulp.task('dist:styles', () => {
  const processors = [
    lost,
    calc,
    autoprefixer
  ];

  return gulp.src('app/styles/style.styl')
    .pipe(plumber())
    .pipe(stylus({
      use: [poststylus(processors)]
    }))
    .pipe(cmq())
    .pipe(cssnano())
    .pipe(cleancss({format: 'beautify'}))
    .pipe(gulp.dest('dist/css'));
});

gulp.task('dist:markup', () => {
  return gulp.src('app/pages/*.pug')
    .pipe(plumber())
    .pipe(pug())
    .pipe(prettify())
    .pipe(gulp.dest('dist'));
});

gulp.task('dist:clean', () => {
  return del(['dist/**/*', '!dist', '!dist/.gitkeep']);
});

gulp.task('dist:zip', () => {
  return gulp.src(['dist/*', 'dist/*/**', '!dist/*.zip'])
  .pipe(zip('dist-' + pjson.name + '.zip'))
  .pipe(gulp.dest('dist'));
});
