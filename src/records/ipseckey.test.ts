import { expect } from "chai";
import { parseRecord } from ".";
import { RR } from "../rr";
import { RRType } from "../types";

describe("test IPSECKEY", () => {
    // https://datatracker.ietf.org/doc/html/rfc4025#section-3.2
    const examples = [
        // An example of a node, 192.0.2.38, that will accept IPsec tunnels on its own behalf.
        [
            `38.2.0.192.in-addr.arpa. 7200 IN     IPSECKEY ( 10 1 2
                    192.0.2.38
                    AQNRU3mG7TVTO2BkR47usntb102uFJtugbo6BSGvgqt4AQ== )`,
            `38.2.0.192.in-addr.arpa.\t\t7200\tIN\tIPSECKEY\t10 1 2 192.0.2.38 AQNRU3mG7TVTO2BkR47usntb102uFJtugbo6BSGvgqt4AQ==`,
        ],
        // An example of a node, 192.0.2.38, that has published its key only.
        [
            `38.2.0.192.in-addr.arpa. 7200 IN     IPSECKEY ( 10 0 2
                    .
                    AQNRU3mG7TVTO2BkR47usntb102uFJtugbo6BSGvgqt4AQ== )`,
            `38.2.0.192.in-addr.arpa.\t\t7200\tIN\tIPSECKEY\t10 0 2 . AQNRU3mG7TVTO2BkR47usntb102uFJtugbo6BSGvgqt4AQ==`,
        ],
        // An example of a node, 192.0.2.38, that has delegated authority to the node 192.0.2.3.
        [
            `38.2.0.192.in-addr.arpa. 7200 IN     IPSECKEY ( 10 1 2
                    192.0.2.3
                    AQNRU3mG7TVTO2BkR47usntb102uFJtugbo6BSGvgqt4AQ== )`,
            `38.2.0.192.in-addr.arpa.\t\t7200\tIN\tIPSECKEY\t10 1 2 192.0.2.3 AQNRU3mG7TVTO2BkR47usntb102uFJtugbo6BSGvgqt4AQ==`,
        ],
        // An example of a node, 192.0.1.38 that has delegated authority to the node with the identity
        // "mygateway.example.com".
        [
            `38.1.0.192.in-addr.arpa. 7200 IN     IPSECKEY ( 10 3 2
                    mygateway.example.com.
                    AQNRU3mG7TVTO2BkR47usntb102uFJtugbo6BSGvgqt4AQ== )`,
            `38.1.0.192.in-addr.arpa.\t\t7200\tIN\tIPSECKEY\t10 3 2 mygateway.example.com. AQNRU3mG7TVTO2BkR47usntb102uFJtugbo6BSGvgqt4AQ==`,
        ],
        // An example of a node, 2001:0DB8:0200:1:210:f3ff:fe03:4d0, that has delegated authority to
        // the node 2001: 0DB8: c000:0200: 2:: 1
        //; $ORIGIN 1.0.0.0.0.0.2.8.B.D.0.1.0.0.2.ip6.arpa.
        [
            `0.d.4.0.3.0.e.f.f.f.3.f.0.1.2.0.1.0.0.0.0.0.2.8.B.D.0.1.0.0.2.ip6.arpa. 7200 IN     IPSECKEY ( 10 2 2
                    2001:0DB8:0:8002::2000:1
                    AQNRU3mG7TVTO2BkR47usntb102uFJtugbo6BSGvgqt4AQ== )`,
            `0.d.4.0.3.0.e.f.f.f.3.f.0.1.2.0.1.0.0.0.0.0.2.8.B.D.0.1.0.0.2.ip6.arpa.\t\t7200\tIN\tIPSECKEY\t10 2 2 2001:db8:0:8002::2000:1 AQNRU3mG7TVTO2BkR47usntb102uFJtugbo6BSGvgqt4AQ==`,
        ],
    ];
    for (const i in examples) {
        let key: RR | undefined;

        it(`should parse ex ${i + 1}`, () => {
            key = parseRecord(examples[i][0]);
            expect(key.header.type).to.be.equals(RRType.IPSECKEY);
        });

        it(`should present ex ${i + 1}`, () => {
            const out = key?.present();
            expect(out).to.be.equals(examples[i][1]);
        });
    }
});
