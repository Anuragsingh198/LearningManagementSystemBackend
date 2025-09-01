const {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
  SASProtocol
} = require('@azure/storage-blob');

const { v4: uuidv4 } = require('uuid');
const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

const generateSasUrl = ({ blobName, expiresInMinutes = 60 }) => {
    // console.log("Generating SAS URL for blob:", blobName);
  const credential = new StorageSharedKeyCredential(
    AZURE_STORAGE_ACCOUNT_NAME,
    AZURE_STORAGE_ACCOUNT_KEY
  );

  const expiresOn = new Date(new Date().valueOf() + expiresInMinutes * 60 * 1000);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: AZURE_CONTAINER_NAME,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn,
      protocol: SASProtocol.Https,
      version: "2023-11-03" 
    },
    credential
  ).toString();

  const url = `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${AZURE_CONTAINER_NAME}/${blobName}?${sasToken}`;
  return url;
};



const generateReadWriteSasUrl = ({ blobName = null, expiresInMinutes = 60 } = {}) => {
 if (!blobName) {
    blobName = `${uuidv4()}.mp4`;
  }

  const credential = new StorageSharedKeyCredential(
    AZURE_STORAGE_ACCOUNT_NAME,
    AZURE_STORAGE_ACCOUNT_KEY
  );

  const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: AZURE_CONTAINER_NAME,
      blobName,
      permissions: BlobSASPermissions.parse("rw"), 
      expiresOn,
      protocol: SASProtocol.Https,
      version: "2023-11-03"
    },
    credential
  ).toString();

  const uploadUrl = `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${AZURE_CONTAINER_NAME}/${blobName}?${sasToken}`;

  return { uploadUrl, blobName };
};

module.exports = { generateSasUrl , generateReadWriteSasUrl };