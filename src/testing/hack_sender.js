import { log } from "./common.js"
import { SendHackRequestMessage } from "./ports.js"

/**
 * @param {NS} ns NetScript namespace
 */
export async function main(ns) {
    const script = "foo"
    const threads = 69
    const target = "bar"

    const receiver = ns.args[0]

    const message_tick_ms = 3000

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

        await ns.sleep(message_tick_ms)
    }
}
