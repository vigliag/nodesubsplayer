/**
*  Nodesubplayer version 0.0.1
*  app.js file
*  see README.md file
*/

/**
 * Module dependencies.
 */
 
var express = require('express');
var http = require('http');
var path = require('path');
var sys = require('sys')
var exec = require('child_process').exec;
var querystring = require("querystring");

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.errorHandler());

// server init
var filepath = process.argv[2];
console.log("filepath: " + filepath);

var execstring = "mkvtoolnix\\mkvmerge -i \"" + filepath +"\"";
console.log("execution string: " + execstring);

// calling mkvmerge to obtain track number
var child = exec(execstring, function (error, stdout, stderr) {
  var rePattern = new RegExp(/(\d): subtitles/g);
  var matches = stdout.match(rePattern);
  var tracknumber = matches[0].split(":")[0];
  console.log(matches);
  console.log(tracknumber);
  console.log("done");
  //console.log('stdout: ' + stdout);
  //console.log('stderr: ' + stderr);
  if (error !== null) {
    console.log('exec error: ' + error);
  }
  //continue to the next function
  extractTracks(tracknumber, filepath);
});

function extractTracks(tracknumber, filepath){
	console.log("extracting subtitle tracks");
	var commandstring = "mkvtoolnix\\mkvextract tracks \""+filepath+"\" "+tracknumber+":public\\sub.ass";
	console.log("executing "+ commandstring);
	var child = exec(commandstring, function (error, stdout, stderr) {
		console.log('stdout: ' + stdout);
		if (error !== null) {
			console.log('stderr: ' + stderr);
			console.log('exec error: ' + error);
		}
		
		initserver();
	});
}

function initserver(){
	app.get('/', function(req,res){
		var localfilepath = "file:////"+querystring.escape(filepath.replace("\\","/"));
		  res.render('index', { subtitleurl: "sub.ass" , localfilepath: "file:///"+querystring.escape(filepath), filename: filepath, subname: filepath });
	});

	http.createServer(app).listen(app.get('port'), function(){
	  console.log('Express server listening on port ' + app.get('port'));
	});
}

