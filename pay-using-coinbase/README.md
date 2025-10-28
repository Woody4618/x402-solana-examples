# x402 with Coinbase Facilitator

Pay-per-request API using Coinbase's official x402 libraries with facilitator service on Solana devnet.

[← Back to Examples](../README.md)

## Quickstart

From the project root:

### Terminal 1: Start the Coinbase x402 server

```bash
npm run coinbase:server
```

### Terminal 2: Run the client

```bash
npm run coinbase:client
```

## Overview

This example demonstrates x402 payments using **Coinbase's official x402 implementation** with their facilitator service.

**Key Features:**

- **Gasless Payments** - Users don't need SOL for transaction fees (facilitator pays)
- **Official Libraries** - Uses `x402-express` and `x402-axios` packages
- **Automatic Handling** - No manual transaction creation, signing, or verification
- **Production Ready** - Same libraries used in production systems

## Setup

### 1. Install Dependencies

```bash
cd ..  # Go to project root
npm install
```

### 2. Get CDP API Keys

The Coinbase facilitator requires API credentials from Coinbase Developer Platform:

```bash
# Visit https://portal.cdp.coinbase.com/
# 1. Create an account or sign in
# 2. Create a new API key
# 3. Copy your API Key ID and Secret
```

**Note:** The free tier works for devnet testing!

### 3. Configure Environment

Create a `.env` file in the project root:

```bash
# Coinbase Developer Platform credentials
CDP_API_KEY_ID=your_api_key_id_here
CDP_API_KEY_SECRET=your_api_key_secret_here

# Optional: customize recipient address
RECIPIENT_ADDRESS=seFkxFkXEY9JGEpCyPfCWTuPZG9WK6ucf95zvKCfsRX
```

### 4. Get Devnet USDC

The client wallet needs USDC for payments:

```bash
# Get your wallet address
solana address -k pay-using-coinbase/client.json

# Option 1: Use Circle's USDC faucet (easiest)
# Visit: https://faucet.circle.com/
# Select "Solana Devnet" and paste your address

# Option 2: Use SPL Token faucet
# Visit: https://spl-token-faucet.com/
# Select USDC and enter your address
```

**Important:** You typically don't need SOL in the client wallet because the facilitator pays gas fees!

### 5. Run the Example

Start the server:

```bash
npm run coinbase:server
```

You should see:

```
🚀 Starting x402 Solana Server
💰 Recipient address: sexvB...FpZtG
🌐 Network: solana-devnet
✅ Server running at http://localhost:3000
```

In another terminal, run the client:

```bash
npm run coinbase:client
```

Expected output:

```
🚀 x402 Solana Client Demo
💳 Wallet: cLYaE...FpZtG

1️⃣  Accessing public endpoint (/)...
✅ Success (no payment required)

2️⃣  Accessing premium endpoint (/premium)...
   💰 Payment required: $0.001 USDC
   🔄 Creating and signing transaction...
✅ Payment successful!
   📝 Transaction: 4eEK8...44uG
   🔗 Explorer: https://explorer.solana.com/tx/4eEK8...44uG?cluster=devnet
```

## How It Works

### Server Side

The server uses `x402-express` middleware that automatically:

1. **Returns 402 responses** with payment requirements
2. **Verifies transactions** via the facilitator
3. **Submits transactions** to Solana blockchain
4. **Confirms settlement** before serving content

```typescript
import { paymentMiddleware } from "x402-express";
import { facilitator } from "@coinbase/x402";

app.use(
  paymentMiddleware(
    recipientAddress,
    {
      "GET /premium": {
        price: "$0.001",
        network: "solana-devnet",
      },
    },
    facilitator // Coinbase facilitator pays gas fees
  )
);

app.get("/premium", (req, res) => {
  // Only reached after successful payment
  res.json({ secret: "Premium content!" });
});
```

### Client Side

The client uses `x402-axios` interceptor that automatically:

1. **Detects 402 responses** with payment requirements
2. **Creates SPL token transfer** transactions
3. **Signs with user wallet** (but doesn't submit)
4. **Retries request** with signed transaction in `X-Payment` header

```typescript
import { withPaymentInterceptor, createSigner } from "x402-axios";

const signer = await createSigner("solana-devnet", privateKeyBase58);
const client = withPaymentInterceptor(axios.create(), signer);

// Automatically handles payment when needed!
const response = await client.get("/premium");
```

### Payment Flow

```
1. Client → Server: GET /premium
2. Server → Client: 402 Payment Required
   {
     "amount": "$0.001",
     "recipient": "sexvB...",
     "network": "solana-devnet"
   }

3. Client creates & signs transaction (doesn't submit)

4. Client → Server: GET /premium (with X-Payment header)
5. Server → Facilitator: Verify transaction
6. Facilitator: ✓ Valid transaction
7. Facilitator → Solana: Submit transaction (pays gas)
8. Solana: ✓ Transaction confirmed
9. Server → Client: 200 OK + content + transaction signature
```

## What Makes This Different

### Compared to Manual Examples (pay-in-sol, pay-in-usdc)

| Feature                      | Manual Examples      | Coinbase Example    |
| ---------------------------- | -------------------- | ------------------- |
| **Transaction Creation**     | Manual code          | Automatic           |
| **Transaction Verification** | Manual introspection | Facilitator handles |
| **Transaction Submission**   | Server submits       | Facilitator submits |
| **Gas Fees**                 | Payer needs SOL      | Facilitator pays    |
| **Code Complexity**          | ~200 lines           | ~50 lines           |
| **Production Ready**         | Reference only       | Production grade    |

### Benefits of Coinbase Facilitator

✅ **Gasless for Users** - Users only need USDC, no SOL required
✅ **Lower Complexity** - Libraries handle all transaction logic
✅ **Better UX** - Users don't worry about gas or transaction details
✅ **Scalable** - Coinbase infrastructure handles load
✅ **Maintained** - Official libraries receive updates

### Trade-offs

⚠️ **Requires CDP Account** - Must register and get API keys
⚠️ **Third-party Dependency** - Relies on Coinbase's service
⚠️ **Less Customization** - Fixed payment flow and verification

## Security Features

### Coinbase Facilitator Handles

1. **Transaction Validation**

   - Verifies correct recipient and amount
   - Checks signature validity
   - Ensures transaction is well-formed

2. **Replay Protection**

   - Tracks transaction signatures
   - Prevents duplicate submissions
   - Rejects invalid transactions before submission

3. **Rate Limiting**

   - Prevents abuse of facilitator service
   - Protects against spam attacks

4. **Secure Submission**
   - Uses authenticated RPC endpoints
   - Handles transaction priority fees
   - Manages nonce and retry logic

## Configuration

### Endpoint Prices

Configure different prices for different endpoints:

```typescript
paymentMiddleware(recipient, {
  "GET /basic": {
    price: "$0.001",
    network: "solana-devnet",
  },
  "GET /premium": {
    price: "$0.01",
    network: "solana-devnet",
  },
  "POST /api/data": {
    price: "$0.05",
    network: "solana-devnet",
  },
});
```

### Custom Facilitator (Advanced)

You can configure your own facilitator instead of Coinbase's:

```typescript
import { createFacilitatorConfig } from "@coinbase/x402";

const customFacilitator = {
  url: "https://your-facilitator.com",
  createAuthHeaders: async () => ({
    verify: { Authorization: "Bearer your-token" },
    settle: { Authorization: "Bearer your-token" },
    supported: { Authorization: "Bearer your-token" },
  }),
};

app.use(paymentMiddleware(recipient, routes, customFacilitator));
```

## Moving to Production (Mainnet)

### 1. Update Network

Change network from devnet to mainnet:

```typescript
"GET /premium": {
  price: "$0.001",
  network: "solana", // mainnet
}
```

### 2. Use Real USDC

Mainnet USDC mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

### 3. Configure CDP for Production

Update `.env`:

```bash
# Production CDP credentials (not test/sandbox)
CDP_API_KEY_ID=production_key_id
CDP_API_KEY_SECRET=production_key_secret
```

### 4. Security Checklist

- [ ] Use production CDP API keys
- [ ] Enable HTTPS on your server
- [ ] Set up proper logging and monitoring
- [ ] Configure rate limiting on endpoints
- [ ] Test with small amounts first
- [ ] Monitor facilitator usage/costs
- [ ] Have fallback error handling

## Troubleshooting

### "Failed to get supported payment kinds: Unauthorized"

**Cause:** CDP API keys not configured or invalid

**Solution:**

1. Check `.env` file exists with `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET`
2. Verify keys are correct from https://portal.cdp.coinbase.com/
3. Ensure keys are for the correct environment (sandbox vs production)

### "Insufficient funds" or "Account not found"

**Cause:** Client wallet doesn't have USDC

**Solution:**

```bash
# Get devnet USDC
# Visit: https://faucet.circle.com/ (select Solana Devnet)
# Or: https://spl-token-faucet.com/ (select USDC)
```

### Client shows "socket hang up" or "ECONNRESET"

**Cause:** Server crashed or restarted during request

**Solution:**

1. Check server logs for errors
2. Ensure server is running: `npm run coinbase:server`
3. Verify CDP credentials are valid
4. Check network connectivity

### "Payment successful but balance didn't change"

**Cause:** Transaction succeeded but viewing wrong account

**Solution:**

```bash
# Check USDC balance (not SOL balance!)
spl-token balance 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
  --url devnet \
  --owner <YOUR_WALLET_ADDRESS>
```

### Facilitator rate limiting

**Cause:** Too many requests to facilitator

**Solution:**

- Implement client-side rate limiting
- Add delays between test requests
- Check CDP dashboard for limits
- Consider upgrading CDP plan for production

## Resources

- **x402 Specification:** https://x402.org
- **Coinbase x402 GitHub:** https://github.com/coinbase/x402
- **CDP Portal:** https://portal.cdp.coinbase.com/
- **Solana Explorer (Devnet):** https://explorer.solana.com/?cluster=devnet
- **USDC Devnet Faucet:** https://faucet.circle.com/

## Why Use Coinbase Facilitator?

### Best For:

- **Production applications** requiring reliability
- **Consumer-facing apps** where users shouldn't worry about gas
- **Quick prototypes** needing minimal setup
- **Projects** that can depend on third-party services

### Consider Manual Implementation If:

- Need full control over transaction flow
- Want to minimize external dependencies
- Have specific verification requirements
- Running on networks facilitator doesn't support

---

**Ready to build?** This example is production-ready with proper CDP configuration! 🚀
