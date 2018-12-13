'use strict';

module.exports = function() {
  return {
    get: function() {
      return function(pattern, options) {
        return require('gulp-filter')(pattern, options);
      };
    },
  };
};
