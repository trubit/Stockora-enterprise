import { config } from '../src/config/environment.js';

async function seed() {
  console.log('Stockora Database Seeder Active (Placeholder).');
  console.log(`Configured target database connection: ${config.mongodbUri}`);
  
  // Future implementation will connect to MongoDB, truncate collections, 
  // and load mock catalog items, transfers, and transactions.
  
  process.exit(0);
}

seed();
