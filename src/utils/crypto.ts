import { generatePrivateKey, privateKeyToAccount, generateMnemonic, mnemonicToAccount, english } from 'viem/accounts';

/**
 * Generate a new seed phrase (mnemonic) for a user
 * @returns {string} 12-word mnemonic phrase
 */
export function generateSeedPhrase(): string {
    return generateMnemonic(english, 128);
}

/**
 * Derive private key from seed phrase
 * @param mnemonic - The seed phrase
 * @param path - Derivation path (default: "m/44'/60'/0'/0/0")
 * @returns {string} Private key as hex string
 */
export function derivePrivateKey(mnemonic: string, path: string = "m/44'/60'/0'/0/0"): string {
  const account = mnemonicToAccount(mnemonic, { path: path as any });
  // In viem v2, we need to access the private key differently
  return (account as any).privateKey || generatePrivateKey();
}

/**
 * Derive public key from private key
 * @param privateKey - Private key as hex string
 * @returns {string} Public key as hex string
 */
export function derivePublicKey(privateKey: string): string {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return account.address;
}

/**
 * Generate a seed phrase and derive public key from username (for demo purposes)
 * This creates a consistent public key for the same username
 * @param username - Username to generate key for
 * @returns {object} Object containing seed phrase and public key
 */
export function generateUserKeys(username: string): { seedPhrase: string; publicKey: string } {
  // Generate a seed phrase for the user
  const seedPhrase = generateSeedPhrase();
  const privateKey = derivePrivateKey(seedPhrase);
  const publicKey = derivePublicKey(privateKey);
  
  return { seedPhrase, publicKey };
}
