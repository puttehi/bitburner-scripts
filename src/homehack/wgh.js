import { LL, log } from "common"
// import { config } from "./config.js"

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

    /**
     * (method) NS.hack(host: string, opts?: BasicHGWOptions): Promise<number>
     * Steal a servers money.
     * @remarks — RAM cost: 0.1 GB
     * Function that is used to try and hack servers to steal money and gain hacking experience. The runtime for this command depends on your hacking level and the target server’s security level when this function is called. In order to hack a server you must first gain root access to that server and also have the required hacking level.
     * A script can hack a server from anywhere. It does not need to be running on the same server to hack that server. For example, you can create a script that hacks the foodnstuff server and run that script on any server in the game.
     * A successful hack() on a server will raise that server’s security level by 0.002.
     * @example — ```ts // NS1: var earnedMoney = hack("foodnstuff");
     * @example* — ```ts
     * // NS2:
     * let earnedMoney = await ns.hack("foodnstuff");
     * @paramhost — - Hostname of the target server to hack.
     * @paramopts — - Optional parameters for configuring function behavior.
     * @returns — The amount of money stolen if the hack is successful, and zero otherwise.
     */
    const usedRam = 20
    const hackCost = 0.1
    const weakenCost = 0.1
    const growCost = 0.15

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
                threads: usedRam * weakenCost,
            })
            await log(
                ns,
                `Weaken ${reducedSecurity1} security from ${host}`,
                LL.INFO
            )
            await log(ns, `Growing ${host} | Duration: ${growTime}`, LL.INFO)
            const grownMoney = await ns.grow(host, {
                threads: usedRam * growCost,
            })
            await log(ns, `Grow \$${grownMoney} to ${host}`, LL.INFO)
            await log(
                ns,
                `Weakening ${host} | Duration: ${weakenTime}`,
                LL.INFO
            )
            const reducedSecurity2 = await ns.weaken(host, {
                threads: usedRam * weakenCost,
            })
            await log(
                ns,
                `Weaken ${reducedSecurity2} security from ${host}`,
                LL.INFO
            )
            await log(ns, `Hacking ${host} | Duration: ${hackTime}`, LL.INFO)
            const stolenMoney = await ns.hack(host, {
                threads: usedRam * hackCost,
            })
            await log(ns, `Hack \$${stolenMoney} from ${host}`, LL.INFO)
        }

        await log(ns, `Loop done.`, LL.INFO)

        await ns.sleep(50)
    }

    await log(ns, `Exiting.`, LL.INFO)

    return
}
