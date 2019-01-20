'use strict';
module.exports = (runner, tasks) => {
  const src      = runner.src;
  const dest     = runner.dest;
  const job      = runner.task;
  const series   = runner.series;
  const parallel = runner.parallel;
  const watch    = runner.watch;
  const merge    = require('merge-stream');
  const contents = require('vinyl-string');
  const buffer   = require('vinyl-buffer');
  const c        = (require('./configure.json')).development;

  // ---------------------------------------------------------------------------
  // BrowserSync
  // ---------------------------------------------------------------------------
  job('browser.init', done => {
    tasks.browsersync.init({
      proxy: '127.0.0.1:80',
      port: 8080
    });
    done();
  });

  job('browser.reload', done => {
    tasks.browsersync.reload();
    done();
  });

  // ---------------------------------------------------------------------------
  // data files
  // ---------------------------------------------------------------------------
  job('data.build', () =>
    src(c.data.src, {dot:true}).pipe(dest(c.data.dest)));

  job('data.watch', () =>
    watch(c.data.watch, series('data.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // html
  // ---------------------------------------------------------------------------
  job('html.build', () =>
    src(c.html.src)
      .pipe(tasks.plumber())
      .pipe(tasks.pug({
        doctype: 'html',
        filters: {php: require('pug-php-filter')},
        basedir: c.html.inc
      }))
      .pipe(tasks.beautify())
      .pipe(tasks.replace(RegExp('\n+', 'g'), '\n'))
      .pipe(dest(c.html.dest)));

  job('html.watch', () =>
    watch(c.html.watch, series('html.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // css
  // ---------------------------------------------------------------------------
  job('css.build', () =>
    src(c.css.src)
      .pipe(tasks.plumber())
      .pipe(tasks.sourcemaps.init())
      .pipe(tasks.stylus({
        define: {
          fontsURL:  '/fonts',
          assetsURL: '/assets'
        },
        include: c.css.inc
      }))
      .pipe(tasks.sourcemaps.write({includeContent: false}))
      .pipe(tasks.sourcemaps.init({loadMaps: true}))
      .pipe(tasks.autoprefixer())
      .pipe(tasks.csso())
      .pipe(tasks.mediaqueries())
      .pipe(tasks.csscomb())
      .pipe(tasks.beautify())
      .pipe(tasks.sourcemaps.write())
      .pipe(dest(c.css.dest)));

  job('css.watch', () =>
    watch(c.css.watch, series('css.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // js
  // ---------------------------------------------------------------------------
  job('js.build', () =>
    src(c.js.src)
      .pipe(tasks.plumber())
      .pipe(tasks.sourcemaps.init())
      .pipe(tasks.browserify())
      .pipe(tasks.beautify())
      .pipe(tasks.sourcemaps.write())
      .pipe(dest(c.js.dest)));

  job('js.watch', () =>
    watch(c.js.watch, series('js.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // assets
  // ---------------------------------------------------------------------------
  job('assets.build', () => {
    let filter = tasks.filter(['**/*.*', '!**/*@1x.*'], {restore: true});
    return src(c.assets.src)
      .pipe(tasks.plumber())
      .pipe(tasks.imagemin())
      .pipe(filter)
      .pipe(tasks.rename({suffix: '@2x'}))
      .pipe(dest(c.assets.dest))
      .pipe(tasks.rename(path => path.basename = path.basename.replace(/@2x/, '')))
      .pipe(tasks.reduce())
      .pipe(filter.restore)
      .pipe(tasks.rename(path => path.basename = path.basename.replace(/@1x/, '')))
      .pipe(dest(c.assets.dest));
  });

  job('assets.watch', () =>
    watch(c.assets.watch, series('assets.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // sprites
  // ---------------------------------------------------------------------------
  job('sprites.build', () =>
    src(c.sprites.src).pipe(tasks.aggregate((group, files) => {
      let srcfiles = files.map(file => file.path);
      let sprite2x = src(srcfiles).pipe(tasks.sprite({
        imgName: group + '@2x.png',
        cssName: group + '.json',
        algorithm: 'binary-tree',
        padding: 6
      }));
      let sprite1x = src(srcfiles).pipe(tasks.sprite({
        imgName: group + '.png',
        cssName: group + '.json',
        algorithm: 'binary-tree',
        padding: 3
      }));
      return merge(sprite2x.img.pipe(buffer())
                               .pipe(tasks.imagemin())
                               .pipe(dest(c.sprites.dest.img)),
                   sprite1x.img.pipe(buffer())
                               .pipe(tasks.imagemin())
                               .pipe(dest(c.sprites.dest.img)),
                   sprite1x.css.pipe(tasks.spritesheet())
                               .pipe(tasks.beautify())
                               .pipe(dest(c.sprites.dest.css)));
    })));

  job('sprites.watch', () =>
    watch(c.sprites.watch, series('sprites.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // icons
  // ---------------------------------------------------------------------------
  job('icons.build', () =>
    src(c.icons.src).pipe(tasks.aggregate((group, files) =>
      src(files.map(file => file.path))
        .pipe(tasks.plumber())
        .pipe(tasks.imagemin([(require('imagemin-svgo'))()]))
        .pipe(tasks.iconfont({fontName: group}))
        .on('glyphs', (glyphs, options) =>
          contents(JSON.stringify({
            fontname: group,
            glyphs: glyphs.map(glyph => {
              return {
                name: glyph.name,
                codepoint: glyph.unicode[0].charCodeAt(0).toString(16)
              };
            })
          }), {path: group + '.json'}).pipe(dest(c.icons.dest.styles)))
        .pipe(dest(c.icons.dest.fonts)))));

  job('icons.watch', () =>
    watch(c.icons.watch, series('icons.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // deploy
  // ---------------------------------------------------------------------------
  job('deploy', series(
    parallel('sprites.build', 'icons.build'),
    parallel('html.build', 'css.build', 'js.build',
             'data.build', 'assets.build')));

  // ---------------------------------------------------------------------------
  // watch
  // ---------------------------------------------------------------------------
  job('watch',
    series('browser.init',
      parallel('sprites.watch', 'icons.watch',
               'html.watch', 'css.watch', 'js.watch',
               'data.watch', 'assets.watch')));

  // ---------------------------------------------------------------------------
  // default
  // ---------------------------------------------------------------------------
  job('default', series('watch'));
};
