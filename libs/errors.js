module.exports = (app) => {
  // Catch 404 errors
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    res.status(404);
    if (req.xhr) {
      res.send({
        message: err.message,
        error: {}
      });
    } else {
      res.render('error', {
        message: err.message,
        description: 'Page not found',
        error: {}
      });
    }
  });

  // catch 401 Unauthorized errors
  app.use((err, req, res, next) => {
    if (err.status !== 401) return next(err);
    res.status(401);
    if (req.xhr) {
      res.send({
        message: err.message,
        error: err
      });
    } else {
      res.render('error', {
        message: err.message,
        description: 'You need to log in to see this page.',
        error: err
      });
    }
  });


  // log all other errors
  app.use((err, req, res, next) => {
    console.error(err.stack || err);
    next(err);
  });

  // development 500 error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
      res.status(500);
      if (req.xhr) {
        res.send({
          message: err.message,
          error: err
        });
      } else {
        res.render('error', {
          message: err.message,
          error: err
        });
      }
    });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use((err, req, res, next) => {
    res.status(500);
    if (req.xhr) {
      res.send({
        message: err.message,
        error: {}
      });
    } else {
      res.render('error', {
        message: err.message,
        description: 'Server error',
        error: {}
      });
    }
  });
};
