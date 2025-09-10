/**
 * Prepare Transaction Script
 * 
 * This script creates a multisig swap transaction and exports it as XDR
 * for later signing by individual signers.
 */

import {
  Address,
  BASE_FEE,
  Contract,
  Horizon,
  Keypair,
  nativeToScVal,
  Networks,
  Operation,
  rpc as SorobanRpc,
  Transaction,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { Api, assembleTransaction } from "@stellar/stellar-sdk/rpc";
import * as dotenv from "dotenv";
import * as fs from "fs";

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

console.log("\n🔑  Multisig master:", multisigMaster.publicKey());
console.log("🔑  Signer 1       :", signer1.publicKey());
console.log("🔑  Signer 2       :", signer2.publicKey());
console.log("🔑  Signer 3       :", signer3.publicKey(), "\n");

// ---------------------------------------------------------------------
// Main flow
(async () => {
  try {
    // Get the multisig account
    const msAccount = await rpc.getAccount(multisigMaster.publicKey());

    // -------------------------------------------------------------------
    // Build the Soroswap swap invocation
    const router = new Contract(
      "CCMAPXWVZD4USEKDWRYS7DA4Y3D7E2SDMGBFJUCEXTC7VN6CUBGWPFUS" // Soroswap router
    );

    const swapArgs: xdr.ScVal[] = [
      nativeToScVal(10000000, { type: "i128" }), // amount in
      nativeToScVal(0, { type: "i128" }), // min amount out
      nativeToScVal(
        [
          "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
          "CDWEFYYHMGEZEFC5TBUDXM3IJJ7K7W5BDGE765UIYQEV4JFWDOLSTOEK",
        ].map((p) => new Address(p))
      ),
      // DEX distribution – 100 % on Soroswap for demo purposes
      new Address(multisigMaster.publicKey()).toScVal(), // caller
      nativeToScVal(Math.floor(Date.now() / 1000) + 3600, { type: "u64" }), // deadline
    ];

    const swapOp = router.call("swap_exact_tokens_for_tokens", ...swapArgs);

    const swapTx = new TransactionBuilder(msAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .setTimeout(0)
      .addOperation(swapOp)
      .build();

    // Simulate to populate auth entries
    const sim = await rpc.simulateTransaction(swapTx);
    if (Api.isSimulationError(sim)) {
      throw new Error("Simulation failed");
    }

    // Build the transaction with results from simulation
    const prepared = assembleTransaction(swapTx, sim).build();

    // Export as XDR
    const xdr = prepared.toXDR();
    
    // Save to file
    fs.writeFileSync("unsigned-tx.xdr", xdr);
    
    console.log("✅ Transaction prepared and saved to unsigned-tx.xdr");
    console.log("📄 XDR:", xdr);
    
  } catch (error) {
    console.error("❌ Error preparing transaction:", error);
    process.exit(1);
  }
})();
