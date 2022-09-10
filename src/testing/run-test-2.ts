import { LL, log } from "common"
//import { config } from "config"
import { InstallHosts } from "worker-init"

/**
 * @param ns NetScript namespace
 */
export async function main(ns: NS): Promise<void> {
    const hosts = ["joesguns"]
    await log(ns, `Starting tests on ${hosts}`, LL.INFO)

    await log(ns, `Doing base install to ${hosts}`, LL.INFO)

    const dists = ns
        .ps("home")
        .filter(script => script.filename == "/testing/ps-dist.js")
    for (const dist of dists) ns.kill(dist.filename, "home")
    await InstallHosts(ns, hosts, true)

    await log(ns, `Starting test scripts. `, LL.INFO)
    await ns.exec("testing/ps-dist.js", "home")
    for (const host of hosts) {
        await log(ns, `${host}... `, LL.INFO)
        await ns.exec("testing/ps-hacker.js", host)
    }
}
