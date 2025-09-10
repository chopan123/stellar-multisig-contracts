/**
 * Setup Multisig Script
 * 
 * This script sets up a 2-of-3 multisig account by:
 * 1. Funding the master account via Friendbot
 * 2. Configuring the multisig with three signers
 * 3. Setting thresholds to require 2 signatures
 */

import {
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  rpc as SorobanRpc,
  Transaction,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ---------------------------------------------------------------------
// 0. Soroban RPC and Horizon (from environment variables)
const rpc = new SorobanRpc.Server(process.env.SOROBAN_RPC_URL!);
const horizon = new Horizon.Server(process.env.HORIZON_URL!);

// ---------------------------------------------------------------------
// 1. Generate key‑pairs from environment variables
const multisigMaster = Keypair.fromSecret(process.env.MASTER_SECRET!);
const signer1 = Keypair.fromPublicKey(process.env.SIGNER_PUBLIC_0!);
const signer2 = Keypair.fromPublicKey(process.env.SIGNER_PUBLIC_1!);
const signer3 = Keypair.fromPublicKey(process.env.SIGNER_PUBLIC_2!);

console.log("\n��  Multisig master:", multisigMaster.publicKey());
console.log("🔑  Signer 1       :", signer1.publicKey());
console.log("🔑  Signer 2       :", signer2.publicKey());
console.log("🔑  Signer 3       :", signer3.publicKey(), "\n");

// ---------------------------------------------------------------------
// Utility helpers

async function fundAccount(kp: Keypair) {
  console.log("💰 Funding account via Friendbot...");
  const resp = await fetch(
    `https://friendbot.stellar.org?addr=${kp.publicKey()}`
  );
  if (!resp.ok) {
    throw new Error("Friendbot funding failed");
  }
  console.log("✅ Account funded successfully");
}

async function sendHorizonTx(
  tx: Transaction,
  signers: Keypair[]
) {
  // Attach all requested signatures
  signers.forEach((kp) => tx.sign(kp));

  // Submit the fully‑signed transaction on‑chain
  return horizon.submitTransaction(tx);
}

// ---------------------------------------------------------------------
// Main flow
(async () => {
  try {
    // 1. Fund the new multisig account
    // await fundAccount(multisigMaster);

    // 2. Get the account info
    let msAccount = await rpc.getAccount(multisigMaster.publicKey());
    console.log("📊 Account sequence number:", msAccount.sequenceNumber());

    // 3. Configure multisig (2‑of‑3)
    console.log("⚙️  Setting up multisig configuration...");
    
    const setupTx = new TransactionBuilder(msAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .setTimeout(0)
      .addOperation(
        Operation.setOptions({
          // Master key weight set to 0 (can't sign transactions)
          masterWeight: 0,
          // Require 2 signatures for medium/high threshold ops
          lowThreshold: 0,
          medThreshold: 2,
          highThreshold: 2,
        })
      )
      .addOperation(
        Operation.setOptions({
          signer: { ed25519PublicKey: signer1.publicKey(), weight: 1 },
        })
      )
      .addOperation(
        Operation.setOptions({
          signer: { ed25519PublicKey: signer2.publicKey(), weight: 1 },
        })
      )
      .addOperation(
        Operation.setOptions({
          signer: { ed25519PublicKey: signer3.publicKey(), weight: 1 },
        })
      )
      .build();

    console.log("📝 Submitting multisig setup transaction...");
    const setupRes = await sendHorizonTx(setupTx, [multisigMaster]);
    
    if (setupRes.successful) {
      console.log("✅ Multisig setup successful!");
      console.log("📄 Transaction hash:", setupRes.hash);
      console.log("📄 Result XDR:", setupRes.result_xdr);
      
      // Refresh account to show new configuration using Horizon
      const updatedAccount = await horizon.loadAccount(multisigMaster.publicKey());
      console.log("\n📊 Updated account info:");
      console.log("   Master weight:", updatedAccount.masterWeight);
      console.log("   Low threshold:", updatedAccount.lowThreshold);
      console.log("   Med threshold:", updatedAccount.medThreshold);
      console.log("   High threshold:", updatedAccount.highThreshold);
      console.log("   Signers:", updatedAccount.signers.length);
      
      console.log("\n🎉 Multisig account is ready!");
      console.log("   - Requires 2 out of 3 signatures for transactions");
      console.log("   - Master key cannot sign transactions (weight = 0)");
      console.log("   - Use prepare-tx.ts to create transactions");
      
    } else {
      console.error("❌ Multisig setup failed");
      console.error("Result XDR:", setupRes.result_xdr);
    }
    
  } catch (error) {
    console.error("❌ Error setting up multisig:", error);
    process.exit(1);
  }
})();
