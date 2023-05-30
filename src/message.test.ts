import { stringToBinary } from "./encoding";
import { ParseError } from "./error";
import { Message } from "./message";
import { expect } from "chai";

function hexToBinary(hexStream: string): Uint8Array {
    return stringToBinary(hexStream, "hex");
}

function trimStart(input: string): string {
    return input.trim().replace(/^ +/gm, "");
}

describe("test unpack()", () => {
    it("should fail to unpack", () => {
        expect(() => Message.unpack([])).to.throw(ParseError, "insufficient bytes remaining for read: needs 12, have 0");
    });

    it("should unpack query", () => {
        const msg = Message.unpack(
            hexToBinary("000201000001000000000000076578616d706c6503636f6d0000010001")
        );
        expect(msg.toString()).to.equal(trimStart(`
                ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 2
                ;; flags: rd; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 0

                ;; QUESTION SECTION:
                ;example.com.		IN	A
            `));
    });

    it("should unpack query with EDNS", () => {
        const msg = Message.unpack(
            hexToBinary("2a3301200001000000000001076578616d706c6503636f6d00001c000100002904d000008000000400030000")
        );
        expect(msg.toString()).to.equal(trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 10803
            ;; flags: rd ad; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 1

            ;; OPT PSEUDOSECTION:
            ; EDNS: version: 0, flags: do; udp: 1232
            ; NSID:
            ;; QUESTION SECTION:
            ;example.com.		IN	AAAA
        `));
    });

    it("should unpack response with answer", () => {
        const msg = Message.unpack(
            hexToBinary("c58781a00001000100000001076578616d706c6503636f6d0000010001c00c00010001000145c200045db8d82200002904d0000000000000")
        );
        expect(msg.toString()).to.equal(trimStart(`
                ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 50567
                ;; flags: qr rd ra ad; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

                ;; OPT PSEUDOSECTION:
                ; EDNS: version: 0, flags:; udp: 1232
                ;; QUESTION SECTION:
                ;example.com.		IN	A

                ;; ANSWER SECTION:
                example.com.		83394	IN	A	93.184.216.34
            `));
    });

    it("should unpack response with NSID", () => {
        const msg = Message.unpack(
            hexToBinary("10c381800001000100000001026964067365727665720000100003c00c001000030000000000040353454100002904d000000000000a000300063534336d3130")
        );
        expect(msg.toString()).to.equal(trimStart(`
                ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 4291
                ;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

                ;; OPT PSEUDOSECTION:
                ; EDNS: version: 0, flags:; udp: 1232
                ; NSID: 35 34 33 6d 31 30 ("543m10")
                ;; QUESTION SECTION:
                ;id.server.		CH	TXT

                ;; ANSWER SECTION:
                id.server.		0	CH	TXT	"SEA"
            `));
    });
    it("should unpack response with CNAME", () => {
        const msg = Message.unpack(
            hexToBinary("60dc81a0000100020000000105636e616d65086d696e6768616e67036465760000010001c00c0005000100000e07000d076578616d706c6503636f6d00c030000100010001517700045db8d82200002904d0000000000000")
        );
        expect(msg.toString()).to.equal(trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 24796
            ;; flags: qr rd ra ad; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

            ;; OPT PSEUDOSECTION:
            ; EDNS: version: 0, flags:; udp: 1232
            ;; QUESTION SECTION:
            ;cname.minghang.dev.		IN	A

            ;; ANSWER SECTION:
            cname.minghang.dev.		3591	IN	CNAME	example.com.
            example.com.		86391	IN	A	93.184.216.34
        `));
    });

    it("should unpack response with SOA answer", () => {
        const msg = Message.unpack(
            hexToBinary("841981a00001000100000000076578616d706c6503636f6d0000060001c00c00060001000005ae002c026e73056963616e6e036f726700036e6f6303646e73c02c7886a9aa00001c2000000e100012750000000e10")
        );
        expect(msg.toString()).to.equal(trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 33817
            ;; flags: qr rd ra ad; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0

            ;; QUESTION SECTION:
            ;example.com.		IN	SOA

            ;; ANSWER SECTION:
            example.com.		1454	IN	SOA	ns.icann.org. noc.dns.icann.org. 2022091178 7200 3600 1209600 3600
        `));
    });

    it("should unpack response with SOA in authority", () => {
        const msg = Message.unpack(
            hexToBinary("cf4881a30001000000010000086e78646f6d61696e076578616d706c6503636f6d0000010001c0150006000100000e10002c026e73056963616e6e036f726700036e6f6303646e73c0357886a9aa00001c2000000e100012750000000e10")
        );
        expect(msg.toString()).to.equal(trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 53064
            ;; flags: qr rd ra ad; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 0

            ;; QUESTION SECTION:
            ;nxdomain.example.com.		IN	A

            ;; AUTHORITY SECTION:
            example.com.		3600	IN	SOA	ns.icann.org. noc.dns.icann.org. 2022091178 7200 3600 1209600 3600
        `));
    });

    it("should unpack response with NS answer", () => {
        const msg = Message.unpack(
            hexToBinary("4a1c81a00001000200000000076578616d706c6503636f6d0000020001c00c00020001000150b2001401610c69616e612d73657276657273036e657400c00c00020001000150b200040162c02b")
        );
        expect(msg.toString()).to.equal(trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 18972
            ;; flags: qr rd ra ad; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 0

            ;; QUESTION SECTION:
            ;example.com.		IN	NS

            ;; ANSWER SECTION:
            example.com.		86194	IN	NS	a.iana-servers.net.
            example.com.		86194	IN	NS	b.iana-servers.net.
        `));
    });

    it("should unpack response with NS in authority", () => {
        const msg = Message.unpack(
            hexToBinary("15b981000001000000020000076578616d706c6503636f6d0000010001c00c000200010002a300001401610c69616e612d73657276657273036e657400c00c000200010002a30000040162c02b")
        );
        expect(msg.toString()).to.equal(trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 5561
            ;; flags: qr rd; QUERY: 1, ANSWER: 0, AUTHORITY: 2, ADDITIONAL: 0

            ;; QUESTION SECTION:
            ;example.com.		IN	A

            ;; AUTHORITY SECTION:
            example.com.		172800	IN	NS	a.iana-servers.net.
            example.com.		172800	IN	NS	b.iana-servers.net.
        `));
    });

    it("should unpack response with MX answer", () => {
        const msg = Message.unpack(
            hexToBinary("184781a000010004000000000a636c6f7564666c61726503636f6d00000f0001c00c000f00010000070800210005116d61696c73747265616d2d63616e617279086d787265636f726402696f00c00c000f0001000007080014000a0f6d61696c73747265616d2d65617374c040c00c000f0001000007080014000a0f6d61696c73747265616d2d77657374c040c00c000f00010000070800220014126d61696c73747265616d2d63656e7472616c086d787265636f7264026d7800")
        );
        expect(msg.toString()).to.equal(trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 6215
            ;; flags: qr rd ra ad; QUERY: 1, ANSWER: 4, AUTHORITY: 0, ADDITIONAL: 0

            ;; QUESTION SECTION:
            ;cloudflare.com.		IN	MX

            ;; ANSWER SECTION:
            cloudflare.com.		1800	IN	MX	5 mailstream-canary.mxrecord.io.
            cloudflare.com.		1800	IN	MX	10 mailstream-east.mxrecord.io.
            cloudflare.com.		1800	IN	MX	10 mailstream-west.mxrecord.io.
            cloudflare.com.		1800	IN	MX	20 mailstream-central.mxrecord.mx.
        `));
    });

    it("should unpack response with TXT answer", () => {
        const msg = Message.unpack(
            hexToBinary("1fdd8180000100020000000008686f73746e616d6505617331313204617270610000100001c00c001000010000546000130e436c6f7564666c61726520444e530353464fc00c001000010000546000302f53656520687474703a2f2f7777772e61733131322e6e65742f20666f72206d6f726520696e666f726d6174696f6e2e")
        );
        expect(msg.toString()).to.equal(trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 8157
            ;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 0

            ;; QUESTION SECTION:
            ;hostname.as112.arpa.		IN	TXT

            ;; ANSWER SECTION:
            hostname.as112.arpa.		21600	IN	TXT	"Cloudflare DNS" "SFO"
            hostname.as112.arpa.		21600	IN	TXT	"See http://www.as112.net/ for more information."
        `));
    });

    it("should unpack response with RRSIG", () => {
        const msg = Message.unpack(
            hexToBinary("2a3381a00001000200000001076578616d706c6503636f6d00001c0001c00c001c000100015176001026062800022000010248189325c81946c00c002e000100015176009f001c08020001518063b505a763997ad9e748076578616d706c6503636f6d0010c133412a08c432b07f5e3de9b8de41b9f8dc4c41baf9e77b1ce0a1366b324abcc6d1ac28e639a411ac824653a1fabeec14446deec74b733ecba076c70574bbecfc03923cd1e99d1e53920ce80d0d38e1bd16f130a4ce5998d4c25355668ecb270544bd29b0386c49889b980f2c966cf8d7e30f3289b3c89aedaf365a1297f800002904d000008000000a0003000632386d343633")
        );
        expect(msg.toString()).to.equal(trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 10803
            ;; flags: qr rd ra ad; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

            ;; OPT PSEUDOSECTION:
            ; EDNS: version: 0, flags: do; udp: 1232
            ; NSID: 32 38 6d 34 36 33 ("28m463")
            ;; QUESTION SECTION:
            ;example.com.		IN	AAAA

            ;; ANSWER SECTION:
            example.com.		86390	IN	AAAA	2606:2800:220:1:248:1893:25c8:1946
            example.com.		86390	IN	RRSIG	AAAA 8 2 86400 20230104045047 20221214072721 59208 example.com. EMEzQSoIxDKwf1496bjeQbn43ExBuvnnexzgoTZrMkq8xtGsKOY5pBGsgkZTofq+7BREbe7HS3M+y6B2xwV0u+z8A5I80emdHlOSDOgNDTjhvRbxMKTOWZjUwlNVZo7LJwVEvSmwOGxJiJuYDyyWbPjX4w8yibPImu2vNloSl/g=
        `));
    });

    it("should unpack response with DS", () => {
        const msg = Message.unpack(
            hexToBinary("4db8840000010007000e0010076578616d706c6503636f6d00002b0001c00c002b00010001518000187b6508013490a6806d47f17a34c29e2ce80e8a999ffbe4bec00c002b00010001518000247b650802cde0d742d6998aa554a92d890f8184c698cfac8a26fa59875a990c03e576343cc00c002b0001000151800018aa1b0801b6225ab2cc613e0dca7962bdc2342ea4f1b56083c00c002b0001000151800024aa1b0802615a64233543f66f44d68933625b17497c89a70e858ed76a2145997edf96a918c00c002b00010001518000187aae0801189968811e6eba862dd6c209f75623d8d9ed9142c00c002b00010001518000247aae0802f78cf3344f72137235098ecbbd08947c2c9001c7f6a085a17f518b5d8f6b916dc00c002e00010001518000b7002b08020001518063b65d0463ad121cd2a903636f6d0003ee6fab920a7f7de8ef0b3481f1cc5cef46bb7e2e221baad9924063733c551fd1540006561111249a043bd9ce9e80ec73e424484bb1ca1bfeb529304d8a204fcd8c5425b881414b34e5b8760185f34358abf60d04074799249e772e285dd4cb739b54843d6e5f15525d900e78e18d51cbcbbdcc66f1cf255f8fb434f32380e3d84223b5ea3b0fae2455c64cf69b48e46e9bd12755d1f0aea7868b449eed18f0c014000200010002a300001401690c67746c642d73657276657273036e657400c014000200010002a30000040162c1eac014000200010002a30000040164c1eac014000200010002a30000040161c1eac014000200010002a30000040163c1eac014000200010002a30000040167c1eac014000200010002a30000040166c1eac014000200010002a3000004016ac1eac014000200010002a30000040168c1eac014000200010002a3000004016dc1eac014000200010002a30000040165c1eac014000200010002a3000004016bc1eac014000200010002a3000004016cc1eac014002e00010002a30000b7000208010002a30063b7b03963ae6551d2a903636f6d006193499a3e3f108c2048de47a46b007817f8afbaad17d0d723e526dd6de63b2cff10129635f3ba93815270b9ab87436b3cc6c3d5a12ec9e474ba55cc3bac5697a4023a32e7db863a2172ee429ab0cbb20d3c8bd7e0609fcece4b28fd41b87747adc2f60d0a650189dd833803e4e6940b3ae81591ef6b7c1f39cdeea5f93f3f445e8747cd6cf427d893b1b9c45dd6eec602000a0a809fc5f54f3a67ad3918d7b1c1e8000100010002a3000004c02bac1ec1e8001c00010002a30000102001050339c100000000000000000030c208000100010002a3000004c0210e1ec208001c00010002a300001020010503231d00000000000000020030c218000100010002a3000004c01f501ec218001c00010002a300001020010500856e00000000000000000030c228000100010002a3000004c005061ec228001c00010002a300001020010503a83e00000000000000020030c238000100010002a3000004c01a5c1ec238001c00010002a30000102001050383eb00000000000000000030c248000100010002a3000004c02a5d1ec248001c00010002a300001020010503eea300000000000000000030c258000100010002a3000004c023331ec258001c00010002a300001020010503d41400000000000000000030c268000100010002a3000004c0304f1e0000291000000080000000")
        );
        expect(msg.toString()).to.equal(trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 19896
            ;; flags: qr aa; QUERY: 1, ANSWER: 7, AUTHORITY: 14, ADDITIONAL: 16

            ;; OPT PSEUDOSECTION:
            ; EDNS: version: 0, flags: do; udp: 4096
            ;; QUESTION SECTION:
            ;example.com.		IN	DS

            ;; ANSWER SECTION:
            example.com.		86400	IN	DS	31589 8 1 3490A6806D47F17A34C29E2CE80E8A999FFBE4BE
            example.com.		86400	IN	DS	31589 8 2 CDE0D742D6998AA554A92D890F8184C698CFAC8A26FA59875A990C03E576343C
            example.com.		86400	IN	DS	43547 8 1 B6225AB2CC613E0DCA7962BDC2342EA4F1B56083
            example.com.		86400	IN	DS	43547 8 2 615A64233543F66F44D68933625B17497C89A70E858ED76A2145997EDF96A918
            example.com.		86400	IN	DS	31406 8 1 189968811E6EBA862DD6C209F75623D8D9ED9142
            example.com.		86400	IN	DS	31406 8 2 F78CF3344F72137235098ECBBD08947C2C9001C7F6A085A17F518B5D8F6B916D
            example.com.		86400	IN	RRSIG	DS 8 2 86400 20230105051548 20221229040548 53929 com. A+5vq5IKf33o7ws0gfHMXO9Gu34uIhuq2ZJAY3M8VR/RVAAGVhERJJoEO9nOnoDsc+QkSEuxyhv+tSkwTYogT82MVCW4gUFLNOW4dgGF80NYq/YNBAdHmSSedy4oXdTLc5tUhD1uXxVSXZAOeOGNUcvLvcxm8c8lX4+0NPMjgOPYQiO16jsPriRVxkz2m0jkbpvRJ1XR8K6nhotEnu0Y8A==

            ;; AUTHORITY SECTION:
            com.		172800	IN	NS	i.gtld-servers.net.
            com.		172800	IN	NS	b.gtld-servers.net.
            com.		172800	IN	NS	d.gtld-servers.net.
            com.		172800	IN	NS	a.gtld-servers.net.
            com.		172800	IN	NS	c.gtld-servers.net.
            com.		172800	IN	NS	g.gtld-servers.net.
            com.		172800	IN	NS	f.gtld-servers.net.
            com.		172800	IN	NS	j.gtld-servers.net.
            com.		172800	IN	NS	h.gtld-servers.net.
            com.		172800	IN	NS	m.gtld-servers.net.
            com.		172800	IN	NS	e.gtld-servers.net.
            com.		172800	IN	NS	k.gtld-servers.net.
            com.		172800	IN	NS	l.gtld-servers.net.
            com.		172800	IN	RRSIG	NS 8 1 172800 20230106052305 20221230041305 53929 com. YZNJmj4/EIwgSN5HpGsAeBf4r7qtF9DXI+Um3W3mOyz/EBKWNfO6k4FScLmrh0NrPMbD1aEuyeR0ulXMO6xWl6QCOjLn24Y6IXLuQpqwy7INPIvX4GCfzs5LKP1BuHdHrcL2DQplAYndgzgD5OaUCzroFZHva3wfOc3upfk/P0Reh0fNbPQn2JOxucRd1u7GAgAKCoCfxfVPOmetORjXsQ==

            ;; ADDITIONAL SECTION:
            i.gtld-servers.net.		172800	IN	A	192.43.172.30
            i.gtld-servers.net.		172800	IN	AAAA	2001:503:39c1::30
            b.gtld-servers.net.		172800	IN	A	192.33.14.30
            b.gtld-servers.net.		172800	IN	AAAA	2001:503:231d::2:30
            d.gtld-servers.net.		172800	IN	A	192.31.80.30
            d.gtld-servers.net.		172800	IN	AAAA	2001:500:856e::30
            a.gtld-servers.net.		172800	IN	A	192.5.6.30
            a.gtld-servers.net.		172800	IN	AAAA	2001:503:a83e::2:30
            c.gtld-servers.net.		172800	IN	A	192.26.92.30
            c.gtld-servers.net.		172800	IN	AAAA	2001:503:83eb::30
            g.gtld-servers.net.		172800	IN	A	192.42.93.30
            g.gtld-servers.net.		172800	IN	AAAA	2001:503:eea3::30
            f.gtld-servers.net.		172800	IN	A	192.35.51.30
            f.gtld-servers.net.		172800	IN	AAAA	2001:503:d414::30
            j.gtld-servers.net.		172800	IN	A	192.48.79.30
        `));
    });

    it("should unpack response with DNSKEY", () => {
        const msg = Message.unpack(
            hexToBinary("9bc581a00001000300000001076578616d706c6503636f6d0000300001c00c00300001000002d100880100030803010001bd6824ef9f0aa764c47b5061507fb453e026985cf95c63518cfe79519fd3bef33311ca81c7bd13018189f16e2a18e5d840345503ec5955f5bf3b94996ae2dce82c4c19484e474ccfa554e20f78b8ee93f4c224b68928b8e89d233bcea8b47e3b62d25cd86260e21603db372f193947696bc1deafad1bd3d8247519d66e525281c00c00300001000002d1010801010308030100019d1aaaed6b27aa2b2729eb45f3693e66b2259a00c7d21cdbf465f554162cc1f28f1c5e9b75544a83542055c44506e3d00f4e829d330ccf5821c70a2d177a2e65a20c2b7b50943155d0fe85e6f911ce2a96a1a6c97f4c0da6e4bd7d8dbccc2c51e71b601abca177934fd2d198252df4a52dfd63a2e832840b1a06fdb593ca4ad7c8147c7a50fe490638dce0158e55ab565b47c60a78feb8410af45b99d7e5ba768f220bb6ede1365389b20d22d3f1ae00d2b079b871b83e439af5d211b3dcb4d0cda659fe25c8f79eeef8b97dec3675b6b21d79a278671a007af1efa34600005e637f77c639660cd714905d60a4d59495ae1f5996db69843303dde62ddae783e3c00c00300001000002d101080101030803010001b38503197e2e4b7450c825662cca102d40c54bbcce58fae4a61ab51e7005632b875f136332bf8a0e98d6de584d608eebc6f29e8ae936ef5fa8d1402d7edb565f7f8326c0d2fd04845f9d8179a851f457ee4b0c1a006fb5f6b6fd8f5ade495734baa44eccc84383c43150a3b6bca5d7d05ef7f3e415e0bd2138e031142c421981dfd7b23189da97e7f76d4c4a9387eaedcb8453475b469b9ee07fcdea33ee71758ec22300913261821aa0cbea3d15f229fad47f7a629aa3de3fc295570dc3dfe41d7c8fbc73d92bd34f18aea82cc232db319e29191dca21d63e20f98d41f3320c22fac433ea591a187f62e7f847008181a6028bd86988c595bd2e16073c74fe5500002904d0000000000000")
        );
        expect(msg.toString()).to.equal(trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 39877
            ;; flags: qr rd ra ad; QUERY: 1, ANSWER: 3, AUTHORITY: 0, ADDITIONAL: 1

            ;; OPT PSEUDOSECTION:
            ; EDNS: version: 0, flags:; udp: 1232
            ;; QUESTION SECTION:
            ;example.com.		IN	DNSKEY

            ;; ANSWER SECTION:
            example.com.		721	IN	DNSKEY	256 3 8 AwEAAb1oJO+fCqdkxHtQYVB/tFPgJphc+VxjUYz+eVGf077zMxHKgce9EwGBifFuKhjl2EA0VQPsWVX1vzuUmWri3OgsTBlITkdMz6VU4g94uO6T9MIktokouOidIzvOqLR+O2LSXNhiYOIWA9s3Lxk5R2lrwd6vrRvT2CR1GdZuUlKB
            example.com.		721	IN	DNSKEY	257 3 8 AwEAAZ0aqu1rJ6orJynrRfNpPmayJZoAx9Ic2/Rl9VQWLMHyjxxem3VUSoNUIFXERQbj0A9Ogp0zDM9YIccKLRd6LmWiDCt7UJQxVdD+heb5Ec4qlqGmyX9MDabkvX2NvMwsUecbYBq8oXeTT9LRmCUt9KUt/WOi6DKECxoG/bWTykrXyBR8elD+SQY43OAVjlWrVltHxgp4/rhBCvRbmdflunaPIgu27eE2U4myDSLT8a4A0rB5uHG4PkOa9dIRs9y00M2mWf4lyPee7vi5few2dbayHXmieGcaAHrx76NGAABeY393xjlmDNcUkF1gpNWUla4fWZbbaYQzA93mLdrng+M=
            example.com.		721	IN	DNSKEY	257 3 8 AwEAAbOFAxl+Lkt0UMglZizKEC1AxUu8zlj65KYatR5wBWMrh18TYzK/ig6Y1t5YTWCO68bynorpNu9fqNFALX7bVl9/gybA0v0EhF+dgXmoUfRX7ksMGgBvtfa2/Y9a3klXNLqkTszIQ4PEMVCjtryl19Be9/PkFeC9ITjgMRQsQhmB39eyMYnal+f3bUxKk4fq7cuEU0dbRpue4H/N6jPucXWOwiMAkTJhghqgy+o9FfIp+tR/emKao94/wpVXDcPf5B18j7xz2SvTTxiuqCzCMtsxnikZHcoh1j4g+Y1B8zIMIvrEM+pZGhh/Yuf4RwCBgaYCi9hpiMWVvS4WBzx0/lU=
        `));
    });

    it("should unpack response with NSEC", () => {
        const msg = Message.unpack(
            hexToBinary("411281a30001000000040001086e78646f6d61696e076578616d706c6503636f6d0000010001c0150006000100000e10002c026e73056963616e6e036f726700036e6f6303646e73c0357886a9ae00001c2000000e100012750000000e10c015002e000100000e10009f0006080200000e1063cd4b6563b10060e748076578616d706c6503636f6d00bab10679585cacb7488bf5f9ec9bfad1c5bff9efc91af7ce5ea23e50715565e6324f71583409bf1872fe704989a25234918799af823c85ba4cca0500da08b102e3e3b41471cfcac3a7e7c0a9c3b2b1d663df6738a147814060864c41241650f416e6af268fa42c525ce65ae0b4e1abc8851657d364c5e7341ebb4bfe2fd40765c015002f000100000e10001a03777777076578616d706c6503636f6d00000762018008000380c015002e000100000e10009f002f080200000e1063c978d463add0c0e748076578616d706c6503636f6d008e6f40bfb3704e07e5f5c2e87a88f00ce1e0e9591504b411ba7314d630295e99045c93ef1d65f236cc08d60ef6cea1d14d07249c86f81fcc56a1a9dd10baf47ef5ca91a6de4e1d18a9a8f576daf95f99436c05f5487d88fe3ceae8bc84112d2b82ed03ef7110431259749ab4c0f58abc6a2581f5f08246be74136d3582ea525200002904d0000080000000")
        );
        expect(msg.toString()).to.equal(trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 16658
            ;; flags: qr rd ra ad; QUERY: 1, ANSWER: 0, AUTHORITY: 4, ADDITIONAL: 1

            ;; OPT PSEUDOSECTION:
            ; EDNS: version: 0, flags: do; udp: 1232
            ;; QUESTION SECTION:
            ;nxdomain.example.com.		IN	A

            ;; AUTHORITY SECTION:
            example.com.		3600	IN	SOA	ns.icann.org. noc.dns.icann.org. 2022091182 7200 3600 1209600 3600
            example.com.		3600	IN	RRSIG	SOA 8 2 3600 20230122144245 20230101033912 59208 example.com. urEGeVhcrLdIi/X57Jv60cW/+e/JGvfOXqI+UHFVZeYyT3FYNAm/GHL+cEmJolI0kYeZr4I8hbpMygUA2gixAuPjtBRxz8rDp+fAqcOysdZj32c4oUeBQGCGTEEkFlD0FuavJo+kLFJc5lrgtOGryIUWV9Nkxec0HrtL/i/UB2U=
            example.com.		3600	IN	NSEC	www.example.com. A NS SOA MX TXT AAAA RRSIG NSEC DNSKEY
            example.com.		3600	IN	RRSIG	NSEC 8 2 3600 20230119170732 20221229173912 59208 example.com. jm9Av7NwTgfl9cLoeojwDOHg6VkVBLQRunMU1jApXpkEXJPvHWXyNswI1g72zqHRTQcknIb4H8xWoandELr0fvXKkabeTh0Yqaj1dtr5X5lDbAX1SH2I/jzq6LyEES0rgu0D73EQQxJZdJq0wPWKvGolgfXwgka+dBNtNYLqUlI=
        `));
    });
});

describe('test toJsonObject', function () {
    it("should unpack response with answer", () => {
        const msg = Message.unpack(
            hexToBinary("c58781a00001000100000001076578616d706c6503636f6d0000010001c00c00010001000145c200045db8d82200002904d0000000000000")
        );
        expect(JSON.stringify(msg.toJsonObject())).to.equal(`{"Status":0,"TC":false,"RD":true,"RA":true,"AD":true,"CD":false,"Question":[{"name":"example.com.","type":1}],"Answer":[{"name":"example.com.","type":1,"TTL":83394,"data":"93.184.216.34"}]}`);
    });
});
