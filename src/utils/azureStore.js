const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  newPipeline
} = require('@azure/storage-blob');
const { Readable } = require('stream');
const { v4: uuidv4 } = require('uuid');

const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

const sharedKeyCredential = new StorageSharedKeyCredential(
  AZURE_STORAGE_ACCOUNT_NAME,
  AZURE_STORAGE_ACCOUNT_KEY
);

const customXmsVersionPolicy = {
  create: (nextPolicy, options) => ({
    sendRequest: async (request) => {
      request.headers.set('x-ms-version', '2023-11-03'); 
      return nextPolicy.sendRequest(request);
    }
  })
};

const pipeline = newPipeline(sharedKeyCredential);
pipeline.factories.unshift(customXmsVersionPolicy);

const blobServiceClient = new BlobServiceClient(
  `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  pipeline
);



const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

const uploadStreamToAzureBlob = async (fileBuffer, fileName, mimeType) => {
  const blobName = `${uuidv4()}-${fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const stream = Readable.from(fileBuffer);

  await blockBlobClient.uploadStream(stream, 4 * 1024 * 1024, 5, {
    blobHTTPHeaders: {
      blobContentType: mimeType || 'video/mp4'
    }
  });

  return {
    url: blockBlobClient.url,
    blobName
  };
};

const deleteFromAzureBlob = async (blobName) => {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
};

module.exports = {
  uploadStreamToAzureBlob,
  deleteFromAzureBlob
};
