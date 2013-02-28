// Copyright (c) 2013, Benjamin J. Kelly ("Author")
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

'use strict';

var ObjectTransform = require('../transform');
var util = require('util');

util.inherits(S, ObjectTransform);

var TEST_STRING = 'Hello world!';

function S(opts) {
  var self = (this instanceof S) ? this : Object.create(S.prototype);
  opts = opts || {};
  opts.meta = 's';
  ObjectTransform.call(this, opts);
  return self;
}

S.prototype._expand = function(s, msg, output, callback) {
  msg.data.write(s, msg.offset);
  msg.offset += s.length;
  output(msg);
  callback();
};

S.prototype._reduce = function(msg, output, callback) {
  msg.s = msg.data.toString(null, msg.offset, TEST_STRING.length);
  msg.offset += TEST_STRING.length;
  output(msg);
  callback();
};

module.exports.reduceBuffer = function(test) {
  test.expect(2);

  var sstream = new S();

  var buf = new Buffer(TEST_STRING);
  sstream.write(buf);

  var msg = sstream.read();

  test.equal(TEST_STRING, msg.s);
  test.equal(TEST_STRING.length, msg.offset);

  test.done();
};

module.exports.reduceObject = function(test) {
  test.expect(2);

  var sstream = new S();

  var buf = new Buffer(TEST_STRING);
  sstream.write({data: buf});

  var msg = sstream.read();

  test.equal(TEST_STRING, msg.s);
  test.equal(TEST_STRING.length, msg.offset);

  test.done();
};

module.exports.expandDefault = function(test) {
  test.expect(1);

  var defaultString = 'hELLO WORLD?';

  var sstream = new S({s: defaultString});

  sstream.write({data: new Buffer(1)});

  var msg = sstream.read();

  test.equal(defaultString, msg.data.toString(null, 0, defaultString.length));

  test.done();
};

module.exports.expandObject = function(test) {
  test.expect(1);

  var defaultString = 'hELLO WORLD?';
  var msgString = '!world Hello';

  var sstream = new S({s: defaultString});

  sstream.write({data: new Buffer(1), s: msgString});

  var msg = sstream.read();

  test.equal(msgString, msg.data.toString(null, 0, defaultString.length));

  test.done();
};
