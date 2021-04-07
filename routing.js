var express = require('express');
var router = express.Router();

function setupRouting(app, db) {
    /* GET home page. */
    app.get('/', function(req, res, next) {
        res.render('index', { title: 'Home' });
    }); 

    app.get('/table/', function(req, res, next) {
        function processRows(err, row) {
            query = row["sql"];
            lparen = query.indexOf("(");
            schemaArr = new Array;
            schemaStr = query.slice(lparen+1, -1);
            schemaStrArr = schemaStr.split(",");
            for (col of schemaStrArr) {
                colStmtArr = col.split(" ");
                if (colStmtArr.length == 2) {
                    colStmtObj = { name: colStmtArr[1], dataType: colStmtArr[0] };
                } else {
                    colStmtObj = { name: colStmtArr[0] };
                }
                schemaArr.push(colStmtObj);
            }
            all_tables.push({ name: row["name"], schema: schemaArr });
        }
        var all_tables = [];
        function renderRows(err, rows) {
            res.render('db', { title: 'DB Tables Overview', all_tables: all_tables });
        }
        db.each("SELECT name, sql FROM sqlite_master WHERE type='table'",
            processRows, renderRows);

    });

    app.get('/table/:name/', function(req, res, next) {
        function renderValidRows(err, rows) {
            res.render('table', {
                title: 'DB Table',
                all_rows: rows,
                name: req.params.name 
            });
        }
        function renderAny(err, rows) {
            console.log(`Trying for "${rows}..."`);
            if(rows.length > 0) {
                db.all("SELECT * FROM " + req.params.name,
                    renderValidRows);
            } else {
                res.redirect("/table/");
            }
        }
        db.all(
            `SELECT name FROM sqlite_master WHERE type='table' AND name='${req.params.name}';`,
            renderAny
        );
    });
}

module.exports = setupRouting;
