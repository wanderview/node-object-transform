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

module.exports = ObjectTransform;

var Transform = require('stream').Transform;
if (!Transform) {
  Transform = require('readable-stream/transform');
}
var util = require('util');

util.inherits(ObjectTransform, Transform);

function ObjectTransform(opts) {
  var self = (this instanceof ObjectTransform)
           ? this
           : Object.create(ObjectTransform.prototype);

  opts = opts || {};

  if (opts.objectMode === false) {
    throw new Error('ObjectTransform requires stream objectMode; do not set ' +
                    'option {objectMode: false}');
  }
  opts.objectMode = true;

  Transform.call(self, opts);

  self._metaProp = opts.meta;

  if (self._metaProp && typeof self._metaProp !== 'string') {
    throw new Error('ObjectTransform optional "meta" property must be a ' +
                    'string specifying the msg property where metadata will ' +
                    'be stored.');
  }

  self[self._metaProp] = opts[self._metaProp];

  return self;
}

ObjectTransform.prototype._transform = function(origMsg, output, callback) {
  var msg = origMsg;
  if (Buffer.isBuffer(msg)) {
    msg = { data: msg, offset: 0 };
  }
  msg.offset = ~~msg.offset;

  var metaData = null;
  if (this._metaProp) {
    metaData = msg[this._metaProp] || this[this._metaProp];
  }

  try {
    var msgOut = null;

    if (metaData) {
      msg.data = this._grow(msg.data, msg.offset, ~~metaData.length);
      msgOut = this._expand(metaData, msg, output, callback);
    } else {
      msgOut = this._reduce(msg, output, callback);
    }

    // convenience for sync, one-to-one _expand/_reduce functions
    if (msgOut) {
      output(msgOut);
      callback();
    }

  } catch (error) {
    this.emit('ignored', error, origMsg);
    callback();
  }
};

ObjectTransform.prototype._grow = function(buf, offset, length) {
  var reqLength = offset + length;
  if (reqLength <= buf.length) {
    return buf;
  }
  if (!buf) {
    return new Buffer(reqLength);
  }
  var newBuf = new Buffer(reqLength);
  buf.copy(newBuf, 0, 0, offset);
  return newBuf;
};

ObjectTransform.prototype._expand = function(metaData, msg, output, callback) {
  throw new Error('ObjectTransform._expand() not implemented');
};

ObjectTransform.prototype._reduce = function(msg, output, callback) {
  throw new Error('ObjectTransform._reduce() not implemented');
};
