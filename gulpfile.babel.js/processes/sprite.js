'use strict';
var Options = require('gulp.plus-parameter');

module.exports = function() {
  return {
    get: function() {
      return function(options) {
        options = new Options(options);
        options = options.dump();
        return require('gulp.spritesmith')(options);
      };
    },
  };
};
