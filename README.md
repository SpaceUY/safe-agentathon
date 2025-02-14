# **Disclaimer**

⚠️ This product was entirely designed and developed within a one-week hackathon.

Agent keys are stored in memory, which is completely insecure. We strongly believe that connecting agents to custodial services, such as Fireblocks, is essential for security.

# **Agent Configuration & Demo Guide**

## **Agent Configuration**

To configure the agent, refer to:  
📂 `agent/src/_common/config/agent-config`

---

## **Demo Instructions**

⚠️ Sensitive information was shared for anyone to easily execute this repo

### **1️⃣ Preparing the Demo**

1. Configure **Agent 1** and **Agent 2** to receive 2FA requests via email:

   - Edit the following configuration files:
     - `agent/src/_common/config/agent1-config`
     - `agent/src/_common/config/agent2-config`
   - Modify the notification settings:
     ```json
     notificationTo: { type: "email", value: "[YOUR EMAIL]" }
     ```
   - ⚠️ **Important:** 2FA emails may be sent to your **SPAM** folder.

2. **Setting Up Your Authenticator:**
   - To get a valid 2FA code when prompted, configure your **Google Authenticator** (or similar) with the **TOTP secret** found in:
     - `agent1-config -> totp`
     - `agent2-config -> totp`
   - 🔑 **Both agents share the same TOTP secret for this demo.**

---

### **2️⃣ Running the Demo**

#### **Step 1: Start Agent 1**

```sh
cd agent
yarn start:agent1
```

🕐 **Wait until it starts.**

#### **Step 2: Start Agent 2**

Open another terminal and run:

```sh
cd agent
yarn start:agent2
```

✅ Both agents will log:

```
No proposals found
```

#### **Step 3: Start On-Chain Tests**

Open another terminal and navigate to `/onchain`:

```sh
cd onchain
```

Run the following command for **Base Testnet**:

```sh
npx hardhat test test/BoxUpgradeability.ts --network base_testnet
```

📌 Agents will log:

```
Waiting for a proposal on Sepolia
```

Then, run the command for **Sepolia Testnet**:

```sh
npx hardhat test test/BoxUpgradeability.ts --network sepolia_testnet
```

📌 Agents will log:

```
Upgrade checks passed
```

📌 Agents will now **request 2FA approval**.

#### **Step 4: Approve 2FA via Postman**

- Open **Postman** (or any API client).
- Send the **2FA codes** to the corresponding agents.

🔹 Once approved, the agents will:

- **Confirm transactions** ✅
- **Execute the upgrade** (Agent 1 handles execution & pays for gas) 🔥

---

## **3️⃣ Extra: Testing a Transfer Proposal**

If you want to test a **transfer proposal** instead of an upgrade:

1. Open the test file:  
   📂 `/onchain/test/BoxUpgradeability.ts`
2. Modify the test suite:
   - **Skip** the upgrade test:
     ```ts
     it.skip("Propose upgrade with proposer");
     ```
   - **Unskip** the transfer test:
     ```ts
     it("Propose transfer with proposer");
     ```
3. Run the demo following the same steps as before.

⚠️ **Note:** The multisig **must have at least 1 wei** for the transfer to succeed.  
👉 **No balance checks are performed!**

---
