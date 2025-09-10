/**
 * Demonstration script: 2‑of‑3 Stellar multisig + Soroban swap
 *
 * Steps in this script
 * --------------------
 * 1. Generate a fresh multisig master account and three signer key‑pairs.
 * 2. Fund the master on **TESTNET** via Friendbot.
 * 3. Submit a SetOptions transaction that:
 *      • Adds the three signers (weight = 1 each)
 *      • Sets medium/high threshold = 2  → 2‑of‑3 required
 * 4. Build a `swap_exact_tokens_for_tokens` call to the Soroswap
 *    aggregator contract, using the multisig account as the caller.
 * 5. Sign that transaction with **signer 1 + signer 2** (2‑of‑3)
 *    and simulate it — nothing is actually sent to the network.
 *
 * You can change the contract address or arguments at the bottom if
 * you want to target a different contract.
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

// Load environment variables
dotenv.config();

// ---------------------------------------------------------------------
// 0. Soroban RPC (TESTNET)
const rpc = new SorobanRpc.Server("https://soroban-testnet.stellar.org");
const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");

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
// Utility helpers

async function fundAccount(kp: Keypair) {
  const resp = await fetch(
    `https://friendbot.stellar.org?addr=${kp.publicKey()}`
  );
  if (!resp.ok) {
    throw new Error("Friendbot funding failed");
  }
}

async function sendTx(
  tx: Transaction,
  simulateOnly: boolean,
  signers: Keypair[]
) {
  // First simulation to populate Soroban auth entries
  const sim = await rpc.simulateTransaction(tx);
  if (Api.isSimulationError(sim)) {
    console.log("🚀 ~ sendTx ~ sim:", sim)
    
    throw new Error("Initial simulation failed");

  }

  // Build the transaction with results from simulation
  const prepared = assembleTransaction(tx, sim).build();

  // Attach all requested signatures
  signers.forEach((kp) => prepared.sign(kp));

  if (simulateOnly) {
    // Second simulation – this one includes the signatures
    return rpc.simulateTransaction(prepared);
  }

  // Submit the fully‑signed transaction on‑chain
  return rpc.sendTransaction(prepared);
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
  // 2. Fund the new multisig account
  await fundAccount(multisigMaster);

  // 3. Configure multisig (2‑of‑3)
  let msAccount = await rpc.getAccount(multisigMaster.publicKey());

  const setupTx = new TransactionBuilder(msAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .setTimeout(0)
    .addOperation(
      Operation.setOptions({
        // Master key keeps weight 1 so it can still manage the account
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

  console.log("⚙️  Submitting multisig setup transaction …");
  const setupRes = await sendHorizonTx(setupTx, [multisigMaster]);
  console.log("   → Setup TX status:", setupRes.result_xdr, "\n");

  // Refresh account sequence after the successful setup
  msAccount = await rpc.getAccount(multisigMaster.publicKey());

  // -------------------------------------------------------------------
  // 4. Build the Soroswap swap invocation
  const router = new Contract(
    "CCMAPXWVZD4USEKDWRYS7DA4Y3D7E2SDMGBFJUCEXTC7VN6CUBGWPFUS" // Soroswap router (replace if needed)
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

  // -------------------------------------------------------------------
  // 5. Simulate with 2‑of‑3 signatures
  console.log("📝  Simulating swap with signer 1 + signer 2 …");
  const swapSim = await sendTx(swapTx, false, [signer1, signer3]);
  console.log(swapSim);
  // console.dir(swapSim, { depth: null });
})();
