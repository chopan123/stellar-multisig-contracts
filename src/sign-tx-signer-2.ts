/**
 * Sign Transaction with Signer 2
 * 
 * This script loads a transaction signed by signer 1 and signs it with signer 2,
 * then exports the fully signed XDR.
 */

import {
  Keypair,
  Networks,
  Transaction,
} from "@stellar/stellar-sdk";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment variables
dotenv.config();

// ---------------------------------------------------------------------
// 1. Generate signer 2 keypair from environment variables
const signer2 = Keypair.fromPublicKey(process.env.SIGNER_PUBLIC_1!);

console.log("🔑  Signer 2:", signer2.publicKey());

// ---------------------------------------------------------------------
// Main flow
(async () => {
  try {
    // Check if transaction signed by signer 1 exists
    if (!fs.existsSync("signed-by-signer-1.xdr")) {
      throw new Error("signed-by-signer-1.xdr not found. Run sign-tx-signer-1.ts first.");
    }

    // Load the transaction signed by signer 1
    const signedXdr = fs.readFileSync("signed-by-signer-1.xdr", "utf8");
    const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);

    console.log("📄 Loaded transaction signed by signer 1");

    // Sign with signer 2
    tx.sign(signer2);

    // Export as XDR
    const fullySignedXdr = tx.toXDR();
    
    // Save to file
    fs.writeFileSync("fully-signed-tx.xdr", fullySignedXdr);
    
    console.log("✅ Transaction signed by signer 2 and saved to fully-signed-tx.xdr");
    console.log("📄 XDR:", fullySignedXdr);
    
  } catch (error) {
    console.error("❌ Error signing transaction:", error);
    process.exit(1);
  }
})();
