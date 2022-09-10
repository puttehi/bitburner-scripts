import { LL, log } from "common"

/**
 * @param {NS} ns NetScript namespace
 */
export async function main(ns) {
    const hosts = ["joesguns"]
    await log(
        ns,
        `Starting WGWH on ${hosts} sequentially, one host at a time`,
        LL.INFO
    )

    //const usedRam = 20
    //const hackCost = 0.1
    //const weakenCost = 0.1
    //const growCost = 0.15

    //const weakenThreads = usedRam * weakenCost
    //const hackThreads = usedRam * growCost
    //const growThreads = usedRam * weakenCost

    const scriptThreads = ns.getRunningScript().threads
    const weakenThreads = scriptThreads
    const hackThreads = scriptThreads
    const growThreads = scriptThreads

    await log(ns, `wgh threads: ${scriptThreads}`, LL.DEBUG)

    while (true) {
        for (const host of hosts) {
            if (!ns.hasRootAccess(host)) {
                ns.brutessh(host)
                ns.nuke(host)
            }

            const weakenTime = ns.getWeakenTime(host)
            const hackTime = ns.getHackTime(host)
            const growTime = ns.getGrowTime(host)

            await log(
                ns,
                `Weakening ${host} | Duration: ${weakenTime}`,
                LL.INFO
            )
            const reducedSecurity1 = await ns.weaken(host, {
                threads: weakenThreads,
            })
            await log(
                ns,
                `Weaken ${reducedSecurity1} security from ${host}`,
                LL.INFO
            )

            await log(ns, `Growing ${host} | Duration: ${growTime}`, LL.INFO)
            const grownMoney = await ns.grow(host, {
                threads: growThreads,
            })
            await log(ns, `Grow \$${grownMoney} to ${host}`, LL.INFO)

            await log(
                ns,
                `Weakening ${host} | Duration: ${weakenTime}`,
                LL.INFO
            )
            const reducedSecurity2 = await ns.weaken(host, {
                threads: weakenThreads,
            })
            await log(
                ns,
                `Weaken ${reducedSecurity2} security from ${host}`,
                LL.INFO
            )

            await log(ns, `Hacking ${host} | Duration: ${hackTime}`, LL.INFO)
            const stolenMoney = await ns.hack(host, {
                threads: hackThreads,
            })
            await log(ns, `Hack \$${stolenMoney} from ${host}`, LL.INFO)
        }

        await log(ns, `Loop done.`, LL.INFO)

        await ns.sleep(50)
    }

    await log(ns, `Exiting.`, LL.INFO)

    return
}
