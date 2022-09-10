import { log } from "common"
import { SendHackRequestMessage, ReadFromSender } from "ports"
import { config } from "config"
/**
 * @param {NS} ns NetScript namespace
 */
export async function main(ns) {
    const script = "TODO"
    const threads = 2
    const target = "iron-gym"

    const receiver = ns.args[0]

    const message_tick_ms = 8000

    while (true) {
        const success = await SendHackRequestMessage(
            ns,
            receiver,
            script,
            threads,
            target
        )

        if (!success) {
            await log(ns, "[hack_sender.main()] Message sending failed!")
        }

        /** TODO: Can be many types, must check from .type
         * @type {import("ports").HackRequestResponseData | false} message
         */
        const response = await ReadFromSender(
            ns,
            config.io.channels.sender.SEND_GWH_MAIN
        )

        await log(
            ns,
            `[hack_sender.main()] Got back ${JSON.stringify(response)}`
        )

        if (response && response.request) {
            const hackedMoney = response.stolenMoney
            const sender = response.meta.sender
            const hackTarget = response.request.hack_meta.target
            const hackSuccess = hackedMoney != 0
            // const duration = message.duration ?
            await log(
                ns,
                `[hack_sender.main()][${sender}->${hackTarget}] ${
                    hackSuccess ? `\$${hackedMoney}` : "Hack failed"
                }`,
                hackSuccess ? LL.SUCCESS : LL.INFO
            )
        }

        await ns.sleep(message_tick_ms)
    }
}
