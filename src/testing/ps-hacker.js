import { Publish, Subscribe } from "pubsub"
import { log as _log, LL } from "common"

async function log(ns, message, prefix = "", logLevel = LL.DEBUG) {
    const scriptPrefix = "[ps-hack]"
    _log(ns, `${scriptPrefix}${prefix} ${message}`, logLevel)
}

export async function main(ns) {
    let subscribed = false
    while (!subscribed) {
        subscribed = await Subscribe(ns, "hack-request", messageHandler)
        await ns.sleep(1000)
    }

    while (true) {
        await ns.sleep(1000) // Keep alive
    }
}

async function messageHandler(ns, msg) {
    await log(ns, JSON.stringify(msg), `[recv]`, LL.TRACE)
    const hackedMoney = await ns.hack(msg.target, { threads: msg.threads || 1 })
    const response = {
        sender: ns.getHostname(),
        target: msg.target,
        hackedMoney: hackedMoney,
    }
    await Publish(ns, "hack-request-response", response)
}
