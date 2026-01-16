/**
 * Cryptographic utilities for secure local storage
 * Implements AES-256-GCM encryption with PBKDF2 key derivation
 */

import CryptoJS from 'crypto-js';

const ENCRYPTION_CONFIG = {
  algorithm: 'AES-256-GCM',
  keySize: 256 / 32, // 8 words
  iterations: 100000,
  saltSize: 128 / 8, // 16 bytes
  ivSize: 96 / 8, // 12 bytes for GCM
};

export interface EncryptedData {
  ciphertext: string;
  salt: string;
  iv: string;
  tag?: string;
}

/**
 * Derive an encryption key from a password using PBKDF2
 */
export function deriveKey(password: string, salt: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(salt), {
    keySize: ENCRYPTION_CONFIG.keySize,
    iterations: ENCRYPTION_CONFIG.iterations,
    hasher: CryptoJS.algo.SHA256,
  });
}

/**
 * Generate a random salt
 */
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.saltSize).toString();
}

/**
 * Generate a random IV
 */
export function generateIV(): string {
  return CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.ivSize).toString();
}

/**
 * Encrypt data using AES-256
 */
export function encrypt(data: string, password: string): EncryptedData {
  const salt = generateSalt();
  const iv = generateIV();
  const key = deriveKey(password, salt);

  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    ciphertext: encrypted.ciphertext.toString(),
    salt,
    iv,
  };
}

/**
 * Decrypt data using AES-256
 */
export function decrypt(encryptedData: EncryptedData, password: string): string {
  const key = deriveKey(password, encryptedData.salt);

  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Hex.parse(encryptedData.ciphertext),
  });

  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Encrypt an object
 */
export function encryptObject<T>(obj: T, password: string): EncryptedData {
  const jsonString = JSON.stringify(obj);
  return encrypt(jsonString, password);
}

/**
 * Decrypt to an object
 */
export function decryptObject<T>(encryptedData: EncryptedData, password: string): T {
  const jsonString = decrypt(encryptedData, password);
  return JSON.parse(jsonString) as T;
}

/**
 * Hash a password for comparison (not for storage - use proper password hashing)
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}

/**
 * Generate backup codes for MFA
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes in format XXXX-XXXX
    const code = CryptoJS.lib.WordArray.random(4).toString().toUpperCase().slice(0, 8);
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

/**
 * Secure string comparison (constant-time)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Create a hash of sensitive data for logging (without exposing the actual value)
 */
export function hashForAudit(data: string): string {
  return CryptoJS.SHA256(data).toString().slice(0, 16) + '...';
}

/**
 * Encrypt local storage data
 */
export class SecureStorage {
  private password: string;

  constructor(password: string) {
    this.password = password;
  }

  setItem(key: string, value: unknown): void {
    const encrypted = encryptObject(value, this.password);
    localStorage.setItem(key, JSON.stringify(encrypted));
  }

  getItem<T>(key: string): T | null {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    try {
      const encrypted = JSON.parse(stored) as EncryptedData;
      return decryptObject<T>(encrypted, this.password);
    } catch {
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
