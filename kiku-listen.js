/*
    imports
 */
var program = require('commander'),
  fs = require('fs'),
  path = require('path'),
  winston = require('winston')
  out = fs.createWriteStream('./kiku.mp3');

/*
    logging level
 */
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)()
  ]
});
logger.level = 'info';

/*
    listen command
 */
program.parse(process.argv);

var q = [];
var src = program.args[0];

logger.info("Playing music files from: " + src);

var s = [];
var m = {};
s.push(src);

while (s.length > 0) {
  var dir = s[s.length-1];
  logger.info("Traversing " + dir + ":");
  var files = fs.readdirSync(dir);  
  
  var end = true;
  for(var i = 0; i < files.length; i++) {
    var fPath = path.join(dir, files[i]);
    if (fs.statSync(path.join(dir, files[i])).isFile()) {
      var arr = files[i].split("\.");
      var ext = arr[arr.length-1];      
      if (ext === "mp3") {
        logger.info("Adding file " + files[i] + " to queue.");
        q.push(fPath);
      }
    }
    else if (!m.hasOwnProperty(fPath)) {
      logger.info("Found folder " + files[i] + "!");
      s.push(fPath);
      end = false;
      break;
    }
  }
  
  if (end) {
    logger.info("Traversal completed.");
    m[s.pop()] = true;
  }
}

logger.info("Queued " +  q.length + " items.");

logger.info("Starting stream...");
start(q);

/**
 * Start playlist
 */
function start(q) {
  play(q, 0);
}


var bytes = 0;
/**
 * Play audio file
 */
function play(q, i) {
  var stream = fs.createReadStream(q[i], { bufferSize: 1 });
  logger.info("Playing " + q[i] + "...");
  
  stream.on('data', (chunk) =>{
    bytes += chunk.length;
    // 1 MB Buffer
    // Pausing for 20 seconds
    if ((bytes / (1024 * 1024)) > 2) {
      logger.info('Buffer is over 5 MB. Pausing for 5 seconds..' + bytes + " total");
      logger.info('Stream is paused: ' + stream.isPaused());
      stream.pause();
      stream.unpipe();
      logger.info('Stream is paused: ' + stream.isPaused());
      setTimeout(() => {
        logger.info('Flushing buffer');
        stream.resume();
        stream.pipe(out);
      }, 1000);
    }
    logger.info("Received " + chunk.length + "  bytes of data.");
  }); 
  
  stream.on('end', function() {
    logger.info(q[i] + " finished! Played " + bytes + " bytes.");
    //if (i+1 < q.length) play(q, i+1);
  });
  stream.pipe(out, {end: false});
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}