const mysql = require('mysql');
require('dotenv').config();




// function sendDBItems(res, req){

//     const con = mysql.createConnection({
//         host: process.env.HOST,
//         user: process.env.USER,
//         password: process.env.PASSWORD
//     });

//     if (req.query.itemName && req.query.category && req.query.price) {
//         console.log('Request received');
//         con.connect(function(err) {
//             con.query(`INSERT INTO main.storeItems (itemName, category, price) VALUES ('${req.query.itemName}', '${req.query.category}', '${req.query.price}')`, function(err, result, fields) {
//                 console.log(err);
//                 if (err) return(err);
//                 if (result) return({itemName: req.query.itemName, category: req.query.category, price: req.query.price});
//             });
//         });
//     } else {
//         console.log('Missing a parameter');
//     }
//     con.end();
// }

async function getDBItems(start_index, number_of_record){
  return new Promise((resolve, reject) => {
    const con = mysql.createConnection({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD
    });

    con.connect(err => {
      if (err) {
        reject(err); // Reject the promise if there's a connection error
        return;
      }
      con.query(`SELECT * FROM main.storeItems LIMIT ${start_index}, ${number_of_record}`, (err, result) => {
        con.end(); // Close the connection after the query
        if (err) {
          reject(err); // Reject the promise if there's a query error
          return;
        }
        resolve(result); // Resolve the promise with the query results
      });
    });
  });
}

module.exports = {getDBItems};