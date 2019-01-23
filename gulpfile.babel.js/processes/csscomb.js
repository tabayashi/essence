'use strict';

module.exports = function() {
  return {
    get: function() {
      return function(configpath, options) {
        return require('gulp-csscomb')(configpath, options);
      };
    },
  };
};
