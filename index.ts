import * as crypto from 'crypto';

// Represents a financial transaction between two parties
class Transaction {
  constructor(
    public amount: number, // Amount to be transferred
    public payer: string, // Public key of the payer
    public payee: string // Public key of the payee
  ) {}

  // Converts the transaction details to a string in JSON format
  toString() {
    return JSON.stringify(this);
  }
}

// Represents a single block in the blockchain
class Block {
  public nonce = Math.round(Math.random() * 999999999); // Random nonce for mining

  constructor(
    public prevHash: string, // Hash of the previous block
    public transaction: Transaction, // Transaction contained in the block
    public ts = Date.now() // Timestamp of the block creation, defaults to current time
  ) {}

  // Computes and returns the hash of the block
  get hash() {
    const str = JSON.stringify(this);
    const hash = crypto.createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
  }
}

// The blockchain itself, containing a sequence of blocks
class Chain {
  // Singleton instance of the blockchain
  public static instance = new Chain();

  chain: Block[]; // Array of blocks

  constructor() {
    this.chain = [
      // Creating the genesis block
      new Block('', new Transaction(100, 'genesis', 'satoshi'))
    ];
  }

  // Retrieves the most recently added block
  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Proof of work algorithm
  mine(nonce: number) {
    let solution = 1;
    console.log('⛏️  mining...')

    while(true) {
      const hash = crypto.createHash('MD5');
      hash.update((nonce + solution).toString()).end();
      const attempt = hash.digest('hex');

      if(attempt.substr(0,4) === '0000'){
        console.log(`Solved: ${solution}`);
        return solution;
      }

      solution += 1;
    }
  }

  // Adds a new block after validating the transaction
  addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
    const verify = crypto.createVerify('SHA256');
    verify.update(transaction.toString());
    const isValid = verify.verify(senderPublicKey, signature);

    if (isValid) {
      const newBlock = new Block(this.lastBlock.hash, transaction);
      this.mine(newBlock.nonce);
      this.chain.push(newBlock);
    }
  }
}

// Wallet class for a user with a public/private key pair
class Wallet {
  public publicKey: string;
  public privateKey: string;

  constructor() {
    const keypair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    this.privateKey = keypair.privateKey;
    this.publicKey = keypair.publicKey;
  }

  // Facilitates sending money from this wallet to another
  sendMoney(amount: number, payeePublicKey: string) {
    const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
    const sign = crypto.createSign('SHA256');
    sign.update(transaction.toString()).end();
    const signature = sign.sign(this.privateKey); 
    Chain.instance.addBlock(transaction, this.publicKey, signature);
  }
}

// Example usage demonstrating the creation of wallets and transactions
const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();

satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, bob.publicKey);

console.log(Chain.instance)
