#!/usr/bin/env node

process.bin = process.title = 'kiku';

/*
    imports
 */
var program = require('commander');

/*
    program & commands
 */
program
  .usage('<cmd>')
  .command('listen <dir> [otherDirs...]', 'listen to files on <dir>')
  .parse(process.argv);

