import 'dotenv/config';
import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import indexRouter from './routes/index';
import dataRouter from './routes/data';
import emailsRouter from './routes/emails';
import tutorsRouter from './routes/tutors';
import optionsRouter from './routes/options';
import blockersRouter from './routes/blockers';

import config from './lib/config';
import setmore from './lib/setmore-requests';


const app = express();

config.addNewConfigOptions();

// Make a session for getting appointments for each tutor
JSON.parse(process.env.tutors).forEach(() => setmore.addSession());
// These two are for the staff info and staff hours
setmore.addSession();
setmore.addSession();

// view engine setup
app.set('views', path.resolve('./views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.resolve('./public')));

app.use('/', indexRouter);
app.use('/data', dataRouter);
app.use('/emails', emailsRouter);
app.use('/tutors', tutorsRouter);
app.use('/options', optionsRouter);
app.use('/blockers', blockersRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
