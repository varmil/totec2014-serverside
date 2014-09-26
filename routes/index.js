var _ = require('underscore');
var async  = require('async');
var mysql  = require('mysql');
var config = require('../config');

// redis model settings
// var client = require('redis').createConnection();

exports.index = function(req, res) {
    // app routes
};

// No1
exports.get_musics = function(req, res) {
    var queryWhere, queryLimit, queryStart;

    // where conditons
    if (req.query.artist_id && req.query.title) {
        queryWhere = 'where artist_id = ' + req.query.artist_id + 'and' + 'title like "' + req.query.title + '%"';
    }
    else if (req.query.artist_id) {
        queryWhere = queryArtistIdTitle = 'where artist_id = ' + req.query.artist_id;
    }
    else if (req.query.title) {
        queryWhere = 'where title like "' + req.query.title + '%"';
    } else {
        queryWhere = '';
    }

    // limit conditions
    queryLimit = (req.query.limit) ? 'limit ' + req.query.limit : 'limit ' +100;

    // offset conditons
    queryStart = (req.query.start) ? 'offset ' + (parseInt(req.query.start, 10) - 1): '';

    var client = mysql.createConnection(config.database);
    client.query(
        'SELECT * FROM music ' + queryWhere + ' ' + queryLimit + ' ' + queryStart,
        function (err, results) {
            if (err) { throw err; }
            client.end();
            res.send(results);
        }
    );
};

// No2
exports.get_music = function(req, res) {
    var client = mysql.createConnection(config.database);
    client.query(
        'SELECT * FROM music where id = ?',
        [req.params.id],
        function (err, results) {
            client.end();
            if (err) { throw err; }

            if (_.isEmpty(results)) {
                res.status(404).end();
                return;
            }

            res.send(results[0]);
        }
    );
};

// No3
exports.post_music = function(req, res) {
    if (!req.body.artist_id || !req.body.title) {
        res.status(400).end();
        return;
    }

    var outline = '';
    if (req.body.outline) outline = req.body.outline;

    var client = mysql.createConnection(config.database);
    client.query(
        'select id from artist where id=?',
        [req.body.artist_id],
        function (err, results) {
            if (err) { throw err; }
            // 指定アーティストがいない
            if (_.isEmpty(results)) {
                client.end();
                res.status(400).end();
                return;
            }

            client.query(
                'INSERT INTO music (artist_id,title,outline) VALUES (?,?,?)',
                [req.body.artist_id, req.body.title, outline],
                function (err, results) {
                    if (err) { throw err; }
                    client.end();
                    res.redirect(201, '/api/musics/'+results.insertId);
                }
            );
        }
    );
};

// No 4
exports.put_music = function(req, res) {
    if (!req.body.artist_id || !req.body.title) {
        res.status(400).end();
        return;
    }

    var outline = '';
    if (req.body.outline) outline = req.body.outline;

    var client = mysql.createConnection(config.database);
    client.query(
        'select id from artist where id=?',
        [req.body.artist_id],
        function (err, results) {
            if (err) { throw err; }
            // 指定アーティストがいない
            if (_.isEmpty(results)) {
                client.end();
                res.status(400).end();
                return;
            }

            client.query(
                'UPDATE music set artist_id=?,title=?,outline=? where id=?',
                [req.body.artist_id, req.body.title, outline, req.params.id],
                function (err, results) {
                    client.end();
                    if (err) {
                        console.log('put error', err);
                    }
                    if (results.affectedRows == 0) {
                        // 該当なし
                        res.status(404).end();
                        return;
                    }
                    res.status(204).send('');
                }
            );
        }
    );
};

// No5
exports.delete_music = function(req, res) {
    var outline = '';
    if (req.body.outline) outline = req.body.outline;

    var client = mysql.createConnection(config.database);
    client.query(
        'DELETE FROM music where id=?',
        [req.params.id],
        function (err, results) {
            client.end();
            if (err) { throw err; }
            if (results.affectedRows == 0) {
                // 該当なし
                res.status(404).end();
                return;
            }
            res.status(204).send('');
        }
    );
};

// No6
exports.post_history = function(req, res) {
    var client = mysql.createConnection(config.database);
    client.query(
        'INSERT INTO play_history (music_id, created_at) VALUES (?,now())',
        [req.params.id],
        function (err, results) {
            if (err) { throw err; }
            client.end();
            res.status(204).send('');
        }
    );
};

// TODO IDなしのとき
exports.get_time = function(req, res) {
    var queryWhere = '';
    if (req.params.id) queryWhere = 'where music_id=' + req.params.id;

    var client = mysql.createConnection(config.database);
    client.query(
        'SELECT music_id FROM play_history ' + queryWhere + ' limit 100',
        function (err, results) {
            if (err) { throw err; }
            client.end();
            var response = {id: req.params.id, times: results.length};
            res.send(response);
        }
    );
};

// TODO
exports.get_recent = function(req, res) {
    var queryWhere = '';
    if (req.params.id) queryWhere = 'where music_id=' + req.params.id;

    // limit conditions
    queryLimit = (req.query.limit) ? 'limit ' + req.query.limit : 'limit ' +100;

    // offset conditons
    queryStart = (req.query.start) ? 'offset ' + (parseInt(req.query.start, 10) - 1): '';

    var client = mysql.createConnection(config.database);
    client.query(
        'SELECT distinct music_id FROM play_history order by created_at DESC ' + queryLimit + '' + queryStart,
        function (err, results) {
            if (err) { throw err; }
            client.end();
            res.send(results);
        }
    );
};


// No9 OK
exports.get_playlist = function(req, res) {
    var client = mysql.createConnection(config.database);
    client.query(
        'select p.name,p.outline as pOutline,m.artist_id,m.id,m.outline as mOutline,m.title'+
        ' from playlist as p,playlist_detail as pd,music as m'+
        ' where p.name=? and p.name=pd.playlist_name and pd.music_id=m.id',
        [req.params.name],
        function (err, results) {
            client.end();
            if (err) {
                // do nothing
                res.status(999).end();
                return;
            }
            if (_.isEmpty(results)) {
                res.status(404).end();
                return;
            }

            var musics = _.map(results, function(v) {
                var result = {artist_id: v.artist_id, id: v.id, outline: v.mOutline, title: v.title};
                return result;
            });
            var response = {
                name: results[0].name,
                outline: results[0].pOutline,
                musics: musics
            };
            res.send(response);
        }
    );
};

// No10
exports.post_playlist = function(req, res) {
    var outline = '';
    if (req.body.outline) outline = req.body.outline;
    var musics = '';
    if (req.body.musics) {
        musics = req.body.musics.split(',');
    }

    var client = mysql.createConnection(config.database);
    client.query(
        'INSERT INTO playlist (name, outline) VALUES (?,?)',
        [req.params.name, outline],
        function (err, results) {
            if (err) {
                client.end();
                if (err.message.indexOf('Duplicate') !== -1) res.status(409).end();
                res.status(400).end();
            } else {
                var values = [];
                values = _.map(musics, function(v, k){
                    return [req.params.name, k+1, ''+v];
                });

                client.query(
                    'INSERT INTO playlist_detail (playlist_name, number, music_id) VALUES ?',
                    [values],
                    function(err, results) {
                        if (err) {
                            client.end();
                            console.log('bulk err', err);
                            res.status(400).end();
                        } else {
                            client.end();
                            res.status(204).send('');
                        }
                    }
                );
            }
        }
    );
};

// No11
exports.post_playlist_music = function(req, res) {

    if (!req.body.music_id || !req.body.number || req.body.number <= 0) {
        res.status(400).end();
        return;
    }

    var client = mysql.createConnection(config.database);
    client.query(
        'select name from playlist where name=?',
        [req.params.name],
        function (err, results) {
            if (err) {
                // do nothing.
            } else {
                if (_.isEmpty(results)) {
                    client.end();
                    res.status(404).end();
                    return;
                }

                client.query(
                    'INSERT INTO playlist_detail (playlist_name, number, music_id) VALUES (?,?,?)',
                    [req.params.name, req.body.number, req.body.music_id],
                    function (err, results) {
                        if (err) {
                            client.end();
                            res.status(999).end(); //duplicate
                        } else {
                            client.end();
                            res.status(204).send('');
                        }
                    }
                );
            }
        }
    );
};

// No12
exports.remove_playlist_music = function(req, res) {
    // 必須パラメータチェック
    if (!req.body.number) {
        res.status(400).end();
        return;
    }

    var client = mysql.createConnection(config.database);
    client.query(
        'DELETE FROM playlist_detail where playlist_name=? and number=?',
        [req.params.name, req.body.number],
        function (err, results) {
            client.end();
            if (err) {
                return;
            }
            if (results.affectedRows == 0) {
                // 該当なし
                res.status(404).end();
                return;
            }
            res.status(204).send('');
        }
    );
};