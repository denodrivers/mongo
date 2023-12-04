import { MongoClient } from '../mod.ts';

for (let x = 0; x < 100000; x++) {
  const client = new MongoClient();

  const url = `mongodb://testadmin1:testpass1@localhost:27017?directConnection=true`
  console.log('url:', url);
  await client.connect(url);

  await client.close()
  console.log('');
}
