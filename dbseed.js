const mysql = require('mysql');

const con = mysql.createConnection({
    host: "",
    user: "",
    password: ""
});

con.connect(function(err) {
    if (err) throw err;

    con.query('CREATE DATABASE IF NOT EXISTS main;');
    con.query('USE main;');
    con.query('CREATE TABLE IF NOT EXISTS users(id int NOT NULL AUTO_INCREMENT, itemName varchar(30), category varchar(255), price int, PRIMARY KEY(id));', function(error, result, fields) {
        console.log(result);
    });
    con.end();
});
function sendDBItems(){
    if (req.query.itemName && req.query.category && req.query.price) {
        console.log('Request received');
        con.connect(function(err) {
            con.query(`INSERT INTO main.users (itemName, category, price) VALUES ('${req.query.itemName}', '${req.query.category}', '${req.query.price}')`, function(err, result, fields) {
                if (err) return(err);
                if (result) return({itemName: req.query.itemName, category: req.query.category, price: req.query.price});
            });
        });
    } else {
        console.log('Missing a parameter');
    }
}

function getDBItems(){
    con.connect(function(err) {
        con.query(`SELECT * FROM main.users`, function(err, result, fields) {
            if (err) res.send(err);
            if (result) res.send(result);
        });
    });
}