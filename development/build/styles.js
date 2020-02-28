const pify = require('pify')
const gulp = require('gulp')
const sass = require('gulp-sass')
sass.compiler = require('node-sass')
const autoprefixer = require('gulp-autoprefixer')
const gulpStylelint = require('gulp-stylelint')
const watch = require('gulp-watch')
const sourcemaps = require('gulp-sourcemaps')
const rtlcss = require('gulp-rtlcss')
const rename = require('gulp-rename')
const endOfStream = pify(require('end-of-stream'))
const pump = require('pump')
const { createTask, taskParallel, taskSeries } = require('./task')


// scss compilation and autoprefixing tasks
module.exports = createStyleTasks


function createStyleTasks () {

  createTask('build:scss', createScssBuildTask({
    src: 'ui/app/css/index.scss',
    dest: 'ui/app/css/output',
    devMode: false,
  }))

  createTask('dev:scss', createScssBuildTask({
    src: 'ui/app/css/index.scss',
    dest: 'ui/app/css/output',
    devMode: true,
    pattern: 'ui/app/**/*.scss',
  }))

  createTask('lint-scss', function () {
    return gulp
      .src('ui/app/css/itcss/**/*.scss')
      .pipe(gulpStylelint({
        reporters: [
          { formatter: 'string', console: true },
        ],
        fix: true,
      }))
  })

}

function createScssBuildTask ({ src, dest, devMode, pattern }) {
  return function () {
    if (devMode) {
      watch(pattern, async (event) => {
        const stream = buildScss(devMode)
        await endOfStream(stream)
        livereload.changed(event.path)
      })
    }
    return buildScss(devMode)
  }

  function buildScss (devMode) {
    return pump(...[
      // pre-process
      gulp.src(src),
      devMode && sourcemaps.init(),
      sass().on('error', sass.logError),
      devMode && sourcemaps.write(),
      autoprefixer(),
      // standard
      gulp.dest(dest),
      // right-to-left
      rtlcss(),
      rename({ suffix: '-rtl' }),
      devMode && sourcemaps.write(),
      gulp.dest(dest),
    ].filter(Boolean))
  }
}
