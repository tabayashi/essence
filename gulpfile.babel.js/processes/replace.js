'use strict';

module.exports = function() {
  return {
    get: function() {
      return function(search, _replacement, options) {
        return require('gulp-replace')(search, _replacement, options);
      };
    },
  };
};
