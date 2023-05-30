import { Writer } from "../buffer";
import { SemanticError } from "../error";
import { FQDN } from "../fqdn";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Uint16 } from "../types";

/**
 * A Service record (SRV record) is a specification of data in the Domain Name System defining the
 * location.
 *
 * For example, the hostname and port number, of servers for specified services.
 *
 * It is defined in {@link https://datatracker.ietf.org/doc/html/rfc2782 | RFC 2782}, and its type
 * code is 33. Some Internet protocols such as the Session Initiation Protocol (SIP) and the
 * Extensible Messaging and Presence Protocol (XMPP) often require SRV support by network elements.
 *
 * The format of the SRV RR
 *
 * Here is the format of the SRV RR, whose DNS type code is 33:
 *       _Service._Proto.Name TTL Class SRV Priority Weight Port Target
 */
export class SRV extends RR {
    /**
     * The symbolic name of the desired service, as defined in Assigned Numbers [STD 2] or locally.
     * An underscore (_) is prepended to the service identifier to avoid collisions with DNS labels
     * that occur in nature.
     *
     * Some widely used services, notably POP, don't have a single universal name. If Assigned
     * Numbers names the service indicated, that name is the only name which is legal for SRV lookups.
     *
     * The Service is case insensitive.
     */
    service!: string;
    /**
     * The symbolic name of the desired protocol, with an underscore (_) prepended to prevent
     * collisions with DNS labels that occur in nature. _TCP and _UDP are at present the most useful
     * values for this field, though any name defined by Assigned Numbers or locally may be used
     * (as for Service).
     *
     * The Proto is case insensitive.
     */
    proto!: string;
    /**
     * The domain this RR refers to. The SRV RR is unique in that the name one searches for is not
     * this name; the example near the end shows this clearly.
     */
    name!: FQDN;
    /**
     * The priority of this target host.
     *
     * A client MUST attempt to contact the target host with the lowest-numbered priority it can
     * reach; target hosts with the same priority SHOULD be tried in an order defined by the weight
     * field.
     *
     * The range is 0-65535. This is a 16 bit unsigned integer in network byte order.
     */
    priority!: Uint16;
    /**
     * A server selection mechanism. The range of this number is 0-65535. This is a 16 bit unsigned
     * integer in network byte order.
     */
    weight!: Uint16;
    /**
     * The port on this target host of this service. The range is 0-65535. This is a 16 bit unsigned
     * integer in network byte order.
     *
     * This is often as specified in Assigned Numbers but need not be.
     */
    port!: Uint16;
    /**
     * The domain name of the target host.
     *
     * There MUST be one or more address records for this name, the name MUST NOT be an alias (in
     * the sense of RFC 1034 or RFC 2181). Implementors are urged, but not required, to return the
     * address record(s) in the Additional Data section.
     *
     * A Target of "." means that the service is decidedly not available at this domain.
     */
    target!: FQDN;

    unpackRdata(rdata: Slice): void {
        const owner = this.header.name.toString();

        const firstDot = owner.indexOf(".");
        if (firstDot <= 0) {
            throw new SemanticError("invalid service field");
        }
        this.service = owner.substring(0, firstDot);
        if (this.service.charAt(0) === '_') {
            this.service = this.service.substring(1);
        }

        const secondDot = owner.indexOf(".", firstDot + 1);
        if (secondDot <= firstDot + 1) {
            throw new SemanticError("invalid proto field");
        }
        this.proto = owner.substring(firstDot, secondDot);
        if (this.proto.charAt(0) === '_') {
            this.proto = this.proto.substring(1);
        }

        this.name = FQDN.parse(owner.substring(secondDot));

        this.priority = rdata.readUint16();
        this.port = rdata.readUint16();
        this.weight = rdata.readUint16();
        this.target = rdata.readDomainName();
    }

    packRdata(buf: Writer): number {
        return buf.writeUint16(this.priority) +
            buf.writeUint16(this.port) +
            buf.writeUint16(this.weight) +
            this.target.pack(buf);
    }

    /**
     * @override
     */
    dataString(): string {
        return `${this.priority} ${this.port} ${this.weight} ${this.target}`;
    }
}
