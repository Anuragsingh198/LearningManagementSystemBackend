const { Readable } = require('stream');
const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

module.exports = { bufferToStream };
