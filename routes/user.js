const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const createError = require('http-errors');

router.get('/me', (req, res, next) => {
  const { authorization } = req.headers;
  const accessToken = authorization.split(' ')[1];

  jwt.verify(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET,
    async (error, decoded) => {
      const { email } = decoded;
      const user = await User.findOne({ email });

      if (error || decoded.email !== user.email) {
        return next(createError(403, 'Forbidden'));
      }

      res.json({
        result: { email },
      });
    },
  );
});

router.get('/:email/gallery', async (req, res, next) => {
  const { authorization } = req.headers;
  const accessToken = authorization.split(' ')[1];
  const { email } = req.params;

  jwt.verify(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET,
    async (error, decoded) => {
      const userEmail = decoded.email;
      const user = await User.findOne({ email });

      if (error || userEmail !== user.email) {
        return next(createError(403, 'Forbidden'));
      }

      res.json({
        result: { gallery: user.gallery },
      });
    },
  );
});

module.exports = router;
