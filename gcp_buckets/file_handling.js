var serviceKey = require('../service/service_key');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage({keyFilename: './service/service_key.json'});

async function upload_file(bucketName,filename,uploadName) {
  // Uploads a local file to the bucket
  await storage.bucket(bucketName).upload(filename,{destination:uploadName});

  console.log(`${filename} uploaded to ${bucketName}.`);
}

module.exports = {upload_file};