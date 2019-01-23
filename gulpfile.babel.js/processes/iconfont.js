'use strict';
var Options = require('gulp.plus-parameter');

module.exports = function() {
  return {
    get: function() {
      return function(options) {
        options = new Options(options);
        //options.default('prependUnicode', true);
        options.default('normalize', true);
        options.default('timestamp', Math.round(Date.now()/1000));
        options = options.dump();
        return require('gulp-iconfont')(options);
      };
    },
  };
};
