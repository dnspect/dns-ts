
import * as base64 from "base64-js";
import * as base32 from "./base32";

/**
 * String encoding schemes.
 */
export type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'base64' | 'binary' | 'base32' | 'hex' | 'hex-ws';

/**
 * Encodes given string to the specific encoding scheme.
 *
 * @param str The string to encode
 * @param encoding The encoding scheme to use
 * @returns A Uint8Array containing the encoded data.
 */
export function encodeString(str: string, encoding: BufferEncoding): Uint8Array {
    switch (encoding) {
        case "ascii":
        case "binary": {
            const bytes = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) {
                bytes[i] = str.charCodeAt(i) & 0xFF;
            }
            return bytes;
        }
        case "utf8":
        case "utf-8": {
            const encoder = new TextEncoder();
            return encoder.encode(str);
        }
        case "hex":
        case "hex-ws": {
            const chars = str.split(encoding === 'hex' ? '' : ' ');
            if (chars.length % 2 !== 0) {
                throw new Error(`Invalid hex: ${str}`);
            }

            const data = new Uint8Array(chars.length / 2);
            for (let i = 0; i < chars.length; i += 2) {
                data[i / 2] = parseInt(chars[i] + chars[i + 1], 16);
            }
            return data;
        }
        case "base32":
            return base32.encode(str);
        case "base64":
            return base64.toByteArray(str);

        default:
            throw new Error(`Unsupported encoding: ${encoding}`);
    }
}

/**
 * Decodes given binary data in the specific encoding scheme to a string.
 *
 * @param binaryData The binary data to decode
 * @param encoding The encoding scheme of the data
 * @returns A string containing the decoded data.
 */
export function decodeString(binaryData: Uint8Array, encoding: BufferEncoding): string {
    switch (encoding) {
        case "ascii":
        case "binary": {
            const decoder = new TextDecoder('ascii');
            return decoder.decode(binaryData);
        }
        case "utf8":
        case "utf-8": {
            const decoder = new TextDecoder('utf-8');
            return decoder.decode(binaryData);
        }
        case "hex":
        case "hex-ws": {
            const chars = new Array<string>(binaryData.length);
            for (const i in binaryData) {
                chars[i] = binaryData[i].toString(16).padStart(2, '0');
            }
            const sep = encoding === 'hex' ? '' : ' ';
            return chars.join(sep);
        }
        case "base32":
            return base32.decode(binaryData);
        case "base64":
            return base64.fromByteArray(binaryData);
        default:
            throw new Error(`Unsupported encoding: ${encoding}`);
    }
}
