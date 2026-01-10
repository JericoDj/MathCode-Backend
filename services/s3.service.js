import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

export const uploadToS3 = async ({ fileBuffer, fileName, mimeType }) => {
  const bucket = process.env.AWS_BUCKET_NAME;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType
    })
  );

  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

export const deleteFromS3 = async (fileName) => {
  const bucket = process.env.AWS_BUCKET_NAME;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: fileName
    })
  );
};
