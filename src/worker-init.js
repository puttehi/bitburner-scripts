import { LL, log } from "./common"
import { config } from "./config"

/**
 * Sync `config.libs` to all `hosts`
 * @param {NS} ns NetScript namespace
 * @param {string[]} hosts Hosts to send `config.libs` to.
 * @returns {boolean} `true` if no errors, `false` otherwise.
 */
export async function SyncLibraries(ns, hosts) {
    const source = "home"
    for (const host of hosts) {
        // ns.scp(files:string[],dest:string,source?:string)
        const did_any_copy_succeed = await ns.scp(config.libs, host, source)

        if (!did_any_copy_succeed) {
            await log(
                ns,
                `[SyncScripts] All copies failed ${source} -> ${host}`,
                LL.ERROR
            )
        }
    }
}
