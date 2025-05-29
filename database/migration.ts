// Data Migration Script: MongoDB to PostgreSQL
// Run this script to migrate existing data from MongoDB to PostgreSQL

import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

// Load environment variables
const env = await load();

// MongoDB connection with explicit settings
const mongoClient = new MongoClient();
const mongoUri = env.MONGODB_URI || "mongodb://127.0.0.1:27017";
console.log(`Connecting to MongoDB at: ${mongoUri}`);

try {
  await mongoClient.connect(mongoUri);
  console.log("MongoDB connection successful!");
} catch (error) {
  console.error("MongoDB connection failed:", error);
  console.log("Trying alternative connection method...");
  
  // Try connecting without explicit URI
  try {
    await mongoClient.connect();
    console.log("MongoDB connection successful with default settings!");
  } catch (error2) {
    console.error("Alternative MongoDB connection also failed:", error2);
    Deno.exit(1);
  }
}

const mongoDb = mongoClient.database("cryptoportfolio");

// PostgreSQL connection
const pgClient = new Client({
  user: env.POSTGRES_USER || "postgres",
  database: env.POSTGRES_DB || "portfolio-tracker",
  hostname: env.POSTGRES_HOST || "localhost",
  port: parseInt(env.POSTGRES_PORT || "5432"),
  password: env.POSTGRES_PASSWORD || "postgres",
});

try {
  await pgClient.connect();
  console.log("PostgreSQL connection successful!");
} catch (error) {
  console.error("PostgreSQL connection failed:", error);
  Deno.exit(1);
}

interface MongoUser {
  _id: string;
  username: string;
  password: string;
  _class?: string;
}

interface MongoPortfolio {
  _id: string;
  userId: string;
  holdings: Record<string, number>;
  _class?: string;
}

// Map to store MongoDB user ID to PostgreSQL user ID mapping
const userIdMapping = new Map<string, string>();

async function migrateUsers() {
  console.log("Migrating users...");
  
  const users = await mongoDb.collection<MongoUser>("users").find({}).toArray();
  console.log(`Found ${users.length} users in MongoDB`);
  
  for (const user of users) {
    try {
      // First, check if user already exists
      const existingUser = await pgClient.queryObject<{id: string}>(
        `SELECT id FROM users WHERE username = $1`,
        [user.username]
      );
      
      let pgUserId: string;
      
      if (existingUser.rows.length > 0) {
        // User already exists, use existing ID
        pgUserId = existingUser.rows[0].id;
        console.log(`User already exists: ${user.username} (${user._id} -> ${pgUserId})`);
      } else {
        // Create new user
        pgUserId = crypto.randomUUID();
        
        await pgClient.queryObject(
          `INSERT INTO users (id, username, password_hash) 
           VALUES ($1, $2, $3)`,
          [pgUserId, user.username, user.password]
        );
        
        console.log(`Migrated user: ${user.username} (${user._id} -> ${pgUserId})`);
      }
      
      // Store the mapping for portfolio migration
      userIdMapping.set(user._id.toString(), pgUserId);
      console.log(`User mapping stored: ${user._id} -> ${pgUserId}`);
    } catch (error) {
      console.error(`Error migrating user ${user.username}:`, error);
    }
  }
  
  console.log(`Migrated ${users.length} users`);
  console.log(`User ID mapping size: ${userIdMapping.size}`);
  console.log(`User ID mappings:`, Array.from(userIdMapping.entries()));
}

async function migratePortfolios() {
  console.log("Migrating portfolios...");
  
  const portfolios = await mongoDb.collection<MongoPortfolio>("portfolios").find({}).toArray();
  console.log(`Found ${portfolios.length} portfolios in MongoDB`);
  
  for (const portfolio of portfolios) {
    try {
      // Get the PostgreSQL user ID from our mapping
      const pgUserId = userIdMapping.get(portfolio.userId);
      
      if (!pgUserId) {
        console.warn(`User mapping not found for portfolio ${portfolio._id} (userId: ${portfolio.userId})`);
        continue;
      }
      
      // Insert portfolio
      const portfolioResult = await pgClient.queryObject<{id: string}>(
        `INSERT INTO portfolios (id, user_id, name) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [crypto.randomUUID(), pgUserId, "Default Portfolio"]
      );
      
      const pgPortfolioId = portfolioResult.rows[0].id;
      
      // Insert holdings
      let holdingsCount = 0;
      for (const [symbol, amount] of Object.entries(portfolio.holdings)) {
        if (typeof amount === 'number' && amount > 0) {
          await pgClient.queryObject(
            `INSERT INTO holdings (id, portfolio_id, symbol, amount) 
             VALUES ($1, $2, $3, $4)`,
            [crypto.randomUUID(), pgPortfolioId, symbol.toUpperCase(), amount]
          );
          holdingsCount++;
        }
      }
      
      console.log(`Migrated portfolio ${portfolio._id} for user ${portfolio.userId} with ${holdingsCount} holdings`);
      console.log(`Holdings: ${JSON.stringify(portfolio.holdings)}`);
    } catch (error) {
      console.error(`Error migrating portfolio ${portfolio._id}:`, error);
    }
  }
  
  console.log(`Migrated ${portfolios.length} portfolios`);
}

async function seedCryptocurrencies() {
  console.log("Seeding cryptocurrency metadata...");
  
  // Common cryptocurrencies to seed
  const cryptos = [
    { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
    { id: "ethereum", symbol: "ETH", name: "Ethereum" },
    { id: "binancecoin", symbol: "BNB", name: "BNB" },
    { id: "solana", symbol: "SOL", name: "Solana" },
    { id: "ripple", symbol: "XRP", name: "XRP" },
    { id: "usd-coin", symbol: "USDC", name: "USD Coin" },
    { id: "tether", symbol: "USDT", name: "Tether" },
    { id: "staked-ether", symbol: "STETH", name: "Lido Staked Ether" },
    { id: "cardano", symbol: "ADA", name: "Cardano" },
    { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
    { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  ];
  
  for (const crypto of cryptos) {
    try {
      await pgClient.queryObject(
        `INSERT INTO cryptocurrencies (id, symbol, name) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (id) DO NOTHING`,
        [crypto.id, crypto.symbol, crypto.name]
      );
    } catch (error) {
      console.error(`Error seeding crypto ${crypto.id}:`, error);
    }
  }
  
  console.log(`Seeded ${cryptos.length} cryptocurrencies`);
}

async function runMigration() {
  try {
    console.log("Starting migration from MongoDB to PostgreSQL...");
    console.log("MongoDB database: cryptoportfolio");
    console.log("PostgreSQL database: portfolio-tracker");
    
    await migrateUsers();
    await migratePortfolios();
    await seedCryptocurrencies();
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoClient.close();
    await pgClient.end();
  }
}

// Run migration if this file is executed directly
if (import.meta.main) {
  await runMigration();
} 