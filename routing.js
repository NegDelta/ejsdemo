var express = require('express');
var router = express.Router();

function setupRouting(app, db) {
    // GET home page
    app.get('/', function(req, res, next) {
        res.render('index', { title: 'Home' });
    }); 

    // GET tables overview
    app.get('/table/', function(req, res, next) {
        var all_tables = [];

        // Serialize given single row
        function processRows(err, row) {
            queryStr = row["sql"];

            // extract schema from sql syntax
            leftParenPos = queryStr.indexOf("(");
            schemaStr = queryStr.slice(leftParenPos+1, -1);
            
            // divide schema into columns
            columnStrs = schemaStr.split(",");
            
            schemaArr = new Array;
            for (icol of columnStrs) {
                colStatementArr = icol.trim().split(/\s+/);
                if (colStatementArr.length == 1) {
                    // type is not given
                    colStatementObj = { name: colStatementArr[0] };
                } else {
                    // type is given
                    colStatementObj = { name: colStatementArr[0], dataType: colStatementArr[1] };
                }
                schemaArr.push(colStatementObj);
            }
            all_tables.push({ name: row["name"], schema: schemaArr });
        }
        
        // Render db view, given array of table metas
        function renderRows(err, rows) {
            res.render('db', { title: 'DB Tables Overview', all_tables: all_tables });
        }
        // Query db for rows, prepare array and render
        db.each("SELECT name, sql FROM sqlite_master WHERE type='table'",
            processRows, renderRows);

    });

    // GET single table view
    app.get('/table/:name/', function(req, res, next) {
        const tblname = req.params.name;
        var tblsql = null;
        // Render table view, given array of rows
        function renderValidRows(err, rows) {
            res.render('table', {
                title: 'DB Table · ' + tblname,
                all_rows: rows,
                name: tblname 
            });
        }
        // Render view depending on validity of given sqlite_master row
        function renderAny(err, row) {
            console.log(`Trying for "${JSON.stringify(row)}..."`);
            if(row != undefined) {
                // a table with given name exists
                tblsql = row["sql"];
                db.all("SELECT * FROM " + tblname,
                renderValidRows);
            } else {
                // a table with given name does not exist
                res.redirect("/table/");
            }
        }
        // Query db for rows and render
        db.get(
            `SELECT name, sql FROM sqlite_master WHERE type='table' AND name='${tblname}';`,
            renderAny
        );
    });
}

module.exports = setupRouting;
