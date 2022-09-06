import { LL, log } from "../common.js"
import { config } from "../config.js"
import { ReadFromSender } from "../ports.js"

/**
 * @param {NS} ns NetScript namespace
 */
export async function main(ns) {
    const message_tick_ms = 8000

    while (true) {
        const message = await ReadFromSender(
            ns,
            config.io.channels.sender.SEND_GWH_MAIN
        )

        const debug_stringified = JSON.stringify(message)
        await log(ns, debug_stringified, LL.INFO)

        await ns.sleep(message_tick_ms)
    }
}
