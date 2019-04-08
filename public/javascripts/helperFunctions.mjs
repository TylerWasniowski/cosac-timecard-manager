// Taken from: https://stackoverflow.com/a/18197341
export function download(filename, text) {
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function formatDate(dateObject, separator) {
  return `${
    (dateObject.getMonth() + 1).toString().padStart(2, '0')
  }${separator}${
    dateObject.getDate().toString().padStart(2, '0')
  }${separator}${
    dateObject.getFullYear()
  }`;
}

export function formatUTCDate(dateObject, separator) {
  return `${
    (dateObject.getUTCMonth() + 1).toString().padStart(2, '0')
  }${separator}${
    dateObject.getUTCDate().toString().padStart(2, '0')
  }${separator}${
    dateObject.getUTCFullYear()
  }`;
}
