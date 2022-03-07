require('dotenv').config();
require('./db')();
const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const authsRouter = require('./routes/auth');
const usersRouter = require('./routes/user');
const { ERROR_MESSAGE } = require('./constants');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use('/auth', authsRouter);
app.use('/user', usersRouter);

app.use((req, res, next) => {
  next(createError(404, ERROR_MESSAGE.NOT_FOUND));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.json({ result: 'error', error: err.message });
});

module.exports = app;
