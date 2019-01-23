'use strict';
var Options = require('gulp.plus-parameter');

module.exports = function() {
  return {
    get: function() {
      return function(plugins, options) {
        if (!Array.isArray(plugins)) {
          options = plugins;
          plugins = [
            (require('imagemin-pngquant'))({ speed: 1 }),
            (require('imagemin-mozjpeg'))(),
            (require('imagemin-optipng'))(),
            (require('imagemin-gifsicle'))(),
            (require('imagemin-svgo'))()
          ];
        }
        options = new Options(options);
        options.default('verbose', true);
        options = options.dump();
        return require('gulp-imagemin')(plugins, options);
      };
    },
  };
};
