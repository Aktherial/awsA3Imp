const express = require('express');
const session = require('express-session');


const { readFile, readFileSync } = require('fs');
const path = require('path');
const database = require('./dbseed');
require('dotenv').config()


const { Issuer, generators } = require('openid-client');
const app = express();

let client;

// Initialize OpenID Client
async function initializeClient() {
    const issuer = await Issuer.discover(process.env.cognitoIssuer);
    client = new issuer.Client({
        client_id: process.env.cognitoClientID,
        client_secret: '<client secret>',
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
    const results = await database.getDBItems();
    const stockRemain = await database.scanAllItems("Ecom-stock");

    console.log("Rendering results to index.ejs");
    res.render('./index.ejs', {
        result: results,
        isAuthenticated: req.isAuthenticated,
        userInfo: req.session.userInfo,
        stockRemain: stockRemain,
    });
});

app.get('/login', (req, res) => {
    const nonce = generators.nonce();
    const state = generators.state();

    req.session.nonce = nonce;
    req.session.state = state;

    const authUrl = client.authorizationUrl({
        scope: 'phone openid email',
        state: state,
        nonce: nonce,
    });

    res.redirect(authUrl);
});


app.post('/items', (req, res) => {
  database.sendDBItems(res, req);
});


app.get('/items', (req, res) => {
  database.getDBItems(res, req);
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

app.get(getPathFromURL(process.env.cognitoURL), async (req, res) => {
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

app.set('view engine', 'ejs');
app.use('/', express.static(path.join(__dirname, 'assets')));
app.listen(process.env.PORT || 3000, () => console.log('App available on link'));

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
    res.render('./cart.ejs', {
        cart:mapCart,
        isAuthenticated: req.isAuthenticated,
    });
});
