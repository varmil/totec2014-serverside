var express = require('express');
// var fs     = require('fs');
var http    = require('http');
// var path    = require('path');
var cluster = require('cluster');
var routes_index = require('./routes/index');
var numCPUs = require('os').cpus().length;
// var morgan = require('morgan');
var bodyParser = require('body-parser');

if (cluster.isMaster) {
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {
	var app = express();
	var router = express.Router();

	// create a write stream (in append mode)
	// var accessLogStream = fs.createWriteStream(__dirname + '/access.log');
	// app.use(morgan('dev', { /*stream: accessLogStream,*/ immidiate: true }));

	// these are cannot use by default in express 4.x
	// app.use(express.errorHandler());
	// app.use(express.favicon());
	// app.use(express.bodyParser());
	// app.use(express.methodOverride());
	// app.use(app.router); //  deprecated
	// pathを指定した場合、リクエストとpathが一致した場合のみそのミドルウエアが利用される。pathが省略された場合は'/'として扱われる
	// app.use(filters.recent_sold);

	app.set('port', process.env.PORT || 80);
	// app.set('view engine', 'jade');
	// app.set('views', __dirname + '/views');
	// app.use(express['static'](path.join(__dirname, '/public')));

	// parse post data (req.body.FOO)
	app.use( bodyParser.json() );       // to support JSON-encoded bodies
	app.use(bodyParser.urlencoded({extended: true})); // to support URL-encoded bodies

	// main routes
	// router.get('/', routes_index.index);
	router.get('/api/musics', routes_index.get_musics);
	router.get('/api/musics/:id', routes_index.get_music);
	router.post('/api/musics', routes_index.post_music);
	router.put('/api/musics/:id', routes_index.put_music);
	router.delete('/api/musics/:id', routes_index.delete_music);
	router.post('/api/musics/:id/play', routes_index.post_history);

	router.get('/api/musics/times/:id', routes_index.get_time); // TODO
	router.get('/api/musics/recent', routes_index.get_recent); // TODO

	router.get('/api/playlists/:name', routes_index.get_playlist);
	router.post('/api/playlists/:name', routes_index.post_playlist);
	router.post('/api/playlists/:name/add', routes_index.post_playlist_music);
	router.post('/api/playlists/:name/remove', routes_index.remove_playlist_music);

	// router.post('/api/playlists/:name/remove', routes_index.post_music);

	// apply the routes to our application
	app.use('/', router);

	http.createServer(app).listen(app.get('port'), function () {
		console.log('Express server listening on port ' + app.get('port'));
	});
}
