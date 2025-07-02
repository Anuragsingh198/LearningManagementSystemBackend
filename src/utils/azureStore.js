const { BlobServiceClient } = require('@azure/storage-blob');
const { Readable } = require('stream');
const { v4: uuidv4 } = require('uuid');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

const uploadStreamToAzureBlob = async (fileBuffer, fileName, mimeType) => {
  const blobName = `${uuidv4()}-${fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const stream = Readable.from(fileBuffer);
  await blockBlobClient.uploadStream(stream, 4 * 1024 * 1024, 5, {
    blobHTTPHeaders: { blobContentType: mimeType },
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
