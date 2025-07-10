const fs = require('fs');
const { getVideoDurationInSeconds } = require('get-video-duration');
const tmp = require('tmp');

const getDurationFromBuffer = async (buffer) => {
  const tmpFile = tmp.fileSync({ postfix: '.mp4' });
  fs.writeFileSync(tmpFile.name, buffer);
  const duration = await getVideoDurationInSeconds(tmpFile.name);
  tmpFile.removeCallback();
  return duration;
};

module.exports = { getDurationFromBuffer };
