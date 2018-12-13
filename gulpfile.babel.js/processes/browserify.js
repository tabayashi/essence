'use strict';

module.exports = function() {
  return {
    get: function() {
      return function(options) {
        let through2   = require('through2');
        let browserify = require('browserify');
        let babelify   = require('babelify');
        let presets    = ['env'];

        return through2.obj((file, encode, callback) => {
          browserify(file.path, options)
            .transform(babelify, {presets:presets})
            .bundle((err, res) => {
              file.contents = res;
              callback(null, file);
            });
        });
      };
    },
  };
};
