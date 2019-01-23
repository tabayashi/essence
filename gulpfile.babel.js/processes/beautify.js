'use strict';
var Options = require('gulp.plus-parameter');

module.exports = function() {
  return {
    get: function() {
      return function(options) {
        options = new Options(options);
        options.default('indent_size', 2);
        options.default('indent_char', ' ');
        options.default('end_with_newline', true);
        options = options.dump();
        return require('gulp-jsbeautifier')(options);
      };
    },
  };
};
