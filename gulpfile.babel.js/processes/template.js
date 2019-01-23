'use strict';

module.exports = function() {
  return {
    get: function() {
      return function(data, options) {
        return require('gulp-template')(data, options);
      };
    },
  };
};
