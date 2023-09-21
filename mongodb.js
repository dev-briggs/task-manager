// Connection from MongoDB Docs
const { MongoClient, ObjectId } = require('mongodb')

// Connection URL
const url = process.env.MONGODB_URL;
const client = new MongoClient(url);

// const id = new ObjectId()

async function main() {
  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');

  return 'done.';
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(
  // () => client.close()
);