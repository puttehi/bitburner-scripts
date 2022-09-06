import { LL, log } from "../common.js"
import { config } from "../config.js"
import { SyncLibraries } from "../worker-init.js"

/**
 * @param {NS} ns NetScript namespace
 */
export async function main(ns) {
    await log(ns, `Starting tests on ${hosts}`, LL.INFO)

    await log(ns, `Syncing libs to ${hosts}`, LL.INFO)
    await SyncLibraries(ns, ["joesguns"])

    await log(ns, `Putting up networking for home->joesguns `, LL.INFO)

    //ns.exec(script: string, host: string, numThreads?: number, ...args: (string | number | boolean)[]): number
    await ns.exec("hack_sender.js", "home", 1, "joesguns") // Start sending data to receiver
    await ns.exec("hack_receiver.js", "joesguns", 1) // Start reading data on receiver
}
