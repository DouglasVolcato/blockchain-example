"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
// Import the built-in crypto module to handle cryptographic functions
// such as hashing, signing, and verifying.
class Transaction {
    // The Transaction class represents a transfer of money between two parties.
    constructor(amount, // The amount of money transferred.
    payer, // The public key of the person sending the money.
    payee // The public key of the person receiving the money.
    ) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    toString() {
        // Returns a string representation of the transaction (used for signing and verification).
        return JSON.stringify(this);
    }
}
class Block {
    // Nonce is a random number that will be adjusted during mining to find a valid hash.
    constructor(prevHash, // The hash of the previous block in the chain (ensures immutability).
    transaction, // The transaction data this block contains.
    ts = Date.now() // Timestamp indicating when this block was created (default: current time).
    ) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.ts = ts;
        // The Block class represents a block in the blockchain, containing a transaction and metadata.
        this.nonce = Math.round(Math.random() * 999999999);
    }
    get hash() {
        // This getter method calculates the hash of the current block using the SHA256 algorithm.
        const str = JSON.stringify(this); // Convert the block (including nonce, transaction, etc.) to a string.
        const hash = crypto.createHash("SHA256"); // Use the SHA256 hashing algorithm.
        hash.update(str).end(); // Feed the block data into the hash function.
        return hash.digest("hex"); // Return the hash in hexadecimal format.
    }
}
class Chain {
    constructor() {
        // Initialize the blockchain with a "genesis" block (the first block of the chain).
        this.chain = [new Block("", new Transaction(100, "genesis", "satoshi"))];
    }
    get lastBlock() {
        // Returns the last block in the blockchain.
        return this.chain[this.chain.length - 1];
    }
    mine(nonce) {
        // Mining function to find a solution for the nonce by brute force.
        let solution = 1;
        console.log("⛏️  mining...");
        while (true) {
            const hash = crypto.createHash("MD5"); // Use MD5 hashing to simplify the mining for demonstration.
            hash.update((nonce + solution).toString()).end(); // Combine the nonce and the solution for hashing.
            const attempt = hash.digest("hex"); // Get the hash in hexadecimal format.
            if (attempt.substr(0, 4) === "0000") {
                // If the hash starts with "0000", it's considered valid (a simple proof-of-work criterion).
                console.log(`Solved: ${solution}`);
                return solution; // Return the solution that solved the puzzle.
            }
            solution += 1; // Increment the solution and try again (brute force search).
        }
    }
    addBlock(transaction, senderPublicKey, signature) {
        // Function to add a new block to the chain, but only if the transaction is valid.
        const verify = crypto.createVerify("SHA256"); // Create a verifier using the SHA256 algorithm.
        verify.update(transaction.toString()); // Verify the transaction details.
        const isValid = verify.verify(senderPublicKey, signature);
        // Verify the signature with the sender's public key.
        if (isValid) {
            // If the transaction is valid, create a new block with the transaction.
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce); // Mine the block to find a valid nonce.
            this.chain.push(newBlock); // Add the new block to the blockchain.
        }
    }
}
// The Chain class represents the entire blockchain.
Chain.instance = new Chain(); // Singleton instance of the blockchain (ensures only one blockchain).
class Wallet {
    constructor() {
        // Generate a keypair (public and private keys) for the wallet using RSA encryption.
        const keypair = crypto.generateKeyPairSync("rsa", {
            modulusLength: 2048, // The length of the key (in bits).
            publicKeyEncoding: { type: "spki", format: "pem" }, // Format the public key as PEM.
            privateKeyEncoding: { type: "pkcs8", format: "pem" }, // Format the private key as PEM.
        });
        this.privateKey = keypair.privateKey; // Store the private key.
        this.publicKey = keypair.publicKey; // Store the public key.
    }
    sendMoney(amount, payeePublicKey) {
        // Method to send money from this wallet to another wallet (identified by its public key).
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        // Create a new transaction with the amount, payer (this wallet's public key), and payee.
        const sign = crypto.createSign("SHA256"); // Create a signer using the SHA256 algorithm.
        sign.update(transaction.toString()).end(); // Sign the transaction details.
        const signature = sign.sign(this.privateKey); // Generate a signature for the transaction using the private key.
        Chain.instance.addBlock(transaction, this.publicKey, signature);
        // Add the transaction to the blockchain.
    }
}
// Creating three wallets for demonstration.
const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();
// Example transactions between the wallets.
satoshi.sendMoney(50, bob.publicKey); // Satoshi sends 50 units to Bob.
bob.sendMoney(23, alice.publicKey); // Bob sends 23 units to Alice.
alice.sendMoney(5, bob.publicKey); // Alice sends 5 units back to Bob.
// Display the blockchain by logging each block and its transaction.
console.log(Chain.instance);
