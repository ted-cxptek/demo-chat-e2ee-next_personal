import { generatePrivateKey, privateKeyToAccount, generateMnemonic, mnemonicToAccount, english } from 'viem/accounts';

/**
 * Generate a new seed phrase (mnemonic) for a user
 * @returns {string} 12-word mnemonic phrase
 */
export function generateSeedPhrase(): string {
    return generateMnemonic(english, 128);
}

/**
 * Derive public key from private key
 * @param privateKey - Private key as hex string
 * @returns {string} Public key as hex string
 */
export function derivePublicKeyFromSeedPhrase(seedPhrase: string): string {
  const account = mnemonicToAccount(seedPhrase);
  return account.publicKey;
}

/**
 * Generate a seed phrase and derive public key from username (for demo purposes)
 * This creates a consistent public key for the same username
 * @param username - Username to generate key for
 * @returns {object} Object containing seed phrase and public key
 */
export function generateSeedPhraseAndPublicKey(): { seedPhrase: string; publicKey: string } {
  // Generate a seed phrase for the user
  const seedPhrase = generateSeedPhrase();
  const publicKey = derivePublicKeyFromSeedPhrase(seedPhrase);
  
  return { seedPhrase, publicKey };
}
