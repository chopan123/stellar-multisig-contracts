/**
 * Send Transaction Script
 * 
 * This script loads a fully signed XDR transaction and submits it to the network.
 */

import {
  Networks,
  Transaction,
} from "@stellar/stellar-sdk";
import { rpc as SorobanRpc } from "@stellar/stellar-sdk";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment variables
dotenv.config();

// ---------------------------------------------------------------------
// 0. Soroban RPC (from environment variables)
const rpc = new SorobanRpc.Server(process.env.SOROBAN_RPC_URL!);

// ---------------------------------------------------------------------
// Main flow
(async () => {
  try {
    // Check if fully signed transaction exists
    if (!fs.existsSync("fully-signed-tx.xdr")) {
      throw new Error("fully-signed-tx.xdr not found. Run sign-tx-signer-2.ts first.");
    }

    // Load the fully signed transaction
    const signedXdr = fs.readFileSync("fully-signed-tx.xdr", "utf8");
    const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);

    console.log("📄 Loaded fully signed transaction");
    console.log("🚀 Submitting transaction to network...");

    // Submit the transaction
    const result = await rpc.sendTransaction(tx);
    
    console.log("✅ Transaction submitted successfully!");
    console.log("📄 Result:", result);
    
    // Clean up intermediate files
    if (fs.existsSync("unsigned-tx.xdr")) {
      fs.unlinkSync("unsigned-tx.xdr");
      console.log("🧹 Cleaned up unsigned-tx.xdr");
    }
    if (fs.existsSync("signed-by-signer-1.xdr")) {
      fs.unlinkSync("signed-by-signer-1.xdr");
      console.log("🧹 Cleaned up signed-by-signer-1.xdr");
    }
    if (fs.existsSync("fully-signed-tx.xdr")) {
      fs.unlinkSync("fully-signed-tx.xdr");
      console.log("🧹 Cleaned up fully-signed-tx.xdr");
    }
    
  } catch (error) {
    console.error("❌ Error sending transaction:", error);
    process.exit(1);
  }
})();
