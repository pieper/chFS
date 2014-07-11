chFS
====

a mountable file system interface to Chronicle

## Dependencies

* Nodejs
 * underscore
 * fuse4js
 * cradle
* Chronicle
 * CouchDB

Currently mac only.

## Usage

`node chFS.js <mountpoint>`

where <mountpoint> is any directory you own.

## Development

The code is setup to work gracefully with nodemon:

`nodemon chFS.js package.json /tmp/j`

So every code edit unmounts and remounts the filesystem.

## Status

Just a work-in-progress experiment at this point.
Hopefully it will become useful as some of the ideas are
worked out.

## License

Unlike the general policy of Chronicle-related software to be issued
under the Slicer License, this code is explicitly GPL because it is
based on GPL code exposed in fuse4js.
