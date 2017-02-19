// Imports
const program = require('commander'),
  fs = require('fs'),
  path = require('path'),
  winston = require('winston')
  out = fs.createWriteStream('./kiku.mp3');

// Logging level
let log = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)()
  ]
});
log.level = 'info';

// 'listen' command
program.parse(process.argv);

let q = []; // Song queue
let src = program.args[0]; // Song folder path (will read recursively!)

log.info("Playing music files from: " + src);

let s = []; // Data structure used for depth first search (DFS) aka a recursive .mp4 search starting at the folder path provided
let m = {}; // Temporary data structure for marking visited folders in DFS
s.push(src); 

// Recursive search for .mp4 files and add to the song queue
while (s.length > 0) {
  var dir = s[s.length-1];
  log.info("Traversing " + dir + ":");
  var files = fs.readdirSync(dir);  
  
  var end = true;
  for(var i = 0; i < files.length; i++) {
    var fPath = path.join(dir, files[i]);
    if (fs.statSync(path.join(dir, files[i])).isFile()) {
      var arr = files[i].split("\.");
      var ext = arr[arr.length-1];      
      if (ext === "mp3") {
        log.info("Adding file " + files[i] + " to queue.");
        q.push(fPath);
      }
    }
    else if (!m.hasOwnProperty(fPath)) {
      log.info("Found folder " + files[i] + "!");
      s.push(fPath);
      end = false;
      break;
    }
  }
  
  if (end) {
    log.info("Traversal completed.");
    m[s.pop()] = true;
  }
}

// Song queue is done!!
log.info("Queued " +  q.length + " items.");

log.info("Starting stream...");
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
 * @param {array} q List of absolute file paths to .mp4 files
 * @param {number} i Index for the song to play
 */
function play(q, i) {
  let stream = fs.createReadStream(q[i], { bufferSize: 1 }); // Starts reading the file with given buffer
  log.info("Playing " + q[i] + "...");
  
  // Create read stream reads in chunks, this handler triggers sequentially 
  stream.on('data', (chunk) =>{
    bytes += chunk.length; // Chunk = byte array, we add the length to the bytes count since length equates to the number of bytes
    
    // If byte count reaches over the (1024 bytes * 1024 bytes = 1 megabyte) buffer, pause the stream for a second
    // The pause is to emulate a true buffer because theoretically another process should be reading the file right now
    // Write 1 MB of data => Pause => Flush data => write again
    if ((bytes / (1024 * 1024)) > 1) {
      log.info('Buffer is over 1 MB. Pausing for 1 second(s)..' + bytes + " total");
      log.info('Stream is paused: ' + stream.isPaused());
      stream.pause();
      stream.unpipe();
      log.info('Stream is paused: ' + stream.isPaused());
      setTimeout(() => {
        log.info('Flushing buffer');
        stream.resume();
        stream.pipe(out);
      }, 1000);
    }
    log.info("Received " + chunk.length + "  bytes of data.");
  }); 
  
  // When the fs.createReadStream process ends and the end of the file has been reached
  stream.on('end', function() {
    log.info(q[i] + " finished! Played " + bytes + " bytes."); // Print out bytes read (it should be equal to what you see on your computer!)
    //if (i+1 < q.length) play(q, i+1); // Plays next song if end of playlist is not reached
  });
  stream.pipe(out, {end: false});
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 * @param {number} min Starting range for random number
 * @param {number} max End range for random number
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
