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
//--------------------------dynamo db------------------------------------------------
const {DynamoDBClient, ListTablesCommand, PutItemCommand, GetItemCommand} = require("@aws-sdk/client-dynamodb");
const {DynamoDBDocumentClient, ScanCommand} = require("@aws-sdk/lib-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");



const user = new DynamoDBClient({
    region:'us-east-1',
    credentials: {
        accessKeyId:process.env.ACCESS,
        secretAccessKey:process.env.SECRETKEY
    }
});

const ddbDocClient = DynamoDBDocumentClient.from(user);


async function dynamoSetup() {
  const listTablesCommand = new ListTablesCommand();
  const e = await user.send(listTablesCommand);

  //put data into the table 

  //getDBItems(0, 1000);
  const stockLvl = await getDBItems(0, 1000);

  if(stockLvl.length > 0){ 
      for (let i = 0; i < stockLvl.length; i++) { 
          const name = stockLvl[i].itemName; 

          const putItemCommand = new PutItemCommand({
              TableName: 'Ecom-stock',
              Item: {
                  itemID:{
                      "S": name
                  },
                  quantity:{
                      "N": "99"
                  }
              }
          });
          await user.send(putItemCommand);
      } 
  } 
}
dynamoSetup ();

//read stock lvl from dynamo then decrease by 1 and reupload 
async function decreaseStock(name) {
  console.log (name);
  const getItemCommand = new GetItemCommand({
    TableName: "Ecom-stock",
    Key: {
      "itemID" : {
        "S" : name
      }
    }
  });
  const response = await user.send(getItemCommand);
  const newQuan = parseInt(response.Item.quantity.N) - 1;
  const dbNew = newQuan.toString();
  console.log(newQuan);


  //const stock = response.Item.quantity
  const putItemCommand = new PutItemCommand({
    TableName: 'Ecom-stock',
    Item: {
        itemID:{
            "S": name
        },
        quantity:{
            "N": dbNew
        }
    }
  });
  await user.send(putItemCommand);
}

async function scanAllItems(tableName) {
  let data = [];
  let ExclusiveStartKey;

  do {
    const params = {
      TableName: tableName,
      ExclusiveStartKey, // undefined on first call
    };

    data = await ddbDocClient.send(new ScanCommand(params));
    ExclusiveStartKey = data.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return data;
}



module.exports = {getDBItems, dynamoSetup, decreaseStock, scanAllItems};
