const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export class BaseEncoder {
  static encodeToBase62(uuid: string): string {
    const bigIntValue = BigInt(`0x${uuid.replace(/-/g, '')}`);
    let encoded = '';

    let value = bigIntValue;
    while (value > 0) {
      encoded = BASE62[Number(value % BigInt(62))] + encoded;
      value /= BigInt(62);
    }

    return encoded.substring(0, 8).toLowerCase(); // Shorten the code to 8 characters
  }
}
