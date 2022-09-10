import { Publish, Subscribe } from "pubsub"
import { log as _log, LL } from "common"

async function log(ns, message, prefix = "", logLevel = LL.DEBUG) {
    const scriptPrefix = "[ps-dist]"
    _log(ns, `${scriptPrefix}${prefix} ${message}`, logLevel)
}

const TARGETS = ["n00dles"]

export async function main(ns) {
    let subscribed = false
    while (!subscribed) {
        subscribed = await Subscribe(
            ns,
            "hack-request-response",
            messageHandler
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

async function messageHandler(ns, msg) {
    await log(ns, msg, `[recv]`, LL.TRACE)
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
