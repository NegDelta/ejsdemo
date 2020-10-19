var express = require('express');
var router = express.Router();

function setupRouting(app, db) {
    /* GET home page. */
    app.get('/', function(req, res, next) {
        res.render('index', { title: 'Home' });
    }); 

    app.get('/db/', function(req, res, next) {
        var all_tables = [];
        function processRows(err, row) {
            query = row["sql"];
            lparen = query.indexOf("(");
            schemaArr = new Array;
            schemaStr = query.slice(lparen+1, -1);
            schemaStrArr = schemaStr.split(",");
            console.log(" schemaStrArr is " + schemaStrArr);
            for (col of schemaStrArr) {
                colStmtArr = col.split(" ");
                console.log(" col is " + col);
                if (colStmtArr.length == 2) {
                    colStmtObj = { name: colStmtArr[1], dataType: colStmtArr[0] };
                } else {
                    colStmtObj = { name: colStmtArr[0] };
                }
                schemaArr.push(colStmtObj);
            }
            all_tables.push({ name: row["name"], schema: schemaArr });
            console.log("Table has query: " + query);
        }
        function renderRows(err, rows) {
            console.log("Finished! (" + rows + ")");
            res.render('db', { title: 'DB Interface', all_tables: all_tables });
        }
        db.each("SELECT name, sql FROM sqlite_master WHERE type='table'",
            processRows, renderRows);

    });
}

module.exports = setupRouting;
