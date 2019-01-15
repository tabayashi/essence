'use strict';
import runner from 'gulp';
import Loader from 'gulp.plus-loader';
import Router from 'gulp.plus-router';

const router = new Router;
router
  .option('m', {
    alias: 'mode',
    type: 'string',
    default: process.env.NODE_ENV || 'development',
    choice: ['development', 'production'],
  })
  .route({m: 'development'}, require('./routes/development.js'))
  .route({m: 'production'},  require('./routes/production.js'));
router
  .run(runner, new Loader('gulpfile.babel.js/processes', [runner]));
