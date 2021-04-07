var express = require('express');
var router = express.Router();

function setupRouting(app, db) {
    // GET home page
    app.get('/', function(req, res, next) {
        res.render('index', { title: 'Home' });
    }); 

    // GET tables overview
    app.get('/table/', function(req, res, next) {
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
                // TODO: seems to not work
                colStatementArr = icol.split(" ");
                if (colStatementArr.length == 2) {
                    // type is given
                    colStatementObj = { name: colStatementArr[1], dataType: colStatementArr[0] };
                } else {
                    // type is not given
                    colStatementObj = { name: colStatementArr[0] };
                }
                schemaArr.push(colStatementObj);
            }
            all_tables.push({ name: row["name"], schema: schemaArr });
        }
        var all_tables = [];
        
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
        // Render table view, given array of rows
        function renderValidRows(err, rows) {
            res.render('table', {
                title: 'DB Table',
                all_rows: rows,
                name: tblname 
            });
        }
        // Render view depending on validity of given array of rows
        function renderAny(err, rows) {
            console.log(`Trying for "${rows}..."`);
            if(rows.length > 0) {
                db.all("SELECT * FROM " + tblname,
                    renderValidRows);
            } else {
                res.redirect("/table/");
            }
        }
        // Query db for rows and render
        db.all(
            `SELECT name FROM sqlite_master WHERE type='table' AND name='${tblname}';`,
            renderAny
        );
    });
}

module.exports = setupRouting;
