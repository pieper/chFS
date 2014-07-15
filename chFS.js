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
var ch = require('ch');
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

  var viewOptions = ch.paths.pathToViewOptions(path);
  chronicle.view('instances/context', viewOptions, function(chError,response) {
    if (chError) {
      err = -2; // -ENOENT
    } else {
      response.forEach(function(key, row, id) {
        if (viewOptions.startkey) {
          var startkey = JSON.parse(viewOptions.startkey);
          key = key.slice(startkey.length); // remove common prefix
        }
        names.push(key.toString());
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
  cb(-2);
  /*
  var info = lookup(obj, path);

  if (typeof info.node === 'undefined') {
    err = -2; // -ENOENT
  }
  cb(err); // we don't return a file handle, so fuse4js will initialize it to 0
  */
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
  cb(-2);
  /*
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
  */
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


//---------------------------------------------------------------------------

function usage() {
  console.log();
  console.log("Usage: node chFS.js [options] mountPoint");
  console.log("(Ensure the mount point is empty and you have wrx permissions to it)\n")
  console.log("Options:");
  console.log("-d                 : make FUSE print debug statements.");
  console.log("-a                 : add allow_other option to mount (might need user_allow_other in system fuse config file).");
  console.log();
  console.log("Example:");
  console.log("node chFS.fs -d /tmp/mnt");
  console.log();
}

//---------------------------------------------------------------------------

function parseArgs() {
  //
  // TODO: map these to chFS and add config file
  //
  var i, remaining;
  var args = process.argv;
  if (args.length < 3) {
    return false;
  }
  options.mountPoint = args[args.length - 1];
  remaining = args.length - 3;
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
    console.log("Mount point: " + options.mountPoint);
    if (options.debugFuse)
      console.log("FUSE debugging enabled");

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
