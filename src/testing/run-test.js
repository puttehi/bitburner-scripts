import { LL, log } from "common"
import { config } from "config"
import { InstallHosts } from "worker-init"

/**
 * @param {NS} ns NetScript namespace
 */
export async function main(ns) {
    const hosts = ["joesguns"]
    await log(ns, `Starting tests on ${hosts}`, LL.INFO)

    await log(ns, `Doing base install to ${hosts}`, LL.INFO)

    ns.kill("testing/hack_sender.js", "home", 1, "joesguns")
    await InstallHosts(ns, hosts, true)

    await log(ns, `Setting up networking for home->joesguns `, LL.INFO)

    await log(ns, `Flushing send ports`, LL.INFO)
    for (const [channel, port] of Object.entries(config.io.channels.sender)) {
        ns.clearPort(port)
        await log(ns, `Flushed ${channel}`, LL.INFO)
    }

    await log(ns, `Networking configured. `, LL.INFO)

    await log(ns, `Starting test scripts. `, LL.INFO)
    await ns.exec("testing/hack_sender.js", "home", 1, "hack-cluster") // Start sending data to receiver
    await ns.exec("testing/hack_receiver.js", "joesguns", 1) // Start reading data on receiver
}
