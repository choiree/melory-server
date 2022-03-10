const axios = require('axios');
const express = require('express');
const router = express.Router();
const request = require('request');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const createError = require('http-errors');
const { ERROR_MESSAGE } = require('../constants');

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;

router.post('/login', (req, res, next) => {
  const code = req.body.code;
  console.log('😉CODE', code);
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: process.env.CLIENT_URL,
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

  request.post(authOptions, async function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const { access_token, refresh_token, expires_in } = body;
      console.log(
        '😡access_token, refresh_token, expires_in',
        access_token,
        refresh_token,
        expires_in,
      );

      try {
        const response = await axios.get('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
        const { email, display_name } = response.data;
        const user = await User.findOne({ email });

        if (!user) {
          const newUser = {
            email,
            name: display_name,
          };

          await User.create(newUser);
        }

        const accessToken = jwt.sign(
          { email: user.email },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: Number(process.env.ACCESS_TOKEN_MAX_AGE) },
        );

        res.json({
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresIn: expires_in,
          jwtAccessToken: accessToken,
          email,
        });
      } catch (err) {
        next(createError(401, ERROR_MESSAGE.UNAUTHORIZED));
      }
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

      return res.json({
        accessToken: access_token,
        expiresIn: expires_in,
      });
    }
  });
});

module.exports = router;
