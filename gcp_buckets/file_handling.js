var serviceKey = require('../service/service_key');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage({keyFilename: './service/service_key.json'});

async function upload_file(bucketName,filename,uploadName) {
  //filename is the path to the local dir upload, uploadname is the name on
  //the GCP bucket
  // Uploads a local file to the bucket
  await storage.bucket(bucketName).upload(filename,{destination:uploadName});

 // console.log(`${filename} uploaded to ${bucketName}.`);
}

async function download_file(bucketName,srcFilename,destFilename) {
  const options = {
    // The path to which the file should be downloaded, e.g. "./file.txt"
    destination: destFilename,
  };

  // Downloads the file
  await storage
    .bucket(bucketName)
    .file(srcFilename)
    .download(options);

  // console.log(
  //   `gs://${bucketName}/${srcFilename} downloaded to ${destFilename}.`
  // );
}
function download_link(bucketName,filename){
  console.log(bucketName,filename);
  const config = {
    action: 'read',
    expires: Date.now()  + (1000*60 * 60)
  };
  //console.log(config);
  return storage.bucket(bucketName).file(filename).getSignedUrl(config);
}
module.exports = {upload_file,download_file,download_link};