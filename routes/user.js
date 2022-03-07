const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const createError = require('http-errors');
const aws = require('aws-sdk');
const { ERROR_MESSAGE } = require('../constants');

router.get('/me', (req, res, next) => {
  const { authorization } = req.headers;
  const accessToken = authorization.split(' ')[1];

  try {
    jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
      async (error, decoded) => {
        const { email } = decoded;
        const user = await User.findOne({ email });

        if (!user) {
          return next(createError(400, ERROR_MESSAGE.INVALID_USER));
        }

        if (error || decoded.email !== user.email) {
          return next(createError(403, ERROR_MESSAGE.FORBIDDEN));
        }

        return res.json({
          result: { email },
        });
      },
    );
  } catch (err) {
    next(createError(500, ERROR_MESSAGE.SERVER));
  }
});

router.get('/:email/gallery', async (req, res, next) => {
  const { authorization } = req.headers;
  const accessToken = authorization.split(' ')[1];
  const { email } = req.params;

  try {
    jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
      async (error, decoded) => {
        const userEmail = decoded.email;
        const user = await User.findOne({ email });

        if (error || userEmail !== user.email) {
          return next(createError(403, ERROR_MESSAGE.FORBIDDEN));
        }

        res.json({
          result: { gallery: user.gallery },
        });
      },
    );
  } catch (err) {
    next(createError(500, ERROR_MESSAGE.SERVER));
  }
});

router.post('/:email/gallery', async (req, res, next) => {
  const { authorization } = req.headers;
  const accessToken = authorization.split(' ')[1];
  const { email } = req.params;
  const photo = req.body;
  const { type, imageUrl, s3Key, musicUrl, artist, album, title, genre } =
    photo;
  const user = await User.findOne({ email });

  if (!user) {
    return next(createError(400, ERROR_MESSAGE.INVALID_USER));
  }

  try {
    jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
      async (error, decoded) => {
        const userEmail = decoded.email;

        if (error || userEmail !== user.email) {
          return next(createError(403, ERROR_MESSAGE.FORBIDDEN));
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
  } catch (err) {
    next(createError(500, ERROR_MESSAGE.SERVER));
  }
});

router.delete('/:email/gallery/:photoId', async (req, res, next) => {
  const { authorization } = req.headers;
  const accessToken = authorization.split(' ')[1];
  const { email, photoId } = req.params;
  const user = await User.findOne({ email });

  if (!user) {
    return next(createError(400, ERROR_MESSAGE.INVALID_USER));
  }

  const targetPhoto = user.gallery.filter(
    (photo) => String(photo._id) === photoId,
  );

  if (targetPhoto.type === 'Photo') {
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
        return next(createError(400, 'aws s3 delete error'));
      } else {
        console.log('aws s3 delete success' + data);
      }
    });
  }

  try {
    jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
      async (error, decoded) => {
        const userEmail = decoded.email;

        if (error || userEmail !== user.email) {
          return next(createError(403, ERROR_MESSAGE.FORBIDDEN));
        }

        await User.findOneAndUpdate(email, {
          $pull: { gallery: { _id: photoId } },
        });

        res.json({
          result: 'ok',
        });
      },
    );
  } catch (err) {
    next(createError(500, ERROR_MESSAGE.SERVER));
  }
});

router.get('/:email/gallery/:genre', async (req, res, next) => {
  const { authorization } = req.headers;
  const accessToken = authorization.split(' ')[1];
  const { email, genre } = req.params;

  try {
    jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
      async (error, decoded) => {
        const userEmail = decoded.email;
        const user = await User.findOne({ email });

        if (!user) {
          return next(createError(400, ERROR_MESSAGE.INVALID_USER));
        }

        if (error || userEmail !== user.email) {
          return next(createError(403, ERROR_MESSAGE.FORBIDDEN));
        }

        const sameGenreMusics = user.gallery.filter(
          (music) => music.genre[0] === genre || music.genre[1] === genre,
        );

        if (sameGenreMusics.length === 1) {
          return res.json({
            result: { musicUrl: sameGenreMusics[0].musicUrl },
          });
        }

        const index = Math.floor(Math.random() * sameGenreMusics.length);

        return res.json({
          result: { musicUrl: sameGenreMusics[index].musicUrl },
        });
      },
    );
  } catch (err) {
    next(createError(500, ERROR_MESSAGE.SERVER));
  }
});

module.exports = router;
