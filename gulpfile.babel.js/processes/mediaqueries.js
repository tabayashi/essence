'use strict';

module.exports = function() {
  return {
    get: function() {
      return function(options) {
        return require('gulp-merge-media-queries')(options);
      };
    },
  };
};
