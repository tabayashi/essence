'use strict';
module.exports = (runner, tasks) => {
  const src      = runner.src;
  const dest     = runner.dest;
  const job      = runner.task;
  const series   = runner.series;
  const parallel = runner.parallel;
  const watch    = runner.watch;
  const merge    = require('merge-stream');
  const contents = require('vinyl-string');
  const buffer   = require('vinyl-buffer');
  const c        = (require('./configure.json')).production;
};
