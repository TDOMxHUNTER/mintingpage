const express = require('express');
const { Wallet } = require('ethers');
const cors = require('cors');

// Basic server setup
const app = express();
const port = 8080;
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
// Load the backend's private key from environment variables.
// IMPORTANT: Never expose this private key publicly!
const privateKey = process.env.BACKEND_SIGNER_PRIVATE_KEY;
if (!privateKey) {
    console.error("FATAL ERROR: BACKEND_SIGNER_PRIVATE_KEY is not set.");
    process.exit(1);
}
const signerWallet = new Wallet(privateKey);

// --- COOLDOWN LOGIC ---
const COOLDOWN_PERIOD = 10 * 1000; // 10 seconds
const cooldowns = new Map(); // Stores last signature timestamp for each address

/**
 * API endpoint to generate a minting signature.
 * Expects a POST request with a JSON body: { address: "0x..." }
 */
app.post('/api/sign', async (req, res) => {
    const { address, gtdAmount, fcfsAmount } = req.body;

    if (!address || gtdAmount === undefined || fcfsAmount === undefined) {
        return res.status(400).json({ error: 'Missing address or amounts in request body.' });
    }

    // 1. Cooldown Check
    const now = Date.now();
    if (cooldowns.has(address) && (now - cooldowns.get(address)) < COOLDOWN_PERIOD) {
        return res.status(429).json({ error: 'Cooldown active. Please wait a moment.' });
    }

    try {
        // 2. Create the message hash that the contract will expect.
        // This must match the hashing logic in the smart contract's _verifySignature function.
        // The `nonces` mapping in the contract will be handled on-chain.
        // For this example, we assume the frontend will fetch the current nonce and the contract will verify it.
        // A more robust solution would involve the backend managing nonces.
        const messageHash = ethers.solidityPackedKeccak256(
            ["address", "uint8", "uint8"],
            [address, gtdAmount, fcfsAmount]
        );

        // 3. Sign the hash
        const signature = await signerWallet.signMessage(ethers.getBytes(messageHash));

        // 4. Update cooldown timestamp and send signature back to the client
        cooldowns.set(address, now);
        console.log(`Generated signature for ${address}`)
        res.json({ signature });

    } catch (error) {
        console.error("Signature generation failed:", error);
        res.status(500).json({ error: 'Failed to generate signature.' });
    }
});

app.listen(port, () => {
    console.log(`Signature server listening on http://localhost:${port}`);
    console.log(`Signer Address: ${signerWallet.address}`);
});
