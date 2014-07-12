/*
 *
 * chFS.js
 *
 * This is a filesystem interface to the Chronicle system.
 * The code is based on jsonFS.js developed by VMWare and
 * retains the GPL license of the source example.
 *
 * For now this is read-only.  Refer back to the jsonFS.js file
 * in fuse4js (and friends) to see the implementation of a
 * read/write file system.
 *
 * =======================================================================
 *
 * Copyright (c) 2014 Isomics, Inc. All rights reserved.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; only version 2 of the License, and no
 * later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 * =======================================================================
 *
 *
 *
 */

var _ = require('underscore');
var fuse4js = require('fuse4js');
var cradle = require('cradle');
var fs = require('fs');
var chronicle = null;  // the cradle database connection, used globally
var options = {};  // See parseArgs()



/*
 * Handler methods for fuse
 *
 */


//---------------------------------------------------------------------------

/*
 * Handler for the getattr() system call.
 * path: the path to the file
 * cb: a callback of the form cb(err, stat), where err is the Posix return code
 *     and stat is the result in the form of a stat structure (when err === 0)
 */
function getattr(path, cb) {
  var stat = {};
  var err = 0; // assume success

  // TODO: everything is a directory for now
  stat.size = 4096;   // standard size of a directory
  stat.mode = 040777; // directory with 777 permissions

  cb( err, stat );
}

/*
  var info = lookup(obj, path);
  var node = info.node;

  switch (typeof node) {
  case 'undefined':
    err = -2; // -ENOENT
    break;

  case 'object': // directory
    stat.size = 4096;   // standard size of a directory
    stat.mode = 040777; // directory with 777 permissions
    break;

  case 'string': // file
    stat.size = node.length;
    stat.mode = 0100666; // file with 666 permissions
    break;

  default:
    break;
  }
*/

//---------------------------------------------------------------------------

/*
 * Handler for the readdir() system call.
 * path: the path to the file
 * cb: a callback of the form cb(err, names), where err is the Posix return code
 *     and names is the result in the form of an array of file names (when err === 0).
 */
function readdir(path, cb) {
  var names = [];
  var err = 0; // assume success

  var viewOptions = {
    reduce : true,
    group_level : 1,
  }
  chronicle.view('instances/context', viewOptions, function(chError,response) {
    if (chError) {
      err = -2; // -ENOENT
    } else {
      response.forEach(function(key, row, id) {
        names.push('['+key[0].toString()+']');
      });
    }
    cb( err, names );
  });


/*
  var info = lookup(obj, path);

  switch (typeof info.node) {
  case 'undefined':
    err = -2; // -ENOENT
    break;

  case 'string': // file
    err = -22; // -EINVAL
    break;

  case 'object': // directory
    var i = 0;
    for (key in info.node)
      names[i++] = key;
    break;

  default:
    break;
  }
  cb( err, names );
*/
}

//---------------------------------------------------------------------------

/*
 * Handler for the open() system call.
 * path: the path to the file
 * flags: requested access flags as documented in open(2)
 * cb: a callback of the form cb(err, [fh]), where err is the Posix return code
 *     and fh is an optional numerical file handle, which is passed to subsequent
 *     read(), write(), and release() calls.
 */
function open(path, flags, cb) {
  var err = 0; // assume success
  var info = lookup(obj, path);

  if (typeof info.node === 'undefined') {
    err = -2; // -ENOENT
  }
  cb(err); // we don't return a file handle, so fuse4js will initialize it to 0
}

//---------------------------------------------------------------------------

/*
 * Handler for the read() system call.
 * path: the path to the file
 * offset: the file offset to read from
 * len: the number of bytes to read
 * buf: the Buffer to write the data to
 * fh:  the optional file handle originally returned by open(), or 0 if it wasn't
 * cb: a callback of the form cb(err), where err is the Posix return code.
 *     A positive value represents the number of bytes actually read.
 */
function read(path, offset, len, buf, fh, cb) {
  var err = 0; // assume success
  var info = lookup(obj, path);
  var file = info.node;
  var maxBytes;
  var data;

  switch (typeof file) {
  case 'undefined':
    err = -2; // -ENOENT
    break;

  case 'object': // directory
    err = -1; // -EPERM
    break;

  case 'string': // a string treated as ASCII characters
    if (offset < file.length) {
      maxBytes = file.length - offset;
      if (len > maxBytes) {
        len = maxBytes;
      }
      data = file.substring(offset, len);
      buf.write(data, 0, len, 'ascii');
      err = len;
    }
    break;

  default:
    break;
  }
  cb(err);
}

//---------------------------------------------------------------------------

/*
 * Handler for the init() FUSE hook. You can initialize your file system here.
 * cb: a callback to call when you're done initializing. It takes no arguments.
 */
function init(cb) {
  console.log("File system started at " + options.mountPoint);
  console.log("To stop it, type this in another shell: fusermount -u " + options.mountPoint);
  cb();
}

//---------------------------------------------------------------------------

/*
 * Handler for the statfs() FUSE hook.
 * cb: a callback of the form cb(err, stat), where err is the Posix return code
 *     and stat is the result in the form of a statvfs structure (when err === 0)
 */
function statfs(cb) {
  cb(0, {
      bsize: 1000000,
      frsize: 1000000,
      blocks: 1000000,
      bfree: 1000000,
      bavail: 1000000,
      files: 1000000,
      ffree: 1000000,
      favail: 1000000,
      fsid: 1000000,
      flag: 1000000,
      namemax: 1000000
  });
}

//---------------------------------------------------------------------------

/*
 * Handler for the destroy() FUSE hook. You can perform clean up tasks here.
 * cb: a callback to call when you're done. It takes no arguments.
 */
function destroy(cb) {
  console.log("File system stopped");
  cb();
}

//---------------------------------------------------------------------------

var handlers = {
  getattr: getattr,
  readdir: readdir,
  open: open,
  read: read,
  init: init,
  destroy: destroy,
  statfs: statfs
};



/*
 * Utilities for chFS
 *
 */

//---------------------------------------------------------------------------

/*
 * Accepts a fuse path and returns the corresponding 
 * chronicle search key version.
 */
function pathToKey(path) {
  var pathComponents = path.split('/');
  var key = [];
  _.each(pathComponents, function(element, index) {
    if (element !== "") {
      var listForm = [];
      element = element.replace('[','').replace(']','');
      if (element.indexOf(',') < 0) {
        listForm = element;
      } else {
        _.each(element.split(','), function(part,index) {
          listForm.push(part);
        });
      }
      key.push(listForm);
    }
  });
  return(key);
}

/*
 * Accepts a chronicle search key
 * and returns the corresponding fuse path.
 */
function keyToPath(key) {
  var path = "";
  _.each(key, function(element,index) {
    if (typeof element !== 'string') {
      path += "/[" + element + "]";
    } else {
      path += "/" + element;
    }
  });
  return(path);
}


/*
forTests:

A chronicle key looks like this:

[
 ["Brigham and Womens Hosp 221 15", "0001-01001"],
 ["novartis thighs and left arm", "1.3.6.1.4.1.35511635217625025614132.1"],
 ["MR", "Band 0 (without tumors)", "1.3.6.1.4.1.35511635217625025614132.1.4.0"],
 "1.3.6.1.4.1.35511635217625025614132.1.4.0.3.0"
]

which is [[inst,patid],[studydes,studid],[modality,serdesc,serid],instid]

which maps to a path like this:

/[inst,patid]/[studydes,studid]/[modality,serdesc,serid]/instid

Note the various descriptions can have invalid (or confusing) characters
for a file system path.  TODO: urlencode the worst offenders

Design decisions:
- make the filename match the key, including UID to avoid name clashes
- include the square brakets in the filenames, but remove the quotes
  (bash autocomplete will escape the brackets and other chars)
  (use quotes when cutting and pasting a file path)
- slashes and commas are the characters that need to be url encoded for now



TODO: Should make a (set of) custom views that expose useful paths
to simplify processing.  Possible options:

/inst/modality/date/studyid-studydesc/seriesnumber-seriesdesc/instanceno

/referring/modality/date/studyid-studydesc/seriesnumber-seriesdesc/instanceno

/studydesc/patient/seriesnumber-seriesdesc/instanceno

*/

//TODO: move these to tests/path-tests.js
var path = "/[inst,patid]/[studydes,studid]/[modality,serdesc,serid]/instid"
console.log(path);
console.log("maps to ");
var key = pathToKey(path);
console.log(key);
console.log("maps to ");
var newPath = keyToPath(key);
console.log(newPath);

console.log("\npath and key are equal?", path == newPath);


//---------------------------------------------------------------------------

function usage() {
  console.log();
  console.log("Usage: node jsonFS.js [options] inputJsonFile mountPoint");
  console.log("(Ensure the mount point is empty and you have wrx permissions to it)\n")
  console.log("Options:");
  console.log("-o outputJsonFile  : save modified data to new JSON file. Input file is never modified.");
  console.log("-d                 : make FUSE print debug statements.");
  console.log("-a                 : add allow_other option to mount (might need user_allow_other in system fuse config file).");
  console.log();
  console.log("Example:");
  console.log("node example/jsonFS.fs -d -o /tmp/output.json example/sample.json /tmp/mnt");
  console.log();
}

//---------------------------------------------------------------------------

function parseArgs() {
  //
  // TODO: map these to chFS and add config file
  //
  var i, remaining;
  var args = process.argv;
  if (args.length < 4) {
    return false;
  }
  options.mountPoint = args[args.length - 1];
  options.inJson = args[args.length - 2];
  remaining = args.length - 4;
  i = 2;
  while (remaining--) {
    if (args[i] === '-d') {
      options.debugFuse = true;
      ++i;
    } else if (args[i] === '-a') {
      options.allowOthers = true;
      ++i;
    } else return false;
  }
  return true;
}

//---------------------------------------------------------------------------

function gracefulShutdown(mountPoint, shutdownCB) {
  console.log('shutting down');
  var exec = require('child_process').exec;
  var command = 'umount ' + mountPoint; // TODO: mac specific
  exec(command, function (error, stdout, stderr) {
    // output is in stdout
    if (error !== null) {
      console.log('coulnd\'t run command: ' + command);
      console.log('error:\n', error);
      console.log('stdout:\n', stdout);
      console.log('stderr:\n', stderr);
    }
    shutdownCB();
  });
}

//---------------------------------------------------------------------------

(function main() {

  if (parseArgs()) {

    // chFS options
    console.log("\nInput file: " + options.inJson);
    console.log("Mount point: " + options.mountPoint);
    if (options.debugFuse)
      console.log("FUSE debugging enabled");

    content = fs.readFileSync(options.inJson, 'utf8');
    obj = JSON.parse(content);

    chronicle = new(cradle.Connection)().database('chronicle');

    try {

      // perform a graceful shutdown on interrupt from nodemon
      process.once('SIGUSR2', function () {
        gracefulShutdown(options.mountPoint, function () {
          process.kill(process.pid, 'SIGUSR2');
        });
      });

      // fuse options
      var opts = [];
      if (options.allowOthers) {
        opts.push('-o');
        opts.push('allow_other');
      }

      // run the file system
      fuse4js.start(options.mountPoint, handlers, options.debugFuse, opts);

    } catch (e) {
      console.log("Exception when starting file system: " + e);
    }
  } else {
    usage();
  }
})();
