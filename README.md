

# Stellar **2‑of‑3 Multisig** + **Soroban Swap** Proof‑of‑Concept

This mini‑repo shows how a **classic Stellar multisig account** can call a **Soroban smart‑contract method** (here a token‑swap on Soroswap) with nothing more than the normal L1 signing rules.  
It is a complete, reproducible walkthrough you can run on **TESTNET** in under a minute.

---

## What the script does

| Step | Action | Why it matters |
|------|--------|----------------|
| 1 | Generates one master key & three signer key‑pairs (**Keypair.random()**) | Keeps everything self‑contained—no secret keys needed. |
| 2 | Funds the master account with **Friendbot** | Ensures the new account exists & has lumens for fees. |
| 3 | Sends a **`SetOptions`** transaction that<br>• adds the three signers (weight = 1 each)<br>• sets *medium & high thresholds* = 2 | That creates a **2‑of‑3** multisig account on classic Stellar. |
| 4 | Builds a `swap_exact_tokens_for_tokens` call to the **Soroswap router** contract | Demonstrates a real Soroban contract invocation that will move tokens. |
| 5 | Signs the swap TX with **signer 1 + signer 2** (2 signatures ≥ threshold) and **simulates** it | Proves that ordinary multisig signatures satisfy `require_auth()` inside Soroban. |

> **Result:** The simulation returns **SUCCESS** without writing to the ledger. Swap execution would succeed exactly the same way if you replaced the final `simulate` with a `sendTransaction`.

---

## Running it yourself

```bash
# 1. Install deps
pnpm install      # or npm i / yarn

# 2. Run
pnpm ts-node src/index.ts
```

You will see:

* Public keys for the master & 3 signers  
* Horizon response for the multisig‑setup transaction  
* Simulation JSON for the swap signed by 2 of 3 signers  

Feel free to replace the contract address, token addresses, or amount in `src/index.ts`.

---

## Prerequisites

* Node ≥ 18
* `pnpm` (or your favourite package manager)
* Internet access (to hit Friendbot, Horizon, and `https://soroban-testnet.stellar.org`)

Everything else is handled by the script—no environment variables, no funded keys, no Docker.

---

## Customising

* **Thresholds / weights** – tweak the `SetOptions` ops.  
* **Additional signers** – just add more `setOptions({ signer: … })` lines.  
* **Mainnet** – swap the Horizon & RPC URLs, **remove Friendbot funding**, and **fund the master account yourself**. *(Be careful – on mainnet these ops are irreversible and cost real lumens.)*  
* **Different contract** – change the `router` address and the method / args.

---

## Key takeaways

1. **Classic multisig works for Soroban.** The built‑in “Stellar Account” authorizer sums the signature weights exactly as Horizon does for payments.  
2. **No extra smart‑wallet contract is needed** unless you want per‑method thresholds or unconventional auth schemes.  
3. **Simulation first, signing second.** You must run `simulateTransaction` before you attach the signer signatures so the host can produce the AuthEntries.

---

## License

MIT – do whatever you like, just don’t blame me if you lose money in production. 🌟