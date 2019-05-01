var config = require('./config.json');
var XMLHttpRequest = require('xhr2');

let authorizationToken = null;

function getAuthorizationToken() {

    return new Promise(function(resolve,reject) {
        let request = new XMLHttpRequest();
        request.open('POST', 'https://accounts.spotify.com/api/token/', true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.setRequestHeader('Authorization', "Basic " + Buffer.from(config.clientID + ":" + config.clientSecret).toString('base64'));
        request.onload = function () {
            let data = JSON.parse(this.response);
            if (request.status === 200) {
                console.log(data['access_token']);
                resolve(authorizationToken = data['access_token']);
            }
        };
        request.send("grant_type=client_credentials");
    })
}

function getSong() {
    let request = new XMLHttpRequest();
    request.open('GET', 'https://api.spotify.com/v1/tracks/2TpxZ7JUBn3uw46aR7qd6V', true);
    request.setRequestHeader('Authorization', "Bearer " + authorizationToken);
    request.onload = function () {
        let data = JSON.parse(this.response);
        console.log(data['album']['type']);
    };
    request.send();
}

getAuthorizationToken().then(getSong);
