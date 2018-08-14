var express = require('express');

var tutors = require('../data/tutors.json');

var router = express.Router();

router.get('/hours', function (req, res, next) {
    res.render('hours-options', {
      tutors
    });
});

router.get('/blockers', function (req, res, next) {
  res.render('blockers-options', {
    tutors
  });
});

module.exports = router;