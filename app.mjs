import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from 'dotenv';
import indexRouter from './routes/index';
import dataRouter from './routes/data';
import tutorsRouter from './routes/tutors';
import optionsRouter from './routes/options';
import blockersRouter from './routes/blockers';
import setmore from './lib/setmore-requests';
import tutors from './data/tutors';

dotenv.config();

const app = express();

// Make a session for getting appointments for each tutor
tutors.forEach(() => setmore.addSession());
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
