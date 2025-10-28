/**
 * x402 Compliant Solana Server
 *
 * This server uses the official x402-express middleware to handle
 * micropayments in USDC on Solana devnet.
 *
 * Setup:
 * 1. npm install express x402-express @coinbase/x402 dotenv
 * 2. Create .env with: RECIPIENT_ADDRESS=your_solana_address
 * 3. npm install -D @types/express tsx
 * 4. Run: tsx x402-demo-server.ts
 */

import express from "express";
import { paymentMiddleware, type SolanaAddress } from "x402-express";
import { facilitator } from "@coinbase/x402";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Your Solana address to receive USDC payments
const RECIPIENT: SolanaAddress =
  (process.env.RECIPIENT_ADDRESS as SolanaAddress) ||
  ("seFkxFkXEY9JGEpCyPfCWTuPZG9WK6ucf95zvKCfsRX" as SolanaAddress);

console.log("🚀 Starting x402 Solana Server");
console.log(`💰 Recipient address: ${RECIPIENT}`);
console.log(`🌐 Network: solana-devnet`);

// Apply x402 payment middleware
// This automatically handles:
// - 402 responses with payment requirements
// - Payment verification (pre-flight checks)
// - Transaction submission via facilitator
// - Settlement confirmation
app.use(
  paymentMiddleware(RECIPIENT, {
    // Protected endpoint: requires $0.001 USDC payment
    "GET /premium": {
      price: "$0.001", // Price in USD (converted to USDC)
      network: "solana-devnet", // Solana devnet
    },

    // Another endpoint with different price
    "GET /expensive": {
      price: "$0.01",
      network: "solana-devnet",
    },
  })
);

// Protected endpoints - only accessible after payment
app.get("/premium", (req, res) => {
  res.json({
    message: "🎉 Premium content accessed!",
    data: {
      secret: "This is premium content",
      timestamp: new Date().toISOString(),
    },
  });
});

app.get("/expensive", (req, res) => {
  res.json({
    message: "💎 Expensive content accessed!",
    data: {
      secret: "This is very expensive premium content",
      timestamp: new Date().toISOString(),
    },
  });
});

// Public endpoint (no payment required)
app.get("/", (req, res) => {
  res.json({
    message: "x402 Solana Server",
    endpoints: {
      "/": "Public - no payment required",
      "/premium": "Protected - $0.001 USDC payment required",
      "/expensive": "Protected - $0.01 USDC payment required",
    },
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}`);
  console.log(`\n📍 Endpoints:`);
  console.log(`   GET /          - Public (no payment)`);
  console.log(`   GET /premium   - $0.001 USDC payment required`);
  console.log(`   GET /expensive - $0.01 USDC payment required`);
  console.log(`\n💡 Test with the client: tsx x402-demo-client.ts\n`);
});
