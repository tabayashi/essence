'use strict';
module.exports = (runner, tasks) => {
  let src      = runner.src;
  let dest     = runner.dest;
  let job      = runner.task;
  let series   = runner.series;
  let parallel = runner.parallel;
  let watch    = runner.watch;
  let merge    = require('merge-stream');
  let buffer   = require('vinyl-buffer');
  let c        = (require('./configure.json')).production;
};
