
/**
 * A package implements RFC 6891: Extension Mechanisms for DNS (EDNS(0))
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc6891 | RFC 6891}.
 *
 * @packageDocumentation
 */

import { NSID } from "./nsid";
import { ClientSubnet } from "./client-subnet";
import { Cookie } from "./cookie";
import { ExtendedError } from "./ede";
import { OptCode, Option } from "./option";
import { Padding } from "./padding";
import { UnknownOption } from "./unknown-option";
import { Slice } from "../packet";

export { NSID } from "./nsid";
export { ClientSubnet } from "./client-subnet";
export { Cookie } from "./cookie";
export { Padding } from "./padding";
export { ExtendedError, ExtendedErrorCode, EDE_PRIVATE_RANGE_BEGIN } from "./ede";
export { UnknownOption } from "./unknown-option";
export { OptCode, Option } from "./option";

export function unpack(data: Slice): Option[] {
    const options = new Array<Option>();

    // At least should have 2 bytes for option code and 2 bytes for option length
    while (data.remaining() >= 4) {
        const code = data.readUint16();
        const len = data.readUint16();
        switch (code) {
            case OptCode.NSID:
                options.push(new NSID(data.readSlice(len)));
                break;
            case OptCode.ClientSubnet:
                options.push(new ClientSubnet(data.readSlice(len)));
                break;
            case OptCode.Cookie:
                options.push(new Cookie(data.readSlice(len)));
                break;
            case OptCode.Padding:
                options.push(new Padding(data.readSlice(len)));
                break;
            case OptCode.ExtendedError:
                options.push(new ExtendedError(data.readSlice(len)));
                break;
            default:
                options.push(new UnknownOption(code, data.readUint8Array(len)));
        }
    }

    return options;
}
