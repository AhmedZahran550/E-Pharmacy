import { createHmac } from 'crypto';

export const hmacHashing = (text: string) => {
  const secret = process.env.HMAC_SECRET;
  if (!secret) {
    throw new Error(
      'HMAC_SECRET is not defined in your environment variables.',
    );
  }
  if (!text) return null;
  return createHmac('sha256', secret).update(text).digest('hex');
};

/**
 * @param {string} storedHash The hash from your database to compare against.
 * @param {string} plainTextData The raw, plain text data to check (e.g., a National ID).
 * @returns {boolean} True if the hashes match, otherwise false.
 */
export const hmacVerify = (storedHash: string, plainTextData: string) => {
  // 1. Hash the incoming plain text data using the exact same hashing function
  // and secret key that was used to create the original stored hash.
  const newHash = hmacHashing(plainTextData);

  // 2. [INSECURE] Directly compare the newly generated hash string with the one from the database.
  // This comparison is not "timing-safe," meaning it stops as soon as it finds a
  // different character, which leaks information about the hash's content.
  return newHash === storedHash;
};
