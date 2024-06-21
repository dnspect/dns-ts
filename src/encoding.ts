
import * as base64 from "base64-js";
import * as base32 from "./base32";

/**
 * String encoding schemes.
 */
export type EncodingScheme = 'ascii' | 'utf8' | 'utf-8' | 'base64' | 'binary' | 'base32' | 'hex' | 'hex-ws';

/**
 * Decodes an encoded string to binary.
 *
 * @param str The string to decode
 * @param scheme The encoding scheme the string was originally encoded with.
 * @returns A Uint8Array containing the binary data.
 */
export function stringToBinary(str: string, scheme: EncodingScheme): Uint8Array {
    switch (scheme) {
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
            const chars = str.split(/\s*/);
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
            throw new Error(`Unsupported encoding scheme: ${scheme}`);
    }
}

/**
 * Encodes the binary to string with the specific encoding scheme.
 *
 * @param binaryData The binary data to be encoded.
 * @param encoding The encoding scheme to use.
 * @returns The encoded string.
 */
export function binaryToString(binaryData: Uint8Array, scheme: EncodingScheme): string {
    switch (scheme) {
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
            const sep = scheme === 'hex' ? '' : ' ';
            return chars.join(sep);
        }
        case "base32":
            return base32.decode(binaryData);
        case "base64":
            return base64.fromByteArray(binaryData);
        default:
            throw new Error(`Unsupported encoding scheme: ${scheme}`);
    }
}
