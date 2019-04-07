/* eslint-disable promise/always-return */
/* eslint-disable promise/no-nesting */
import fs from 'fs';

import replaceInFile from 'replace-in-file';


// Add new .env.example lines to .env
async function addNewConfigOptions() {
  return new Promise((resolve, reject) => {
    const envFilePromise = fs.promises.readFile('.env', 'utf8');
    const exampleFilePromise = fs.promises.readFile('.env.example', 'utf8');

    Promise.all([envFilePromise, exampleFilePromise])
      .then((res) => {
        const envFile = res[0];
        const exampleFile = res[1];

        const envOptions = getOptions(envFile);
        const exampleOptions = getOptions(exampleFile);


        const writePromises = [];

        exampleOptions.forEach((exampleOption) => {
          if (!envOptions.find(envOption => envOption.key === exampleOption.key)) {
            writePromises.push(
              fs.promises.appendFile('.env', `\n${exampleOption.key}=${exampleOption.value}`)
            );
            process.env[exampleOption.key] = exampleOption.value;
          }
        });

        Promise.all(writePromises)
          .then(resolve)
          .catch(reject);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });


  function getOptions(file) {
    return file
      .split(/(\r\n)|\n/)
      .filter(str => str && str.trim())
      .map((str) => {
        const strPieces = str
          .replace(/^((.*?)\s*=(.*))/gm, '$2=$3')
          .split('=');

        return {
          key: strPieces[0],
          value: strPieces.slice(1).join('=')
        };
      });
  }
}

export default {
  addNewConfigOptions
};
