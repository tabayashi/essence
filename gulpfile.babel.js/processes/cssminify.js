'use strict';

module.exports = function() {
  return {
    get: function() {
      return function(options, callback) {
        return require('gulp-clean-css')(options, callback);
      };
    },
  };
};
