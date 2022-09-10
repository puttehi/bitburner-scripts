import { LL, log as _log, deepscan } from "common"
import { config } from "config"

/**
 * Do base installation on all hosts
 *
 * Usage: run worker-init.js
 * @param {NS} ns ns
 * @returns {boolean} Success - False if something went wrong
 */
export async function main(ns) {
    const hosts = await deepscan(ns)
    //await log(ns, hosts.toString())
    await InstallHosts(ns, hosts)
}

/**
 * Sync `config.libs` to all `hosts`
 * @param {NS} ns NetScript namespace
 * @param {string[]} hosts Hosts to send `config.libs` to.
 * @returns {boolean} `true` if no errors, `false` otherwise.
 */
export async function SyncLibraries(ns, hosts) {
    if (!checkIsArray(ns, hosts, "[SyncLibraries]", "hosts")) return false

    const source = "home"
    for (const host of hosts) {
        // ns.scp(files:string[],dest:string,source?:string)
        const did_any_copy_succeed = await ns.scp(config.libs, host, source)

        if (!did_any_copy_succeed) {
            await log(
                ns,
                `[SyncLibraries][scp][${source}->${host}] All copies failed`,
                LL.ERROR
            )
        }
    }
}

/**
 *
 * @param {NS} ns NetScript namespace
 * @param {string[]} hosts List of hosts to breach
 * @returns {boolean} Success - Returns false if something went wrong.
 */
export async function OpenAllPorts(ns, hosts) {
    if (!checkIsArray(ns, hosts, "[OpenAllPorts]", "hosts")) return false

    const exploits = [
        {
            hasProgram: () => ns.fileExists("BruteSSH.exe", "home"),
            runExploit: target => ns.brutessh(target),
            serverAttr: "sshPortOpen",
        },
        {
            hasProgram: () => ns.fileExists("FTPCrack.exe", "home"),
            runExploit: target => ns.ftpcrack(target),
            serverAttr: "ftpPortOpen",
        },
        {
            hasProgram: () => ns.fileExists("relaySMTP.exe", "home"),
            runExploit: target => ns.relaysmtp(target),
            serverAttr: "smtpPortOpen",
        },
        {
            hasProgram: () => ns.fileExists("HTTPWorm.exe", "home"),
            runExploit: target => ns.httpworm(target),
            serverAttr: "httpPortOpen",
        },
        {
            hasProgram: () => ns.fileExists("SQLInject.exe", "home"),
            runExploit: target => ns.sqlinject(target),
            serverAttr: "sqlPortOpen",
        },
    ]

    for (const host of hosts) {
        const server = ns.getServer(host)
        for (const exploit of exploits) {
            // TODO: Can possibly get bools from this when looking at BB src even if it's wrong type void
            if (server[exploit.serverAttr] && exploit.hasProgram())
                exploit.runExploit(host)
        }
    }

    return true
}

/**
 *
 * @param {NS} ns NetScript namespace
 * @param {string[]} hosts List of hosts to breach
 * @returns {boolean} Success - Returns false if something went wrong.
 */
export async function NukeHosts(ns, hosts) {
    if (!checkIsArray(ns, hosts, "[NukeHosts]", "hosts")) return false

    for (const host of hosts) {
        const server = ns.getServer(host)
        const numRequired = ns.getServerNumPortsRequired(host)
        if (server.openPortCount > numRequired) ns.nuke(host)
        else
            log(
                ns,
                `[NukeHosts][nuke][${host}] Not enough ports open. Has ${server.openPortCount}, expected ${numRequired}`,
                LL.TRACE
            )
    }

    return true
}

/**
 * Install custom libraries to, open all ports and nuke all `hosts`
 * @param {NS} ns NetScript namespace
 * @param {string[]} hosts Array of hosts
 * @returns {boolean} Success - false if something went wrong
 */
export async function InstallHosts(ns, hosts, killall = false) {
    if (!checkIsArray(ns, hosts, "[InstallHosts]", "hosts")) return false

    const exec = {
        sync: {
            func: async (ns, hosts) => await SyncLibraries(ns, hosts),
            result: null,
        },
        exploit: {
            func: async (ns, hosts) => await OpenAllPorts(ns, hosts),
            result: null,
        },
        nuke: {
            func: async (ns, hosts) => await NukeHosts(ns, hosts),
            result: null,
        },
    }

    //for (const [name, meta] of Object.entries(exec)) {
    for (const name of ["sync", "exploit", "nuke"]) {
        const meta = exec[name]
        meta.result = await meta.func(ns, hosts)
        if (killall) {
            for (const host of hosts) ns.killall(host)
        }
    }

    // Log report
    for (const [name, meta] of Object.entries(exec)) {
        if (meta.result == false)
            log(ns, `[InstallHosts][${name}] Install step failed`, LL.ERROR)
    }

    return true
}

/**
 * Log a message prefixed with [Worker init]
 * @param {NS} ns NetScape namespace
 * @param {string} msg Message
 * @param {import("./config").LogLevel} logLevel
 */
async function log(ns, msg, logLevel = LL.DEBUG) {
    await _log(ns, `[worker-init]${msg}`, logLevel)
}

/**
 * Check if `possibleArray` is an array
 * @param {NS} ns NetScript namespace
 * @param {any} possibleArray Possible array to check
 * @param {string} logPrefix How to prefix logs? E.g. [function-name]
 * @param {string} arrayMemberNickname What are the array members called? E.g. hosts
 * @returns {boolean} Was `possibleArray` an array?
 */
async function checkIsArray(ns, possibleArray, logPrefix, arrayMemberNickname) {
    if (!Array.isArray(possibleArray)) {
        await log(
            ns,
            `${logPrefix}[checkIsArray] Given ${arrayMemberNickname} was not an array`
        )
        return false
    }
    return true
}
