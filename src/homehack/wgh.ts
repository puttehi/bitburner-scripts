import { NS } from "@ns"
import { LL, log } from "/common"
import { NukeHosts, OpenAllPorts } from "/worker-init"

export async function main(ns: NS): Promise<void> {
    const hosts: Array<string> = ["joesguns"]
    await log(
        ns,
        `Starting wgh on ${hosts} sequentially, one host at a time`,
        LL.INFO
    )

    const scriptThreads = ns.getRunningScript()?.threads || 0

    await log(ns, `wgh threads: ${scriptThreads}`, LL.DEBUG)

    while (true) {
        for (const host of hosts) {
            if (!ns.hasRootAccess(host)) {
                await OpenAllPorts(ns, [host])
                await NukeHosts(ns, [host])
            }

            if (await tooHighSecurity(ns, host))
                await weaken(ns, host, scriptThreads)
            else if (await notEnoughMoney(ns, host))
                await grow(ns, host, scriptThreads)
            else await hack(ns, host, scriptThreads)
        }

        await log(ns, `Loop done.`, LL.INFO)

        await ns.sleep(50)
    }

    await log(ns, `Exiting.`, LL.INFO)

    return
}

async function tooHighSecurity(ns: NS, host: string): Promise<boolean> {
    const minSecurity: number = ns.getServerMinSecurityLevel(host)
    const currentSecurity: number = ns.getServerSecurityLevel(host)
    const threshold = 0.1 // If there's more than 10% of minimum, return true

    return minSecurity / (currentSecurity - minSecurity) > threshold
}

async function notEnoughMoney(ns: NS, host: string): Promise<boolean> {
    const maxMoney: number = ns.getServerMaxMoney(host)
    const currentMoney: number = ns.getServerMoneyAvailable(host)
    const threshold = 0.95 // If there's under 95% of maximum available, return true

    return currentMoney / maxMoney < threshold
}

async function weaken(ns: NS, host: string, threads: number): Promise<void> {
    const weakenTime = ns.getWeakenTime(host)
    await log(ns, `Weakening ${host} | Duration: ${weakenTime}`, LL.INFO)
    const reducedSecurity = await ns.weaken(host, {
        threads: threads,
    })
    await log(ns, `Weaken ${reducedSecurity} security from ${host}`, LL.INFO)
    return
}

async function grow(ns: NS, host: string, threads: number) {
    const growTime = ns.getGrowTime(host)
    await log(ns, `Growing ${host} | Duration: ${growTime}`, LL.INFO)
    const grownMoney = await ns.grow(host, {
        threads: threads,
    })
    await log(ns, `Grow $${grownMoney} to ${host}`, LL.INFO)
    return
}

async function hack(ns: NS, host: string, threads: number) {
    const hackTime = ns.getHackTime(host)
    await log(ns, `Hacking ${host} | Duration: ${hackTime}`, LL.INFO)
    const stolenMoney = await ns.hack(host, {
        threads: threads,
    })
    await log(ns, `Hack $${stolenMoney} from ${host}`, LL.INFO)
    return
}
