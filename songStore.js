var config = require('./config.json');
var dataset = require('./dataset.json');
var XMLHttpRequest = require('xhr2');
var MongoClient = require('mongodb').MongoClient;

function getAuthorizationToken() {

    return new Promise(function (resolve, reject) {
        let request = new XMLHttpRequest();
        request.open('POST', 'https://accounts.spotify.com/api/token/', true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.setRequestHeader('Authorization', "Basic " + Buffer.from(config.clientID + ":" + config.clientSecret).toString('base64'));
        request.onload = function () {
            let data = JSON.parse(this.response);
            if (request.status === 200) {
                resolve(authorizationToken = data['access_token']);
            }
        };
        request.send("grant_type=client_credentials");
    })
}

function getArtist(token, artistName) {
    return new Promise(function (resolve, reject) {
        let request = new XMLHttpRequest();
        let url = 'https://api.spotify.com/v1/search?q=' + artistName + '&type=artist';
        request.open('GET', url, true);
        request.setRequestHeader('Authorization', "Bearer " + token);
        request.onload = function () {
            let data = JSON.parse(this.response);
            if (request.status === 200) {
                resolve(data["artists"]["items"][0]["id"]);
            }
            reject("no data.");
        };
        request.send();
    });
}

function getSongsOfArtist(artistId) {
    return new Promise(function (resolve) {
        let request = new XMLHttpRequest();
        request.open('GET', 'https://api.spotify.com/v1/artists/' + artistId + '/top-tracks?country=TR', true);
        request.setRequestHeader('Authorization', "Bearer " + authorizationToken);
        request.onload = function () {
            let data = JSON.parse(this.response);
            if (request.status === 200) {
                resolve(data["tracks"].map(track => parseTrackAsJson(track)));
            }
        };
        request.send();
    });
}

function parseTrackAsJson(track) {

    var trackInfo = {};
    trackInfo.artist = track["artists"][0]["name"];
    trackInfo.name = track["name"].split(/[-|(]/)[0].trim();
    trackInfo.preview_url = track["preview_url"];
    trackInfo.genre = "Turkish Pop";
    return trackInfo;
}

MongoClient.connect(config.databaseUrl, function (err, db) {
    if (err) {
        console.log("A connection problem is occured." + err);
    }
    var database = db.db('songStore');
    var collection = database.collection("turkish_pop");

    dataset.turkishPop.map(artist =>
        getAuthorizationToken()
            .then(token => getArtist(token, artist))
            .then(artistId => getSongsOfArtist(artistId))
            .then(trackList => collection.insertMany(trackList)));
});