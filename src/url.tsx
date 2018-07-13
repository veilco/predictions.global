export function updateQueryString(key: string, value: any, url?: string) {
  if(!window.history || !window.history.pushState) {
    return;
  }

  window.history.pushState({}, '', makeQueryString(key, value, url));
}

// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
export function getQueryString(key: string, url?: string) {
  if (!url) {
    url = window.location.href;
  }

  key = key.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + key + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);

  if (!results) {
    return '';
  }

  if (!results[2]) {
    return '';
  }

  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// https://stackoverflow.com/questions/5999118/how-can-i-add-or-update-a-query-string-parameter
function makeQueryString(key: string, value: any, url?: string) {
  if (!url) {
    url = window.location.href;
  }

  const re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi");
  let hash;

  if (re.test(url)) {
    if (typeof value !== 'undefined' && value !== null) {
      return url.replace(re, '$1' + key + "=" + value + '$2$3');
    }

    hash = url.split('#');
    url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
    if (typeof hash[1] !== 'undefined' && hash[1] !== null) {
      url += '#' + hash[1];
    }

    return url;
  }

  if (value != null) {
    const separator = url.indexOf('?') !== -1 ? '&' : '?';
    hash = url.split('#');
    url = hash[0] + separator + key + '=' + value;
    if (typeof hash[1] !== 'undefined' && hash[1] !== null) {
      url += '#' + hash[1];
    }

    return url;
  }

  return url;
}