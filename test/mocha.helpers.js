'use strict';
var chai   = require('chai');
var sinon  = require('sinon');
var block  = require('sinon-test')(sinon);
var expect = chai.expect;
chai.use(require('sinon-chai'));

global.chai   = chai;
global.sinon  = sinon;
global.expect = expect;
global.block  = block;
