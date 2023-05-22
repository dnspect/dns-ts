/**
 * Domain Name System Security (DNSSEC) Algorithm Numbers
 *
 * @packageDocument
 */

/**
 * DNS Security Algorithm Numbers
 *
 * The KEY, SIG, DNSKEY, RRSIG, DS, and CERT RRs use an 8-bit number used to identify the security
 * algorithm being used.
 *
 * All algorithm numbers in this registry may be used in CERT RRs. Zone signing (DNSSEC) and
 * transaction security mechanisms (SIG(0) and TSIG) make use of particular subsets of these
 * algorithms. Only algorithms usable for zone signing may appear in DNSKEY, RRSIG, and DS RRs.
 * Only those usable for SIG(0) and TSIG may appear in SIG and KEY RRs.
 *
 * There has been no determination of standardization of the use of this algorithm with Transaction
 * Security.
 *
 * See also {@link https://www.iana.org/assignments/dns-sec-alg-numbers/dns-sec-alg-numbers.xhtml#dns-sec-alg-numbers-1}
 */
export const enum SecurityAlgorithm {
    /*
     * Delete DS
     *
     * This algorithm is used in RFC 8087 to signal to the parent that a
     * certain DS record should be deleted. It is _not_ an actual algorithm
     * and can neither be used in zone nor transaction signing.
     */
    DELETE = 0,

    /*
     * RSA/MD5
     *
     * This algorithm was described in RFC 2537 and since has been
     * deprecated due to weaknesses of the MD5 hash algorithm by RFC 3110
     * which suggests to use RSA/SHA1 instead.
     *
     * This algorithm may not be used for zone signing but may be used
     * for transaction security.
     */
    RSAMD5 = 1,

    /*
     * Diffie-Hellman
     *
     * This algorithm is described in RFC 2539 for storing Diffie-Hellman
     * (DH) keys in DNS resource records. It can not be used for zone
     * signing but only for transaction security.
     */
    DH = 2,

    /*
     * DSA/SHA1
     *
     * This algorithm is described in RFC 2536. It may be used both for
     * zone signing and transaction security.
     */
    DSA = 3,

    /*
     * RSA/SHA-1
     *
     * This algorithm is described in RFC 3110. It may be used both for
     * zone signing and transaction security. It is mandatory for DNSSEC
     * implementations.
     */
    RSASHA1 = 5,

    /*
     * DSA-NSEC3-SHA1
     *
     * This value is an alias for `Dsa` for use within NSEC3 records.
     */
    DSANSEC3SHA1 = 6,

    /*
     * RSASHA1-NSEC3-SHA1
     *
     * This value is an alias for `RsaSha1` for use within NSEC3 records.
     */
    RSASHA1NSEC3SHA1 = 7,

    /*
     * RSA/SHA-256
     *
     * This algorithm is described in RFC 5702. It may be used for zone
     * signing only.
     */
    RSASHA256 = 8,

    /*
     * RSA/SHA-512
     *
     * This algorithm is described in RFC 5702. It may be used for zone
     * signing only.
     */
    RSASHA512 = 10,

    /*
     * GOST R 34.10-2001
     *
     * This algorithm is described in RFC 5933. It may be used for zone
     * signing only.
     */
    ECCGOST = 12,

    /*
     * ECDSA Curve P-256 with SHA-256
     *
     * This algorithm is described in RFC 6605. It may be used for zone
     * signing only.
     */
    ECDSAP256SHA256 = 13,

    /*
     * ECDSA Curve P-384 with SHA-384
     *
     * This algorithm is described in RFC 6605. It may be used for zone
     * signing only.
     */
    ECDSAP384SHA384 = 14,

    /*
     * ED25519
     *
     * This algorithm is described in RFC 8080.
     */
    ED25519 = 15,

    /*
     * ED448
     *
     * This algorithm is described in RFC 8080.
     */
    ED448 = 16,

    /*
     * Reserved for Indirect Keys
     *
     * This value is reserved by RFC 4034.
     */
    Indirect = 252,

    /*
     * A private algorithm identified by a domain name.
     *
     * This value is defined in RFC 4034.
     */
    PrivateDNS = 253,

    /*
     * A private algorithm identified by a ISO OID.
     *
     * This value is defined in RFC 4034.
     */
    PrivateOID = 254,

    /**
     * Not being used yet.
     */
    Reserved = 255,
}

/**
 * Delegation signer digest algorithm numbers.
 *
 * Refer to {@link https://www.iana.org/assignments/ds-rr-types/ds-rr-types.xhtml | DNSSEC Delegation Signer (DS) Resource Record (RR) Type Digest Algorithms }
 */
export const enum DigestAlgorithm {
    /*
     * Specifies that the SHA-1 hash function is used.
     *
     * Implementation of this function is currently mandatory.
     */
    SHA1 = 1,

    /*
     * Specifies that the SHA-256 hash function is used.
     *
     * Implementation of this function is currently mandatory.
     */
    SHA256 = 2,

    /*
     * Specifies that the GOST R 34.11-94 hash function is used.
     *
     * Use of this hash function is described in [RFC 5933]. Implementing
     * the function is optional.
     *
     * [RFC 5933]: https://tools.ietf.org/html/rfc5933
     */
    GOST = 3,

    /*
     * Specifies that the SHA-384 hash function is used.
     *
     * Use of this hash function is described in [RFC 6605]. Implementing
     * the function is optional.
     *
     * [RFC 6605]: https://tools.ietf.org/html/rfc6605
     */
    SHA384 = 4,
}

/**
 * NSEC3 hash algorithm numbers.
 *
 * This type selects the algorithm used to hash domain names for use with the [NSEC3].
 *
 * Refer to {@link https://www.iana.org/assignments/dnssec-nsec3-parameters/dnssec-nsec3-parameters.xhtml}
 */
export const enum NSEC3HashAlgorithm {
    SHA1 = 1,
}
