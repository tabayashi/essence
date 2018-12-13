'use strict';
import fs from 'fs';
import path from 'path';
import runner from 'gulp';
import Loader from 'gulp.plus-loader';
import Router from 'gulp.plus-router';

let join      = path.join;
let current   = 'gulpfile.babel.js';
let router    = new Router;
let processes = new Loader(join(current, 'processes'), [runner]);
let configure = JSON.parse(fs.readFileSync(join(current, 'configure.json'), 'utf8'));

router
  .option('m', {
    alias: 'mode',
    type: 'string',
    default: process.env.NODE_ENV || 'development',
    choice: ['development', 'production'],
  });

router
  .route({m: 'development'}, require('./routes/development.js'))
  .route({m: 'production'},  require('./routes/production.js'));

router.run(runner, processes, configure);
