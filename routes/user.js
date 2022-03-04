const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const createError = require('http-errors');
const aws = require('aws-sdk');

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

router.post('/:email/gallery', async (req, res, next) => {
  const { authorization } = req.headers;
  const accessToken = authorization.split(' ')[1];
  const { email } = req.params;
  const photo = req.body;
  const { type, imageUrl, s3Key, musicUrl, artist, album, title, genre } =
    photo;
  const user = await User.findOne({ email });

  jwt.verify(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET,
    async (error, decoded) => {
      const userEmail = decoded.email;

      if (error || userEmail !== user.email) {
        return next(createError(403, 'Forbidden'));
      }

      await User.findOneAndUpdate(
        email,
        {
          $push: {
            gallery: {
              type,
              imageUrl,
              musicUrl,
              artist,
              album,
              title,
              genre,
              s3Key,
            },
          },
        },
        { new: true },
      );

      res.json({
        result: 'ok',
      });
    },
  );
});

router.delete('/:email/gallery/:photoId', async (req, res, next) => {
  const { authorization } = req.headers;
  const accessToken = authorization.split(' ')[1];
  const { email, photoId } = req.params;
  const user = await User.findOne({ email });
  const targetPhoto = user.gallery.filter(
    (photo) => String(photo._id) === photoId,
  );
  const Key = targetPhoto[0].s3Key;

  aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

  const s3 = new aws.S3({
    params: { Bucket: process.env.S3_BUCKET },
    region: process.env.RESION,
  });

  const params = {
    Bucket: process.env.REACT_APP_S3_BUCKET,
    Key,
  };

  s3.deleteObject(params, function (err, data) {
    if (err) {
      console.log('aws s3 delete error');
    } else {
      console.log('aws s3 delete success' + data);
    }
  });

  jwt.verify(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET,
    async (error, decoded) => {
      const userEmail = decoded.email;

      if (error || userEmail !== user.email) {
        return next(createError(403, 'Forbidden'));
      }

      await User.findOneAndUpdate(email, {
        $pull: { gallery: { _id: photoId } },
      });

      res.json({
        result: 'ok',
      });
    },
  );
});

module.exports = router;
