// Generate a UUID v4 that works in both Node.js and browser environments
export function generateUUID(): string {
  // Use Web Crypto API which is available in both modern browsers and Node.js
  const getRandomValues = (typeof crypto !== 'undefined' && crypto.getRandomValues)
    ? (array: Uint8Array) => crypto.getRandomValues(array)
    : (array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      };

  const rnds = new Uint8Array(16);
  getRandomValues(rnds);

  // Per 4.4, set bits for version and clockSeq high and reserved
  rnds[6] = (rnds[6] & 0x0f) | 0x40; // Version 4
  rnds[8] = (rnds[8] & 0x3f) | 0x80; // Variant 10

  // Convert to hex
  const uuid = Array.from(rnds)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
}

// Generate a unique event ID
export function generateEventId(account: string): string {
  return `${account}-${new Date().toISOString()}-${generateUUID()}`;
}
