'use strict';
var Options = require('gulp.plus-parameter');

module.exports = function() {
  return {
    get: function() {
      return function(options) {
        options = new Options(options);
        options.default('width',  0.5);
        options.default('height', 0.5);
        options = options.dump();
        return (require('gulp-gm'))(function(file, done) {
          file.size(function(err, size) {
            done(null, file.resize(
              size.width  * options.width,
              size.height * options.height
            ));
          })
        })
      };
    },
  };
};
