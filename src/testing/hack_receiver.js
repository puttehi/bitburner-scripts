import { LL, log } from "common"
import { config } from "config"
import { ReadFromSender, SendHackRequestResponse } from "ports"
import { tree } from "testing/tree"

/**
 * @param {NS} ns NetScript namespace
 */
export async function main(ns) {
    const message_tick_ms = 3000

    while (true) {
        /** TODO: Can be many types, must check from .type
         * @type {import("ports").HackRequestMessageData | false} message
         */
        const message = await ReadFromSender(
            ns,
            config.io.channels.sender.SEND_GWH_MAIN
        )

        await log(ns, `[hack_receiver.main()] Got ${JSON.stringify(message)}`)

        if (message && message.hack_meta && message.hack_meta.target) {
            //TODO: Use script instead
            const hackedMoney = await ns.hack(message.hack_meta.target) // TODO: threads
            const success = await SendHackRequestResponse(
                ns,
                message,
                hackedMoney
            )
            if (!success) {
                await log(ns, "[hack_receiver.main()] Message sending failed!")
            }
        }
        //const debug_stringified = JSON.stringify(message)
        //const asTree = await tree(ns, message)
        //await log(ns, "\n" + asTree, LL.INFO)

        await ns.sleep(message_tick_ms)
    }
}
