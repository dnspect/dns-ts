
/**
 * A package implements RFC 6891: Extension Mechanisms for DNS (EDNS(0))
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc6891 | RFC 6891}.
 *
 * @packageDocumentation
 */

import { Cookie } from "./cookie";
import { ExtendedError } from "./ede";
import { NSID } from "./nsid";
import { OptCode, Option } from "./option";
import { Slice } from "../packet";

export { Cookie } from "./cookie";
export { ExtendedError, ExtendedErrorCode, EDE_PRIVATE_RANGE_BEGIN } from "./ede";
export { NSID } from "./nsid";
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
            case OptCode.Cookie:
                options.push(new Cookie(data.readSlice(len)));
                break;
            case OptCode.ExtendedError:
                options.push(new ExtendedError(data.readSlice(len)));
                break;
            default:
                data.readSlice(len);
        }
    }

    return options;
}
