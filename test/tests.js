
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
      console.log( "rootListing names: ", names );
    });
  },

  subListing : function() {
    var names = [];

    // corresponds to this in the browser:
    // http://localhost:5984/chronicle/_design/instances/_view/context?reduce=true&group_level=2&startkey=[[%22Anonymous%20Hospital%22,%220003-30002%22]]&endkey=[[%22Anonymous%20Hospital%22,%220003-30002\u9999%22]]
    var viewOptions = {
      reduce : true,
      group_level : 2,
      startkey : [['Anonymous Hospital','0003-30002']],
      endkey   : [['Anonymous Hospital','0003-30002'], {}],
    }
    chronicle.view('instances/context', viewOptions, function(chError,response) {
      if (chError) {
        console.log("failure");
      } else {
        response.forEach(function(key, row, id) {
          names.push(key);
        });
      }
      console.log( "subListing names: ", names );
    });
  },

};

_.each(_.keys(dbTests), function runTest(testName) {
  console.log("---------------------\n");
  console.log("Running: " + testName + '\n');
  dbTests[testName]();
});
