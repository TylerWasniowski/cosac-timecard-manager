export function download(filename, text) {
  const DOWNLOADER_SELECTOR = '#downloader';

  const downloader = document.querySelector(DOWNLOADER_SELECTOR);

  downloader.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
  downloader.setAttribute('download', filename);

  downloader.click();
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
