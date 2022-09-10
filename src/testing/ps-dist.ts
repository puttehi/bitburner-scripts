import { MessageHandlerCallback, Publish, Subscribe } from "pubsub"
import { log as _log, LL } from "common"
import { LogLevels } from "/config"

async function log(
    ns: NS,
    message: string,
    prefix = "",
    logLevel: LogLevels = LL.DEBUG
): Promise<void> {
    const scriptPrefix = "[ps-dist]"
    await _log(ns, `${scriptPrefix}${prefix} ${message}`, logLevel)
}

const TARGETS = ["n00dles"]

export async function main(ns: NS): Promise<void> {
    let subscribed = false
    while (!subscribed) {
        subscribed = await Subscribe(
            ns,
            "hack-request-response",
            messageHandler as MessageHandlerCallback
        )
        await ns.sleep(1000)
    }

    let timer = 0
    const every_ms = 20000

    while (true) {
        if (timer > every_ms) {
            for (const host of TARGETS) {
                await Publish(ns, "hack-request", {
                    target: host,
                    threads: 1,
                })
            }
            timer = 0
        }
        timer += 1000
        await ns.sleep(1000) // Keep alive
    }
}

async function messageHandler(
    ns: NS,
    message: Record<string, unknown>
): Promise<void> {
    await log(ns, JSON.stringify(message), `[recv]`, LL.TRACE)
    // if (
    // msg &&
    // Object.keys(msg).some(
    // key =>
    // key ==
    // ["sender", "target", "hackedMoney"].some(
    // wanted => wanted === key
    // )
    // )
    // ) {
    // //const { sender, target, threads, hackedMoney } = msg
    // //let str = ""
    // //for (const [k, v] of msg) {
    // //    str += `${k}: ${v} `
    // //}
    // //const str = JSON.stringify(msg)
    // }
}
