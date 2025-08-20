import eccrypto from 'eccrypto';

// Define the Ecies type structure
interface Ecies {
  iv: Buffer;
  ephemPublicKey: Buffer;
  ciphertext: Buffer;
  mac: Buffer;
}

/**
 * Generate a new ECC keypair for a user
 * @returns {Promise<{privateKey: Buffer, publicKey: Buffer}>} ECC keypair
 */
export async function generateECCKeyPair(): Promise<{privateKey: Buffer, publicKey: Buffer}> {
  const privateKey = eccrypto.generatePrivate();
  const publicKey = eccrypto.getPublic(privateKey);
  return { privateKey, publicKey };
}

/**
 * Encrypt data with a recipient's public key using ECIES
 * @param publicKey - Recipient's public key as Buffer
 * @param data - Data to encrypt as string
 * @returns {Promise<string>} Encrypted data as hex string
 */
export async function encryptWithECC(publicKey: Buffer, data: string): Promise<string> {
  const encrypted: Ecies = await eccrypto.encrypt(publicKey, Buffer.from(data, 'utf8'));
  
  // Convert Ecies object to hex string for storage/transmission
  const encryptedHex = JSON.stringify({
    iv: encrypted.iv.toString('hex'),
    ephemPublicKey: encrypted.ephemPublicKey.toString('hex'),
    ciphertext: encrypted.ciphertext.toString('hex'),
    mac: encrypted.mac.toString('hex')
  });
  
  return encryptedHex;
}

/**
 * Decrypt data with user's private key using ECIES
 * @param privateKey - User's private key as Buffer
 * @param encryptedDataHex - Encrypted data as hex string
 * @returns {Promise<string>} Decrypted data as string
 */
export async function decryptWithECC(privateKey: Buffer, encryptedDataHex: string): Promise<string> {
  // Parse the hex string back to Ecies object
  const encryptedData = JSON.parse(encryptedDataHex);
  const ecies: Ecies = {
    iv: Buffer.from(encryptedData.iv, 'hex'),
    ephemPublicKey: Buffer.from(encryptedData.ephemPublicKey, 'hex'),
    ciphertext: Buffer.from(encryptedData.ciphertext, 'hex'),
    mac: Buffer.from(encryptedData.mac, 'hex')
  };
  
  const decryptedBuffer = await eccrypto.decrypt(privateKey, ecies);
  return decryptedBuffer.toString('utf8');
}

/**
 * Sign a message with user's private key using ECDSA
 * @param privateKey - User's private key as Buffer
 * @param message - Message to sign as string
 * @returns {Promise<string>} Signature as hex string
 */
export async function signMessage(privateKey: Buffer, message: string): Promise<string> {
  // Hash the message before signing (eccrypto requirement)
  const crypto = require('crypto');
  const messageHash = crypto.createHash('sha256').update(message).digest();
  const signature = await eccrypto.sign(privateKey, messageHash);
  return signature.toString('hex');
}

/**
 * Verify a message signature with public key using ECDSA
 * @param publicKey - Public key as Buffer
 * @param message - Original message as string
 * @param signatureHex - Signature as hex string
 * @returns {Promise<boolean>} True if signature is valid
 */
export async function verifySignature(publicKey: Buffer, message: string, signatureHex: string): Promise<boolean> {
  try {
    // Hash the message before verification (eccrypto requirement)
    const crypto = require('crypto');
    const messageHash = crypto.createHash('sha256').update(message).digest();
    const signature = Buffer.from(signatureHex, 'hex');
    await eccrypto.verify(publicKey, messageHash, signature);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Derive public key from private key
 * @param privateKeyHex - Private key as hex string
 * @returns {string} Public key as hex string
 */
export function derivePublicKeyFromPrivateKey(privateKeyHex: string): string {
  try {
    const privateKeyBuffer = hexToBuffer(privateKeyHex);
    const publicKeyBuffer = eccrypto.getPublic(privateKeyBuffer);
    return bufferToHex(publicKeyBuffer);
  } catch (error) {
    throw new Error(`Failed to derive public key: ${error}`);
  }
}

/**
 * Convert Buffer to hex string for storage/transmission
 * @param buffer - Buffer to convert
 * @returns {string} Hex string
 */
export function bufferToHex(buffer: Buffer): string {
  return buffer.toString('hex');
}

/**
 * Convert hex string to Buffer for cryptographic operations
 * @param hex - Hex string to convert
 * @returns {Buffer} Buffer
 */
export function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex, 'hex');
}

/**
 * Generate ECC keys for a new user during registration
 * @returns {Promise<{privateKeyHex: string, publicKeyHex: string}>} Keys as hex strings
 */
export async function generateUserKeys(): Promise<{privateKeyHex: string, publicKeyHex: string}> {
  const { privateKey, publicKey } = await generateECCKeyPair();
  return {
    privateKeyHex: bufferToHex(privateKey),
    publicKeyHex: bufferToHex(publicKey)
  };
}

/**
 * Create EncryptedMessage object for sender (encrypted with sender's public key)
 * @param content - Message content
 * @param senderPublicKey - Sender's public key as hex string
 * @param senderPrivateKey - Sender's private key as hex string
 * @returns {Promise<string>} Encrypted message as hex string
 */
export async function createSenderEncryptedMessage(
  content: string, 
  senderPublicKey: string, 
  senderPrivateKey: string
): Promise<string> {
  const encryptedMessage = {
    content: content,
    publicKey: senderPublicKey,
    signature: await signMessage(hexToBuffer(senderPrivateKey), content)
  };
  
  // Encrypt with SENDER's public key so SENDER can decrypt it
  const encryptedData = await encryptWithECC(hexToBuffer(senderPublicKey), JSON.stringify(encryptedMessage));
  return encryptedData;
}

/**
 * Create EncryptedMessage object for recipient (encrypted with recipient's public key)
 * @param content - Message content
 * @param senderPublicKey - Sender's public key as hex string
 * @param senderPrivateKey - Sender's private key as hex string
 * @param recipientPublicKey - Recipient's public key as hex string
 * @returns {Promise<string>} Encrypted message as hex string
 */
export async function createRecipientEncryptedMessage(
  content: string,
  senderPublicKey: string,
  senderPrivateKey: string,
  recipientPublicKey: string
): Promise<string> {
  const encryptedMessage = {
    content: content,
    publicKey: senderPublicKey,
    signature: await signMessage(hexToBuffer(senderPrivateKey), content)
  };
  
  // Encrypt with RECIPIENT's public key so RECIPIENT can decrypt it
  const encryptedData = await encryptWithECC(hexToBuffer(recipientPublicKey), JSON.stringify(encryptedMessage));
  return encryptedData;
}

/**
 * Decrypt and verify an EncryptedMessage
 * @param encryptedDataHex - Encrypted data as hex string
 * @param privateKeyHex - User's private key as hex string
 * @returns {Promise<{content: string, publicKey: string, signature: string} | null>} Decrypted message or null if failed
 */
export async function decryptEncryptedMessage(
  encryptedDataHex: string,
  privateKeyHex: string
): Promise<{content: string, publicKey: string, signature: string} | null> {
  try {
    const privateKey = hexToBuffer(privateKeyHex);
    
    const decryptedJson = await decryptWithECC(privateKey, encryptedDataHex);
    const encryptedMessage = JSON.parse(decryptedJson);
    
    // Verify signature
    const isValid = await verifySignature(
      hexToBuffer(encryptedMessage.publicKey),
      encryptedMessage.content,
      encryptedMessage.signature
    );
    
    if (isValid) {
      return encryptedMessage;
    } else {
      console.warn('Message signature verification failed');
      return null;
    }
  } catch (error) {
    console.error('Failed to decrypt message:', error);
    return null;
  }
}

/**
 * Test function to verify encryption/decryption is working
 * Run this in browser console to test: testCryptoSystem()
 */
export async function testCryptoSystem(): Promise<void> {
  try {
    console.log('🧪 Testing ECC crypto system...');
    
    // Generate test keys for two users
    const { privateKeyHex: alicePrivateKey, publicKeyHex: alicePublicKey } = await generateUserKeys();
    const { privateKeyHex: bobPrivateKey, publicKeyHex: bobPublicKey } = await generateUserKeys();
    
    console.log('✅ Generated keys for Alice and Bob:', {
      alicePrivateKey: alicePrivateKey.substring(0, 20) + '...',
      alicePublicKey: alicePublicKey.substring(0, 20) + '...',
      bobPrivateKey: bobPrivateKey.substring(0, 20) + '...',
      bobPublicKey: bobPublicKey.substring(0, 20) + '...'
    });
    
    // Test message
    const testMessage = 'Hello, this is a test message from Alice to Bob!';
    console.log('📝 Test message:', testMessage);
    
    // Test signature
    const signature = await signMessage(hexToBuffer(alicePrivateKey), testMessage);
    console.log('✍️ Signature:', signature.substring(0, 20) + '...');
    
    // Test signature verification
    const isValidSignature = await verifySignature(hexToBuffer(alicePublicKey), testMessage, signature);
    console.log('🔍 Signature valid:', isValidSignature);
    
    // Test basic encryption/decryption
    const encrypted = await encryptWithECC(hexToBuffer(bobPublicKey), testMessage);
    console.log('🔐 Encrypted data:', encrypted.substring(0, 100) + '...');
    
    const decrypted = await decryptWithECC(hexToBuffer(bobPrivateKey), encrypted);
    console.log('🔓 Decrypted message:', decrypted);
    
    // Test dual encryption system
    console.log('\n🔐 Testing dual encryption system...');
    
    // Alice creates message for herself (encrypted with her public key)
    const aliceEncryptedForSelf = await createSenderEncryptedMessage(
      testMessage, 
      alicePublicKey, 
      alicePrivateKey
    );
    console.log('📤 Alice encrypted for self:', aliceEncryptedForSelf.substring(0, 100) + '...');
    
    // Alice creates message for Bob (encrypted with Bob's public key)
    const aliceEncryptedForBob = await createRecipientEncryptedMessage(
      testMessage,
      alicePublicKey,
      alicePrivateKey,
      bobPublicKey
    );
    console.log('📥 Alice encrypted for Bob:', aliceEncryptedForBob.substring(0, 100) + '...');
    
    // Test decryption: Alice should be able to decrypt her own message
    console.log('\n🔓 Testing Alice can decrypt her own message...');
    const aliceDecryptedOwn = await decryptEncryptedMessage(aliceEncryptedForSelf, alicePrivateKey);
    if (aliceDecryptedOwn) {
      console.log('✅ Alice successfully decrypted her own message:', aliceDecryptedOwn.content);
    } else {
      console.log('❌ Alice failed to decrypt her own message');
    }
    
    // Test decryption: Bob should be able to decrypt message from Alice
    console.log('\n🔓 Testing Bob can decrypt message from Alice...');
    const bobDecryptedFromAlice = await decryptEncryptedMessage(aliceEncryptedForBob, bobPrivateKey);
    if (bobDecryptedFromAlice) {
      console.log('✅ Bob successfully decrypted message from Alice:', bobDecryptedFromAlice.content);
    } else {
      console.log('❌ Bob failed to decrypt message from Alice');
    }
    
    // Test decryption: Alice should NOT be able to decrypt message for Bob
    console.log('\n🔓 Testing Alice cannot decrypt message for Bob...');
    try {
      const aliceDecryptedForBob = await decryptEncryptedMessage(aliceEncryptedForBob, alicePrivateKey);
      if (aliceDecryptedForBob) {
        console.log('❌ Security issue: Alice can decrypt message meant for Bob!');
      } else {
        console.log('✅ Security maintained: Alice cannot decrypt message for Bob');
      }
    } catch (error) {
      console.log('✅ Security maintained: Alice cannot decrypt message for Bob (error thrown)');
    }
    
    // Test decryption: Bob should NOT be able to decrypt Alice's self-message
    console.log('\n🔓 Testing Bob cannot decrypt Alice\'s self-message...');
    try {
      const bobDecryptedAliceSelf = await decryptEncryptedMessage(aliceEncryptedForSelf, bobPrivateKey);
      if (bobDecryptedAliceSelf) {
        console.log('❌ Security issue: Bob can decrypt Alice\'s self-message!');
      } else {
        console.log('✅ Security maintained: Bob cannot decrypt Alice\'s self-message');
      }
    } catch (error) {
      console.log('✅ Security maintained: Bob cannot decrypt Alice\'s self-message (error thrown)');
    }
    
    console.log('\n🎉 All crypto tests completed!');
  } catch (error) {
    console.error('❌ Crypto test failed:', error);
  }
}
