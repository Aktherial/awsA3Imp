const express = require('express');
const { readFile, readFileSync } = require('fs');
const path = require('path');
const cognito = require('./cognito test');
const database = require('./dbseed');



const express = require('express');
const session = require('express-session');
const { Issuer, generators } = require('openid-client');
const app = express();

let client;

// Initialize OpenID Client
async function initializeClient() {
    const issuer = await Issuer.discover(cognitoIssuer);
    client = new issuer.Client({
        client_id: cognitoClientID,
        client_secret: '<client secret>',
        redirect_uris: [cognitoURL],
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


app.get('/', checkAuth, (req, res) => {
    res.render('./index.ejs', {
        isAuthenticated: req.isAuthenticated,
        userInfo: req.session.userInfo,

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


app.post('/users', (req, res) => {
  res.send(database.setDBItems());
});


app.get('/users', (req, res) => {
  res.send(database.getDBItems ());
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

app.get(getPathFromURL('cognitoURL'), async (req, res) => {
    try {
        const params = client.callbackParams(req);
        const tokenSet = await client.callback(
            'cognitoURL',
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
    const logoutUrl = `https://<user pool domain>/logout?client_id=74pa1u1b7tvqvmhu6tqijidap9&logout_uri=<logout uri>`;
    res.redirect(logoutUrl);
});

app.set('view engine', 'ejs');





// app.use('/', express.static(path.join(__dirname, 'assets')));

app.listen(process.env.PORT || 3000, () => console.log('App available on link'));
