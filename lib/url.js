function encode(string) {
  return encodeURIComponent(string).replace(/%20/g, '+');
}

function decode(string) {
  return decodeURIComponent(string.replace(/\+/g, '%20'));
}

exports.validateUrlParams = (params) => {
  return params.length >= 2 && params[0] !== 'undefined' && params[1] !== 'undefined';
}

exports.updateUrlParams = (params) => {
  if (!exports.validateUrlParams(params)) {
    return;
  }

  window.location.hash = params.map(encode).join('/');
};

exports.readUrlParams = () => {
  return window.location.hash.replace(/^#\/?|\/$/g, '').split('/').map(decode);
};

exports.getUrl = () => {
  return window.location.href;
};
