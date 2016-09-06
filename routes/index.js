const _ = require('underscore');

exports.index = (req, res, next) => {
  res.render('index');
};

exports.terms = (req, res, next) => {
  res.render('terms');
};
