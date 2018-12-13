'use strict';

module.exports = function() {
  return {
    get: function() {
      return require('browser-sync');
    }
  };
};
