'use strict';

module.exports = function() {
  return {
    get: function() {
      return function(object) {
        return require('gulp-rename')(object);
      };
    },
  };
};
