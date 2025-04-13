const path = require('path');
const database = require('./dbseed');
const express = require('express');
const session = require('express-session');
const { Issuer, generators } = require('openid-client'); 
require('dotenv').config()

const app = express();

let client;
// Initialize OpenID Client
async function initializeClient() {
    const issuer = await Issuer.discover(process.env.cognitoIssuer);
    client = new issuer.Client({
        client_id: process.env.cognitoClientID,
        client_secret: process.env.client_secret,
        redirect_uris: [process.env.cognitoURL],
        response_types: ['code']
    });
};
initializeClient().catch(console.error);

app.use(session({
    secret: 'some secret',
    resave: false,
    saveUninitialized: false
}));

const checkAuth = (req, res, next) => {
    if (!req.session.userInfo) {
        req.isAuthenticated = false;
    } else {
        req.isAuthenticated = true;
    }
    next();
};


app.get('/', checkAuth, async (req, res) => {
    console.log("Rendering results to index.ejs");
    res.render('index', {
        //result: results,
        isAuthenticated: req.isAuthenticated,
        userInfo: req.session.userInfo,
        //stockRemain: stockRemain,
    });
});

app.get("/get_data", async (req, res) => {
    const start_index = req.query.start_index;
    const number_of_record = req.query.num_record;
    const results = await database.getDBItems(start_index, number_of_record);
    const stockRemain = await database.scanAllItems("Ecom-stock");

    res.json({
        results:results,
        stockRemain:stockRemain
    });
});

// Helper function to get the path from the URL. Example: "http://localhost/hello" returns "/hello"
function getPathFromURL(urlString) {
    try {
        const url = new URL(urlString);
        return url.pathname;
    } catch (error) {
        console.error('Invalid URL:', error);
        return null;
    }
}

app.get('/login', (req, res) => {
    const nonce = generators.nonce();
    const state = generators.state();

    req.session.nonce = nonce;
    req.session.state = state;

    

    const authUrl = client.authorizationUrl({
        scope: 'email openid profile',
        state: state,
        nonce: nonce,
    });

    res.redirect(authUrl);
});


app.get(getPathFromURL(process.env.cognitoURL), async (req, res) => {
    console.log("Reaching redirect after logging")
    try {
        const params = client.callbackParams(req);
        const tokenSet = await client.callback(
            process.env.cognitoURL,
            params,
            {
                nonce: req.session.nonce,
                state: req.session.state
            }
        );
        const userInfo = await client.userinfo(tokenSet.access_token);
        req.session.userInfo = userInfo;

        res.redirect('/');
    } catch (err) {
        console.error('Callback error:', err);
        res.redirect('/');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    const logoutUrl = process.env.logoutUrl;
    res.redirect(logoutUrl);
});





let mapCart = new Map();

app.post('/add-to-cart/:itemName', (req, res) => {
    const productId = (req.params.itemName);
        
    if ( mapCart.has(productId) ) {
        mapCart.set( productId, mapCart.get( productId ) + 1) ;
    } else {
        mapCart.set( productId, 1) ;
    }

    console.log(mapCart);
    database.decreaseStock(productId);
    res.redirect('/');

});

app.get('/cart', checkAuth, async (req, res) => {
    const cartItems = [];

    // Get all item details from MySQL
    const allItems = await database.getDBItems(0, 1000);

    // Turn item list into a map for quick access
    const itemLookup = new Map();
    for (const item of allItems) {
        itemLookup.set(item.itemName, item.price); // assuming your MySQL table has 'price' column
    }

    // Prepare detailed cart data with price info
    for (const [itemName, quantity] of mapCart.entries()) {
        const price = itemLookup.get(itemName) || 0;
        const totalPrice = price * quantity;
        cartItems.push({
            name: itemName,
            quantity: quantity,
            price: price,
            totalPrice: totalPrice
        });
    }

    res.render('./cart.ejs', {
        cart: cartItems,
        isAuthenticated: req.isAuthenticated,
        userInfo: req.session.userInfo,
    });
});

app.post('/submit-cart', (req, res) => {
    mapCart.clear(); 

    res.redirect('/');
});


app.set('view engine', 'ejs');
app.use('/', express.static(path.join(__dirname, 'assets')));
app.listen(process.env.PORT || 8080, () => console.log('App available on http://localhost:8080'));
