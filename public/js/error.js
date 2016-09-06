exports.handleError = (err, silent) => {
  console.error(err);

  if (!silent) {
    alert('An error has occurred. Please try again later.');
  }
};
