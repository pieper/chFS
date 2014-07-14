
var _ = require('underscore');
var cradle = require('cradle');

chronicle = new(cradle.Connection)().database('chronicle');

dbTests = {

  rootListing : function() {
    var names = [];

    var viewOptions = {
      reduce : true,
      group_level : 1,
    }
    chronicle.view('instances/context', viewOptions, function(chError,response) {
      if (chError) {
        console.log("failure");
      } else {
        response.forEach(function(key, row, id) {
          names.push('['+key[0].toString()+']');
        });
      }
      console.log( names );
    });
  },

  subListing : function() {
    var names = [];

    // this works in the shell:
    // curl 'http://localhost:5984/chronicle/_design/instances/_view/context?reduce=true&group_level=2&startkey=\[\["CNI"\]\]&endkey=\[\["CNI\u9999"\]\]'

    var viewOptions = {
      reduce : true,
      group_level : 2,
      //startkey : [['CNI']],
      //endkey : [['CNIz']],
      startkey : [['CNI MS SCANNER BOSTON,nk030702']],
      endkey   : [['CNI MS SCANNER BOSTON,nk030702\u9999']],
    }
      //startkey : ['[CNI MS SCANNER BOSTON,nk030702]'],
      //endkey   : ['[CNI MS SCANNER BOSTON,nk030702zzzz]'],
    //startkey : ['[CNI MS SCANNER BOSTON,nk030702]', '["",""]'],
    //endkey : [ '[CNI MS SCANNER BOSTON,nk030702]', '[\u9999,\u9999]' ],
    chronicle.view('instances/context', viewOptions, function(chError,response) {
      if (chError) {
        console.log("failure");
      } else {
        response.forEach(function(key, row, id) {
          names.push(key);
        });
      }
      console.log( names );
    });
  },

};

_.each(_.keys(dbTests), function runTest(testName) {
  console.log("---------------------\n");
  console.log("Running: " + testName + '\n');
  dbTests[testName]();
});
