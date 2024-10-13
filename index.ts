import * as crypto from "crypto";

// Import the built-in crypto module to handle cryptographic functions
// such as hashing, signing, and verifying.

class Transaction {
  // The Transaction class represents a transfer of money between two parties.

  constructor(
    public amount: number, // The amount of money transferred.
    public payer: string, // The public key of the person sending the money.
    public payee: string // The public key of the person receiving the money.
  ) {}

  toString() {
    // Returns a string representation of the transaction (used for signing and verification).
    return JSON.stringify(this);
  }
}

class Block {
  // The Block class represents a block in the blockchain, containing a transaction and metadata.

  public nonce = Math.round(Math.random() * 999999999);
  // Nonce is a random number that will be adjusted during mining to find a valid hash.

  constructor(
    public prevHash: string, // The hash of the previous block in the chain (ensures immutability).
    public transaction: Transaction, // The transaction data this block contains.
    public ts = Date.now() // Timestamp indicating when this block was created (default: current time).
  ) {}

  get hash() {
    // This getter method calculates the hash of the current block using the SHA256 algorithm.
    const str = JSON.stringify(this); // Convert the block (including nonce, transaction, etc.) to a string.
    const hash = crypto.createHash("SHA256"); // Use the SHA256 hashing algorithm.
    hash.update(str).end(); // Feed the block data into the hash function.
    return hash.digest("hex"); // Return the hash in hexadecimal format.
  }
}

class Chain {
  // The Chain class represents the entire blockchain.

  public static instance = new Chain(); // Singleton instance of the blockchain (ensures only one blockchain).

  chain: Block[];

  constructor() {
    // Initialize the blockchain with a "genesis" block (the first block of the chain).
    this.chain = [new Block("", new Transaction(100, "genesis", "satoshi"))];
  }

  get lastBlock() {
    // Returns the last block in the blockchain.
    return this.chain[this.chain.length - 1];
  }

  mine(nonce: number) {
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

  addBlock(
    transaction: Transaction,
    senderPublicKey: string,
    signature: Buffer
  ) {
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

class Wallet {
  // The Wallet class represents a wallet that can send and receive money (transactions).

  public publicKey: string; // The public key used to receive money.
  public privateKey: string; // The private key used to sign transactions.

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

  sendMoney(amount: number, payeePublicKey: string) {
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
