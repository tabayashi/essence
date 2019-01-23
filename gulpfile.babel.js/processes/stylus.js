'use strict';
var Options = require('gulp.plus-parameter');

module.exports = function() {
  return {
    get: function() {
      return function(options) {
        options = new Options(options);
        options.default('include css', true);
        options.default('compress', false);
        options = options.dump();
        return require('gulp-stylus')(options);
      };
    },
  };
};
