# @dnspect/dns-ts

[![npm](https://img.shields.io/npm/v/@dnspect/dns-ts.svg)](https://www.npmjs.com/package/@dnspect/dns-ts) &nbsp;
[![Run npm tests](https://github.com/dnspect/dns-ts/actions/workflows/test.yml/badge.svg)](https://github.com/dnspect/dns-ts/actions/workflows/test.yml) &nbsp;
[![Lint](https://github.com/dnspect/dns-ts/actions/workflows/lint.yml/badge.svg)](https://github.com/dnspect/dns-ts/actions/workflows/lint.yml) &nbsp;

DNS library in TypeScript.

## Features

- DNSSEC
- EDNS(0)
- Message compression

## Install

Add this package to your package.json by running this in the root of your project's directory:

```sh
npm install @dnspect/dns-ts
```

## Usage

This package is designed to have no dependency on specific JavaScript runtime.

Build a DNS message:

```javascript
import { MessageBuilder, RRType } from "@dnspect/dns-ts";

const mb = new MessageBuilder();
const hb = mb.header();
hb.randomId();

const qb = mb.question();
qb.push_in("example.com", RRType.A);

const msg = mb.build();
```

Parse wireformat data:

```javascript
import { Message, stringToBinary } from "@dnspect/dns-ts";

// ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 2
// ;; flags: rd; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 0
//
// ;; QUESTION SECTION:
// ;example.com.  IN A
const msg = Message.unpack(
  stringToBinary("000201000001000000000000076578616d706c6503636f6d0000010001", "hex")
);
```

## Supported RFCs

This is a list adopted from <https://github.com/miekg/dns/blob/master/README.md>. This library may not be going to support all of them, but should mark the RFCs that it supports.

- [x] 103{4,5} - DNS standard
- [x] 1348 - NSAP record (removed the record)
- [x] 1982 - Serial Arithmetic
- [x] 1876 - LOC record
- [x] 1995 - IXFR
- [x] 1996 - DNS notify
- [x] 2136 - DNS Update (dynamic updates)
- [x] 2537 - RSAMD5 DNS keys (obsoleted by 3110)
- [x] 2065 - DNSSEC (updated in later RFCs)
- [x] 2671 - EDNS record
- [x] 2782 - SRV record
- [x] 2845 - TSIG record
- [x] 2915 - NAPTR record
- [x] 2929 - DNS IANA Considerations
- [x] 3110 - RSASHA1 DNS keys
- [ ] 3123 - APL record
- [x] 3225 - DO bit (DNSSEC OK)
- [x] 340{1,2,3} - NAPTR record
- [x] 3445 - Limiting the scope of (DNS)KEY
- [ ] 3597 - Unknown RRs
- [ ] 4025 - A Method for Storing IPsec Keying Material in DNS
- [ ] 403{3,4,5} - DNSSEC + validation functions
- [x] 4255 - SSHFP record
- [x] 4343 - Case insensitivity
- [x] 4408 - SPF record
- [ ] 4509 - SHA256 Hash in DS
- [x] 4592 - Wildcards in the DNS
- [ ] 4635 - HMAC SHA TSIG
- [ ] 4701 - DHCID
- [x] 4892 - id.server
- [x] 5001 - NSID
- [x] 5155 - NSEC3 record
- [ ] 5205 - HIP record
- [ ] 5702 - SHA2 in the DNS
- [ ] 5936 - AXFR
- [ ] 5966 - TCP implementation recommendations
- [ ] 6605 - ECDSA
- [ ] 6725 - IANA Registry Update
- [ ] 6742 - ILNP DNS
- [ ] 6840 - Clarifications and Implementation Notes for DNS Security
- [ ] 6844 - CAA record
- [x] 6891 - EDNS0 update
- [ ] 6895 - DNS IANA considerations
- [ ] 6944 - DNSSEC DNSKEY Algorithm Status
- [ ] 6975 - Algorithm Understanding in DNSSEC
- [ ] 7043 - EUI48/EUI64 records
- [ ] 7314 - DNS (EDNS) EXPIRE Option
- [ ] 7477 - CSYNC RR
- [ ] 7828 - edns-tcp-keepalive EDNS0 Option
- [ ] 7553 - URI record
- [ ] 7858 - DNS over TLS: Initiation and Performance Considerations
- [x] 7871 - EDNS0 Client Subnet
- [x] 7873 - Domain Name System (DNS) Cookies
- [ ] 8080 - EdDSA for DNSSEC
- [ ] 8499 - DNS Terminology
- [ ] 8659 - DNS Certification Authority Authorization (CAA) Resource Record
- [ ] 8777 - DNS Reverse IP Automatic Multicast Tunneling (AMT) Discovery
- [x] 8914 - Extended DNS Errors
- [x] 8976 - Message Digest for DNS Zones (ZONEMD RR)
