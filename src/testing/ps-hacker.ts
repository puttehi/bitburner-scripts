import { Publish, Subscribe } from "pubsub"
import { log as _log, LL } from "common"
import { LogLevels } from "/config"

async function log(
    ns: NS,
    message: string,
    prefix = "",
    logLevel: LogLevels = LL.DEBUG
): Promise<void> {
    const scriptPrefix = "[ps-hack]"
    await _log(ns, `${scriptPrefix}${prefix} ${message}`, logLevel)
}

export async function main(ns: NS): Promise<void> {
    let subscribed = false
    while (!subscribed) {
        subscribed = await Subscribe(ns, "hack-request", messageHandler)
        await ns.sleep(1000)
    }

    while (true) {
        await ns.sleep(1000) // Keep alive
    }
}

async function messageHandler(
    ns: NS,
    msg: Record<string, unknown>
): Promise<void> {
    await log(ns, JSON.stringify(msg), `[recv]`, LL.TRACE)
    const hackedMoney = await ns.hack(msg.target as string, {
        threads: (msg.threads as number) ?? 1,
    })
    const response = {
        sender: ns.getHostname(),
        target: msg.target,
        hackedMoney: hackedMoney,
    }
    await Publish(ns, "hack-request-response", response)
}
