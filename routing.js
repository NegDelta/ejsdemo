var express = require('express');
var router = express.Router();

function setupRouting(app, db) {
    /* GET home page. */
    app.get('/', function(req, res, next) {
        res.render('index', { title: 'Home' });
    }); 

    app.get('/db/', function(req, res, next) {
        function renderRows(err, rows) {
            console.log("Got rows: " + JSON.stringify(rows));           
            res.render('db', { title: 'DB Interface', all_tables: rows });
        }
        console.log('We did a /db/!');
        db.all("SELECT name FROM sqlite_master WHERE type='table'", renderRows);

    });
}

module.exports = setupRouting;
