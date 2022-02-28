const express = require('express');
const router = express.Router();
const request = require('request');

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;

router.post('/login', (req, res, next) => {
  const code = req.body.code;

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: 'http://localhost:3000',
      grant_type: 'authorization_code',
    },
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString(
          'base64',
        ),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;

      res.json({
        accessToken: access_token,
        refreshToken: body.refresh_token,
        expiresIn: body.expires_in,
      });
    }
  });
});

router.post('/refresh', (req, res) => {
  const refreshToken = req.body.refreshToken;

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString(
          'base64',
        ),
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const { access_token, expires_in } = body;

      res.json({
        accessToken: access_token,
        expiresIn: expires_in,
      });
    }
  });
});

module.exports = router;
