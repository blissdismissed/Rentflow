// Quick test to verify S3 credentials and bucket access
require('dotenv').config();
const AWS = require('aws-sdk');

console.log('Testing S3 Connection...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('- AWS_REGION:', process.env.AWS_REGION || 'NOT SET');
console.log('- AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET || 'NOT SET');
console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? `SET (${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...)` : 'NOT SET');
console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET (hidden)' : 'NOT SET');
console.log('');

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

// Test 1: List buckets
console.log('Test 1: Listing S3 buckets...');
s3.listBuckets((err, data) => {
  if (err) {
    console.log('❌ Error listing buckets:', err.message);
    return;
  }

  console.log('✅ Successfully connected to S3');
  console.log('   Your buckets:');
  data.Buckets.forEach(bucket => {
    const marker = bucket.Name === process.env.AWS_S3_BUCKET ? ' ← TARGET BUCKET' : '';
    console.log(`   - ${bucket.Name}${marker}`);
  });
  console.log('');

  // Test 2: Check if target bucket exists
  const targetBucket = process.env.AWS_S3_BUCKET;
  const bucketExists = data.Buckets.some(b => b.Name === targetBucket);

  if (bucketExists) {
    console.log(`✅ Target bucket "${targetBucket}" exists`);

    // Test 3: Try to list objects in bucket
    console.log(`\nTest 2: Checking access to "${targetBucket}"...`);
    s3.listObjectsV2({ Bucket: targetBucket, MaxKeys: 5 }, (err, data) => {
      if (err) {
        console.log('❌ Error accessing bucket:', err.message);
        console.log('   Make sure your IAM user has permissions for this bucket');
      } else {
        console.log('✅ Successfully accessed bucket');
        console.log(`   Objects in bucket: ${data.KeyCount}`);
        if (data.Contents && data.Contents.length > 0) {
          console.log('   First few objects:');
          data.Contents.slice(0, 3).forEach(obj => {
            console.log(`   - ${obj.Key}`);
          });
        } else {
          console.log('   (Bucket is empty - ready for uploads!)');
        }
      }

      console.log('\n✅ S3 connection test complete!');
      console.log('   Your backend is ready to upload images.');
    });
  } else {
    console.log(`❌ Target bucket "${targetBucket}" NOT FOUND`);
    console.log('   Available buckets:', data.Buckets.map(b => b.Name).join(', '));
  }
});
