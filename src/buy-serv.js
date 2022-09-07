import { log, LL } from "common"

const _HELP_TEXT = `Usage: <hostname> <ram(2^x)> <count>`

/** @param {NS} ns */
export async function main(ns) {
    const valid_ram_values = Array(10)
        .fill(2, 0, 10)
        .map((val, i) => Math.pow(val, i + 1))
    if (ns.args.length != 3 || ns.args[1] in valid_ram_values) {
        log(ns, _HELP_TEXT, LL.HELP)

        return 1
    }

    const hostname = ns.args[0] //`${ns.args[0]}-${ns.getPurchasedServers().length + 1}`
    const ram = ns.args[1]
    const count = ns.args[2]
    const max_failures = 2

    const purchased = []
    let failures = 0
    for (let i = 0; i < count; i++) {
        const host = ns.purchaseServer(hostname, ram)
        if (host === "") {
            failures += 1
            await log(ns, `Couldn't buy ${hostname}:${ram} (${i})`)
            if (failures >= max_failures) break
            continue
        }
        purchased.push(host)
    }

    const amountPurchased = purchased.length
    const failed = amountPurchased == 0
    const logStr = failed
        ? `No hosts bought`
        : `Bought ${amountPurchased} hosts: ${purchased}`
    await log(ns, logStr, failed ? LL.WARN : LL.INFO)

    return failed ? 1 : 0
}
