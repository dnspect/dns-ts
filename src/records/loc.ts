import { Slice } from "../packet";
import { RR } from "../rr";
import { Uint32, Uint8 } from "../types";
import { Writer } from "../buffer";

const LOC_EQUATOR = 1 << 31; // RFC 1876, Section 2.
const LOC_PRIMEMERIDIAN = 1 << 31; // RFC 1876, Section 2.
const LOC_HOURS = 60 * 1000;
const LOC_DEGREES = 60 * LOC_HOURS;
const LOC_ALTITUDEBASE = 100000;

/**
 *
 * LOC record is a means for expressing geographic location information for a domain name.
 *
 * Experimental {@link https://datatracker.ietf.org/doc/html/rfc1876 | RFC 1876}.
 *
 * RDATA format:
 *
 * ```
 *   MSB                                           LSB
 *   +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  0|        VERSION        |         SIZE          |
 *   +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  2|       HORIZ PRE       |       VERT PRE        |
 *   +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  4|                   LATITUDE                    |
 *   +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  6|                   LATITUDE                    |
 *   +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  8|                   LONGITUDE                   |
 *   +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * 10|                   LONGITUDE                   |
 *   +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * 12|                   ALTITUDE                    |
 *   +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * 14|                   ALTITUDE                    |
 *   +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class LOC extends RR {
    /**
     * Version number of the representation. This must be zero.
     *
     * Implementations are required to check this field and make no assumptions about the format of
     * unrecognized versions.
     */
    version!: Uint8;

    /**
     * The diameter of a sphere enclosing the described entity, in centimeters, expressed as a pair
     * of four-bit unsigned integers, each ranging from zero to nine, with the most significant
     * four bits representing the base and the second number representing the power of ten by which
     * to multiply the base.
     *
     * This allows sizes from 0e0 (<1cm) to 9e9 (90,000km) to be expressed.
     */
    size!: Uint8;
    /**
     * The horizontal precision of the data, in centimeters, expressed using the same representation as
     * SIZE.
     *
     * This is the diameter of the horizontal "circle of error", rather than a "plus or minus" value.
     * (This was chosen to match the interpretation of SIZE; to get a "plus or minus" value, divide by
     * 2.)
     */
    horizPrecision!: Uint8;
    /**
     * The vertical precision of the data, in centimeters, expressed using the sane representation
     * as for SIZE.
     *
     * This is the total potential vertical error, rather than a "plus or minus" value. (This was
     * chosen to match the interpretation of SIZE; to get a "plus or minus" value, divide by 2.)
     * Note that if altitude above or below sea level is used as an approximation for altitude
     * relative to the [WGS 84] ellipsoid, the precision value should be adjusted.
     */
    vertPrecision!: Uint8;
    /**
     * The latitude of the center of the sphere described by the SIZE field, expressed as a 32-bit
     * integer, most significant octet first (network standard byte order), in thousandths of a second
     * of arc. 2^31 represents the equator; numbers above that are north latitude.
     */
    latitude!: Uint32;
    /**
     * The longitude of the center of the sphere described by the SIZE field, expressed as a 32-bit
     * integer, most significant octet first (network standard byte order), in thousandths of a second
     * of arc, rounded away from the prime meridian. 2^31 represents the prime meridian; numbers above
     * that are east longitude.
     */
    longitude!: Uint32;
    /**
     * The altitude of the center of the sphere described by the SIZE field, expressed as a 32-bit
     * integer, most significant octet first (network standard byte order), in centimeters, from a
     * base of 100,000m below the [WGS 84] reference spheroid used by GPS (semimajor axis a=6378137.0,
     * reciprocal flattening rf=298.257223563).
     *
     * Altitude above (or below) sea level may be used as an approximation of altitude relative to
     * the the [WGS 84] spheroid, though due to the Earth's surface not being a perfect spheroid,
     * there will be differences.
     */
    altitude!: Uint32;

    unpackRdata(rdata: Slice): void {
        this.version = rdata.readUint8();
        this.size = rdata.readUint8();
        this.horizPrecision = rdata.readUint8();
        this.vertPrecision = rdata.readUint8();
        this.latitude = rdata.readUint32();
        this.longitude = rdata.readUint32();
        this.altitude = rdata.readUint32();
    }

    packRdata(buf: Writer): number {
        return buf.writeUint8(this.version) +
            buf.writeUint8(this.size) +
            buf.writeUint8(this.horizPrecision) +
            buf.writeUint8(this.vertPrecision) +
            buf.writeUint32(this.latitude) +
            buf.writeUint32(this.longitude) +
            buf.writeUint32(this.altitude);
    }

    /**
     * <owner> <TTL> <class> LOC ( d1 [m1 [s1]] {"N"|"S"} d2 [m2 [s2]]
     *                            {"E"|"W"} alt["m"] [siz["m"] [hp["m"]
     *                            [vp["m"]]]] )
     *
     * where:
     *   d1:     [0 .. 90]                                  (degrees latitude)
     *   d2:     [0 .. 180]                                 (degrees longitude)
     *   m1, m2: [0 .. 59]                                  (minutes latitude/longitude)
     *   s1, s2: [0 .. 59.999]                              (seconds latitude/longitude)
     *   alt:    [-100000.00 .. 42849672.95] BY .01         (altitude in meters)
     *   siz, hp, vp: [0 .. 90000000.00]                    (size/precision in meters)
     *
     * @returns
     *
     * @example
     * An example DNS LOC resource record statdns.net for the coordinates: 52°22′23″N 4°53′32″E
     *  ```
     *  statdns.net.   IN LOC   52 22 23.000 N 4 53 32.000 E -2.00m 0.00m 10000m 10m
     *  ```
     */
    toString(): string {
        const [nOrS, lat] = this.latitude > LOC_EQUATOR ? ["N", this.latitude - LOC_EQUATOR] : ["S", LOC_EQUATOR - this.latitude];
        const [eOrW, lon] = this.longitude > LOC_PRIMEMERIDIAN ? ["E", this.longitude - LOC_PRIMEMERIDIAN] : ["W", LOC_PRIMEMERIDIAN - this.longitude];
        const latStr = displayLatLon(lat, nOrS);
        const lonStr = displayLatLon(lon, eOrW);

        const alt = this.altitude / 100.0 - LOC_ALTITUDEBASE;
        const altStr = this.altitude % 100 === 0 ? `${alt}m` : `${alt.toFixed(2)}m`;
        const size = displaySizePrecision(this.size);
        const horiz = displaySizePrecision(this.horizPrecision);
        const vert = displaySizePrecision(this.vertPrecision);

        return `${this.header}\t${latStr} ${lonStr} ${altStr} ${size} ${horiz} ${vert}`;
    }
}

function displaySizePrecision(n: Uint8): string {
    const m = n >> 4;
    const e = n & 0xF;

    // Less than a meter
    if (e === 0) {
        return `0.0${m}m`;
    } else if (e === 1) {
        return `0.${m}m`;
    } else {
        return `${m}${"0".repeat(e - 2)}m`;
    }
}

function displayLatLon(seconds: Uint32, sign: string): string {
    const h = seconds / LOC_DEGREES;
    let s = seconds % LOC_DEGREES;
    const m = s / LOC_HOURS;
    s = (s % LOC_HOURS) / 1000.0;
    return `${h.toString().padStart(2, "0")} ${m.toString().padStart(2, "0")} ${s.toFixed(3)} ${sign}`;
}
