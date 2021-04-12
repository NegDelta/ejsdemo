var express = require('express');
var router = express.Router();

function setupRouting(app, db) {
    // GET home page
    app.get('/', function(req, res, next) {
        res.render('index', { title: 'Home' });
    }); 

    // Parse a SQL schema statement and return array of columns
    function getSchemaFromSql(sqlStr) {
        // extract schema from sql syntax
        const leftParenPos = sqlStr.indexOf("(");
        const schemaStr = sqlStr.slice(leftParenPos+1, -1);
        
        // divide schema into columns
        const columnStrs = schemaStr.split(",");
        
        var schemaArr = new Array;
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
        return schemaArr;
    }

    // GET tables overview
    app.get('/table/', function(req, res, next) {
        var all_tables = [];
        
        // Serialize given single row
        function processRow(err, row) {
            console.log(`Got row: "${JSON.stringify(row)}..."`);
            queryStr = row["sql"];
            const schema = getSchemaFromSql(queryStr); 
            console.log(`Got schema: "${JSON.stringify(schema)}..."`);
            all_tables.push({ name: row["name"], schema: schema });
        }
        
        // Render db view, given array of table metas
        function renderRows(err, rows) {
            console.log(`Trying for "${JSON.stringify(all_tables)}..."`);
            res.render('db', { title: 'DB Tables Overview', all_tables: all_tables });
        }
        // Query db for rows, prepare array and render
        db.each("SELECT name, sql FROM sqlite_master WHERE type='table'",
            processRow, renderRows);
    });

    // GET single table view
    app.get('/table/:name/', function(req, res, next) {
        const tblName = req.params.name;
        var tblSchema = null;
        // Render table view, given array of rows
        function renderValidRows(err, rows) {
            res.render('table', {
                title: 'DB Table · ' + tblName,
                all_rows: rows,
                name: tblName,
                schema: tblSchema
            });
        }
        // Render view depending on validity of given sqlite_master row
        function renderAny(err, row) {
            console.log(`Trying for "${JSON.stringify(row)}..."`);
            if(row != undefined) {
                // a table with given name exists
                tblSchema = getSchemaFromSql(row["sql"]);
                db.all("SELECT * FROM " + tblName,
                renderValidRows);
            } else {
                // a table with given name does not exist
                res.redirect("/table/");
            }
        }
        // Query db for rows and render
        db.get(
            `SELECT name, sql FROM sqlite_master WHERE type='table' AND name='${tblName}';`,
            renderAny
        );
    });
}

module.exports = setupRouting;
