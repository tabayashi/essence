'use strict';
module.exports = (gulp4, tasks) => {
  const src      = gulp4.src;
  const dest     = gulp4.dest;
  const job      = gulp4.task;
  const series   = gulp4.series;
  const parallel = gulp4.parallel;
  const watch    = gulp4.watch;
  const merge    = require('merge-stream');
  const contents = require('vinyl-string');
  const buffer   = require('vinyl-buffer');
  const config   = (require('./configure.json')).development;

  // ---------------------------------------------------------------------------
  // BrowserSync
  // ---------------------------------------------------------------------------
  job('browser.init', done => {
    tasks.browsersync.init({
      proxy:'127.0.0.1:80',
      port:8080
    });
    done();
  });

  job('browser.reload', done => {
    tasks.browsersync.reload();
    done();
  });

  // ---------------------------------------------------------------------------
  // files
  // ---------------------------------------------------------------------------
  job('files.build', () =>
    src(config.files.src, {dot:true}).pipe(dest(config.files.dest)));

  job('files.watch', () =>
    watch(config.files.watch, series('files.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // html
  // ---------------------------------------------------------------------------
  job('html.build', () =>
    src(config.html.src)
      .pipe(tasks.plumber())
      .pipe(tasks.pug({
        doctype: 'html',
        filters: {php: require('pug-php-filter')},
        basedir: config.html.inc
      }))
      .pipe(tasks.beautify())
      .pipe(tasks.replace(RegExp('\n+', 'g'), '\n'))
      .pipe(dest(config.html.dest)));

  job('html.watch', () =>
    watch(config.html.watch, series('html.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // css
  // ---------------------------------------------------------------------------
  job('css.build', () =>
    src(config.css.src)
      .pipe(tasks.plumber())
      .pipe(tasks.sourcemaps.init())
      .pipe(tasks.stylus({
        define: {
          fontsURL:  '/fonts',
          assetsURL: '/assets'
        },
        include: config.css.inc
      }))
      .pipe(tasks.sourcemaps.write({includeContent: false}))
      .pipe(tasks.sourcemaps.init({loadMaps: true}))
      .pipe(tasks.autoprefixer())
      .pipe(tasks.csso())
      .pipe(tasks.mediaqueries())
      .pipe(tasks.csscomb())
      .pipe(tasks.beautify())
      .pipe(tasks.sourcemaps.write())
      .pipe(dest(config.css.dest)));

  job('css.watch', () =>
    watch(config.css.watch, series('css.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // js
  // ---------------------------------------------------------------------------
  job('js.build', () =>
    src(config.js.src)
      .pipe(tasks.plumber())
      .pipe(tasks.sourcemaps.init())
      .pipe(tasks.browserify())
      .pipe(tasks.beautify())
      .pipe(tasks.sourcemaps.write())
      .pipe(dest(config.js.dest)));

  job('js.watch', () =>
    watch(config.js.watch, series('js.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // assets
  // ---------------------------------------------------------------------------
  job('assets.build', () => {
    let filter = tasks.filter(['**/*.*', '!**/*@1x.*'], {restore: true});
    return src(config.assets.src)
      .pipe(tasks.plumber())
      .pipe(tasks.imagemin())
      .pipe(filter)
      .pipe(tasks.rename({suffix: '@2x'}))
      .pipe(dest(config.assets.dest))
      .pipe(tasks.rename(path => path.basename = path.basename.replace(/@2x/, '')))
      .pipe(tasks.reduce())
      .pipe(filter.restore)
      .pipe(tasks.rename(path => path.basename = path.basename.replace(/@1x/, '')))
      .pipe(dest(config.assets.dest));
  });

  job('assets.watch', () =>
    watch(config.assets.watch, series('assets.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // sprites
  // ---------------------------------------------------------------------------
  job('sprites.build', () =>
    src(config.sprites.src).pipe(tasks.aggregate((group, files) => {
      let srcfiles = files.map(file => file.path);
      let sprite2x = src(srcfiles).pipe(tasks.sprite({
        imgName: group + '@2x.png',
        cssName: group + '.json',
        algorithm: 'binary-tree',
        padding: 6
      }));
      let sprite1x = src(srcfiles).pipe(tasks.reduce()).pipe(tasks.sprite({
        imgName: group + '.png',
        cssName: group + '.json',
        algorithm: 'binary-tree',
        padding: 3
      }));
      return merge(sprite2x.img.pipe(buffer())
                               .pipe(tasks.imagemin())
                               .pipe(dest(config.sprites.dest.img)),
                   sprite1x.img.pipe(buffer())
                               .pipe(tasks.imagemin())
                               .pipe(dest(config.sprites.dest.img)),
                   sprite1x.css.pipe(tasks.spritesheet())
                               .pipe(tasks.beautify())
                               .pipe(dest(config.sprites.dest.css)));
    })));

  job('sprites.watch', () =>
    watch(config.sprites.watch, series('sprites.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // icons
  // ---------------------------------------------------------------------------
  job('icons.build', () =>
    src(config.icons.src).pipe(tasks.aggregate((group, files) =>
      src(files.map(file => file.path))
        .pipe(tasks.plumber())
        .pipe(tasks.imagemin([(require('imagemin-svgo'))()]))
        .pipe(tasks.iconfont({fontName: group}))
        .on('glyphs', glyphs =>
          contents(JSON.stringify(glyphs.reduce((hash, glyph) => {
            hash[glyph.name] = glyph.unicode[0].charCodeAt(0).toString(16);
            return hash;
          }, {})), {path: group + '.json'})
          .pipe(tasks.beautify())
          .pipe(dest(config.icons.dest.styles)))
        .pipe(dest(config.icons.dest.fonts)))));

  job('icons.watch', () =>
    watch(config.icons.watch, series('icons.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // deploy
  // ---------------------------------------------------------------------------
  job('deploy', series(
    parallel('sprites.build', 'icons.build'),
    parallel('html.build', 'css.build', 'js.build',
             'files.build', 'assets.build')));

  // ---------------------------------------------------------------------------
  // watch
  // ---------------------------------------------------------------------------
  job('watch',
    series('browser.init',
      parallel('sprites.watch', 'icons.watch',
               'html.watch', 'css.watch', 'js.watch',
               'files.watch', 'assets.watch')));

  // ---------------------------------------------------------------------------
  // default
  // ---------------------------------------------------------------------------
  job('default', series('watch'));
};
