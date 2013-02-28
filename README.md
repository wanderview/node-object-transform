# object-transform

Composable object stream Transform

[![Build Status](https://travis-ci.org/wanderview/node-object-transform.png)](https://travis-ci.org/wanderview/node-object-transform)

## Examples

```javascript
var ObjectTransform = require('object-transform');
var util = require('util');

util.inherits(MyStream, ObjectTransform);

function MyStream(opts) {
  var self = (this instanceof MyStream)
           ? this
           : Object.create(MyStream.prototype);

  opts = opts || {};

  opts.meta = 'myMetaData';

  ObjectTransform.call(self, opts);

  return self;
}

MyStream.prototype._expand = function(myMetaData, msg, output, callback) {
  // If myMetaData has length property, msg.data is automatically grown
  // to accomodate writing it out at offset
  myMetaData.serializeOut(msg.data, msg.offset);
  msg.offset += myMetaData.length;
  output(msg);
  callback();
};

MyStream.prototype._reduce = function(msg, output, callback) {
  msg.myMetaData = DoSomeParsing(msg.data, msg.offset);
  msg.offset += msg.myMetaData.length;
  output(msg);
  callback();
};

// Use the stream to parse a binary stream
var mstream = new MyStream();
mstream.write(buf);
var msg = mstream.read();
msg.data === buf;
msg.myMetaData !== null;
msg.offset === msg.myMetaData.length;

// Use the stream write a binary stream...

// from defaults
var mstream2 = new MyStream({myMetaData: defaultMetaData});
mstream2.write({data: buf2});
var msg2 = mstream2.read();
msg2.offset === defaultMetaData.length;

// from per-object meta-data
mstream2.write({data: buf3, myMetaData: someMetaData});
var msg3 = mstream2.read();
```

### More Examples

See these other modules:

* [ether-stream][]

## Description

`ObjectTransform` is a base class designed to make it easy to create
composable object streams.

What is a "composable object stream"?  This is a convention I've found
myself working towards in my own stream implementations.  It provides some
rough rules for how to structures messages in order to make it easier
to combine multiple stream pipelines together.

Message objects passed through a stream  pipeline look like this:

```javascript
{
  data: new Buffer(),     // Binary buffer being written to or read from
  offset: 23,             // Our place in the buffer
  meta1: { /* ... */ },   // Module-specific meta-data
  meta2: { /* ... */}     // Module-specific meta-data
}
````

A composable object stream can can operate in one of two logical modes.

* Expand the content in a Buffer by writing out pre-existing meta-data.
* Reduce the content in a Buffer by reading out new meta-data.

If the input to the stream provides the right meta-data assume we are
expanding into the buffer.  Perform any serialization needed to write
the bytes out to the buffer at the current offset.

If the input is a raw `Buffer` or an object without the expected
meta-data then assume we are reducing.  Read the bytes at the current
offset and store the resulting meta-data in the object at a module
specific property name.

If anything goes wrong will reading or writing meta-data, then emit
an `'ignored'` event that provides an `Error` and the message that
was discarded.  In mixed type streams, this may be expected which
is why we don't emit `'error'` here.

To implement a stream using this pattern do the following:

1. Extend the `ObjectTransform` class.
2. Specify the name of your meta-data property in the options when calling
   the `ObjectTransform` constructor.
3. Implement the `_expand(metaData, msg, output, callback)` function to
   write data to the `msg.data` buffer.
4. Implement the `_reduce(msg, output, callback)` function to read from
   `msg.data` and store the results at your specific meta-data property
   on `msg`.

[ether-stream]: https://github.com/wanderview/node-ether-stream#readme
