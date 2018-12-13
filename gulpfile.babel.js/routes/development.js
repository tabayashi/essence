'use strict';
module.exports = (runner, tasks, configure) => {
  const src      = runner.src;
  const dest     = runner.dest;
  const job      = runner.task;
  const series   = runner.series;
  const parallel = runner.parallel;
  const watch    = runner.watch;
  const config   = configure.development;
  const docroot  = config.DocumentRoot;
  const join     = require('path').join;
  const merge    = require('merge-stream');
  const buffer   = require('vinyl-buffer');

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
  // Data files
  // ---------------------------------------------------------------------------
  job('data.build', () =>
    src('data/**/*', {base: 'data'})
      .pipe(tasks.plumber())
      .pipe(tasks.newer({dest: docroot}))
      .pipe(dest(docroot)));

  job('data.watch', () =>
    watch('data/**/*', series('data.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // robots.txt
  // ---------------------------------------------------------------------------
  job('robots.build', () =>
    src('pages/robots.txt', {base: 'pages'})
      .pipe(tasks.plumber())
      .pipe(tasks.newer({dest: docroot}))
      .pipe(dest(docroot)));

  job('robots.watch', () =>
    watch('pages/robots.txt', series('robots.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // htaccess
  // ---------------------------------------------------------------------------
  job('htaccess.build', () =>
    src('pages/**/.htaccess', {base: 'pages'})
      .pipe(tasks.plumber())
      .pipe(tasks.newer({dest: docroot}))
      .pipe(dest(docroot)));

  job('htaccess.watch', () =>
    watch('pages/**/.htaccess', series('htaccess.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // PHP
  // ---------------------------------------------------------------------------
  job('php.build', () =>
    src('pages/**/*.php', {base: 'pages'})
      .pipe(tasks.plumber())
      .pipe(tasks.newer({dest: docroot}))
      .pipe(dest(docroot)));

  job('php.watch', () =>
    watch('pages/**/*.php', series('php.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // HTML
  // ---------------------------------------------------------------------------
  job('html.build', () =>
    src('pages/**/*.pug', {base: 'pages'})
      .pipe(tasks.plumber())
      .pipe(tasks.pug({
        filters: {php: require('pug-php-filter')},
        basedir: 'node_modules'
      }))
      .pipe(tasks.beautify())
      .pipe(tasks.replace(RegExp('<!DOCTYPE html>'), '<!doctype html>'))
      .pipe(tasks.replace(RegExp('(<!-->)\n(<html)', 'i'), '$1$2'))
      .pipe(tasks.replace(RegExp('\n(<!--<!\[endif\]-->)', 'i'), '$1'))
      .pipe(tasks.replace(RegExp('\n+', 'g'), '\n'))
      .pipe(dest(docroot)));

  job('html.watch', () =>
    watch('pages/**/*.pug', series('html.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // CSS
  // ---------------------------------------------------------------------------
  job('css.build', () =>
    src('styles/*.styl')
      .pipe(tasks.plumber())
      .pipe(tasks.sourcemaps.init())
      .pipe(tasks.stylus({
        define: {
          fontsURL: '../fonts',
          mediaURL: '../assets'
        },
        include: ['node_modules', 'styles/data']
      }))
      .pipe(tasks.replace(RegExp('(progid:)\s+', 'g'), '$1'))
      .pipe(tasks.sourcemaps.write({includeContent: false}))
      .pipe(tasks.sourcemaps.init({loadMaps: true}))
      .pipe(tasks.autoprefixer())
      .pipe(tasks.csso())
      .pipe(tasks.mediaqueries())
      .pipe(tasks.csscomb())
      .pipe(tasks.beautify())
      .pipe(tasks.sourcemaps.write())
      .pipe(dest(docroot)));

  job('css.watch', () =>
    watch('styles/**/*.styl', series('css.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // JS
  // ---------------------------------------------------------------------------
  job('js.build', () =>
    src('scripts/*.js')
      .pipe(tasks.plumber())
      .pipe(tasks.sourcemaps.init())
      .pipe(tasks.browserify())
      .pipe(tasks.beautify())
      .pipe(tasks.sourcemaps.write())
      .pipe(dest(docroot)));

  job('js.watch', () =>
    watch('scripts/**/*.js', series('js.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // Assets
  // ---------------------------------------------------------------------------
  let comparison = '.asset-comparisons';

  job('assets.retina.build', () => {
    let filter2x = tasks.filter(['**/*.*', '!**/*@1x.*']);
    return src('assets/**/*.{jpg,jpeg,gif,png,svg}')
      .pipe(tasks.plumber())
      .pipe(tasks.newer({dest: comparison}))
      .pipe(dest(comparison))
      .pipe(filter2x)
      .pipe(tasks.rename({ suffix: '@2x' }))
      .pipe(tasks.imagemin())
      .pipe(dest(docroot));
  });

  job('assets.reduce.build', () => {
    let filter2x = tasks.filter(['**/*.*', '!**/*@1x.*'], {restore: true});
    return src('assets/**/*.{jpg,jpeg,gif,png,svg}')
      .pipe(tasks.plumber())
      .pipe(tasks.newer({dest: comparison}))
      .pipe(dest(comparison))
      .pipe(filter2x)
      .pipe(tasks.reduce())
      .pipe(filter2x.restore)
      .pipe(tasks.rename(path => path.basename = path.basename.replace(/@1x/, '')))
      .pipe(tasks.imagemin())
      .pipe(dest(docroot));
  });

  job('assets.build', parallel('assets.retina.build', 'assets.reduce.build'));

  job('assets.watch', () =>
    watch('assets/**/*.{jpg,jpeg,gif,png,svg}', series('assets.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // Sprites
  // ---------------------------------------------------------------------------
  job('sprites.retina.build', () => {
    let sprite = src('sprites/*.png')
      .pipe(tasks.plumber())
      .pipe(tasks.sprite({
        imgName: 'sprites@2x.png',
        cssName: 'sprites.json',
        algorithm: 'binary-tree',
        padding: 6
      }));
    return sprite.img
                 .pipe(buffer())
                 .pipe(tasks.imagemin())
                 .pipe(dest(join(docroot, 'assets')));
  });

  job('sprites.reduce.build', () => {
    let sprite = src('sprites/*.png')
      .pipe(tasks.plumber())
      .pipe(tasks.reduce())
      .pipe(tasks.sprite({
        imgName: 'sprites.png',
        cssName: 'sprites.json',
        algorithm: 'binary-tree',
        padding: 3
      }));
    let image = sprite.img;
    let style = sprite.css;
    return merge(
      image.pipe(buffer())
           .pipe(tasks.imagemin())
           .pipe(dest(join(docroot, 'assets'))),
      style.pipe(tasks.spritesheet())
           .pipe(tasks.beautify())
           .pipe(dest('styles/data')));
  });

  job('sprites.build',
    parallel('sprites.retina.build', 'sprites.reduce.build'));

  job('sprites.watch', () =>
    watch('sprites/*.png', series('sprites.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // IconFont
  // ---------------------------------------------------------------------------

  job('icons.build', () =>
    src('icons/*.svg', {base: 'icons'})
      .pipe(tasks.plumber())
      .pipe(tasks.imagemin(
        [(require('imagemin-svgo'))()],
        {verbose: true}
      ))
      .pipe(tasks.iconfont({fontName: 'icons'}))
      .on('glyphs', (glyphs, options) =>
        src('gulpfile.babel.js/templates/styles/data/iconfont.styl', {
          base: 'gulpfile.babel.js/templates'
        }).pipe(tasks.template({
            fontname: 'icons',
            glyphs: glyphs.map(glyph => {
              return {
                name: glyph.name,
                codepoint: glyph.unicode[0].charCodeAt(0).toString(16),
              };
            })
          }))
          .pipe(tasks.rename({basename: 'icons'}))
          .pipe(dest('.')))
      .pipe(dest(join(docroot, 'fonts'))));

  job('icons.watch', () =>
    watch('icons/*.svg', series('icons.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // fonts
  // ---------------------------------------------------------------------------
  job('fonts.build', () =>
    src('fonts/**/*')
      .pipe(tasks.plumber())
      .pipe(dest(docroot)));

  job('fonts.watch', () =>
    watch('fonts/**/*', series('fonts.build', 'browser.reload')));

  // ---------------------------------------------------------------------------
  // Deploy
  // ---------------------------------------------------------------------------
  job('deploy', series(
    parallel('sprites.build', 'icons.build', 'assets.build'),
    parallel('data.build', 'robots.build', 'htaccess.build', 'php.build',
             'html.build', 'css.build', 'js.build', 'fonts.build')));

  // ---------------------------------------------------------------------------
  // Watch
  // ---------------------------------------------------------------------------
  job('watch',
    series(
      'browser.init',
      parallel(
        'data.watch',
        'robots.watch',
        'htaccess.watch',
        'php.watch',
        'html.watch',
        'css.watch',
        'js.watch',
        'assets.watch',
        'sprites.watch',
        'icons.watch',
        'fonts.watch')));

  // ---------------------------------------------------------------------------
  // Default
  // ---------------------------------------------------------------------------
  job('default', series('watch'));
};
