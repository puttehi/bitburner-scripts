import { LL, log as _log, deepscan } from "common"
import { config, LogLevels } from "config"

export async function main(ns: NS): Promise<boolean> {
    const hosts = await deepscan(ns)
    //await log(ns, hosts.toString())
    const success = await InstallHosts(ns, hosts)
    return success
}

export async function SyncLibraries(
    ns: NS,
    hosts: Array<string>
): Promise<boolean> {
    if (!checkIsArray(ns, hosts, "[SyncLibraries]", "hosts")) return false

    const source = "home"
    let err = false
    for (const host of hosts) {
        // ns.scp(files:string[],dest:string,source?:string)
        const did_any_copy_succeed = await ns.scp(config.libs, host, source)

        if (!did_any_copy_succeed) {
            await log(
                ns,
                `[SyncLibraries][scp][${source}->${host}] All copies failed`,
                LL.ERROR
            )
            err = true
        }
    }

    if (err) return false
    return true
}

interface IExploits {
    hasProgram: () => boolean
    runExploit: (target: string) => void
    serverAttr: string
}

//type Exploits = Record<string, IExploits>

export async function OpenAllPorts(
    ns: NS,
    hosts: Array<string>
): Promise<boolean> {
    if (!checkIsArray(ns, hosts, "[OpenAllPorts]", "hosts")) return false

    const exploits: Array<IExploits> = [
        {
            hasProgram: () => ns.fileExists("BruteSSH.exe", "home"),
            runExploit: (target: string) => ns.brutessh(target),
            serverAttr: "sshPortOpen",
        },
        {
            hasProgram: () => ns.fileExists("FTPCrack.exe", "home"),
            runExploit: (target: string) => ns.ftpcrack(target),
            serverAttr: "ftpPortOpen",
        },
        {
            hasProgram: () => ns.fileExists("relaySMTP.exe", "home"),
            runExploit: (target: string) => ns.relaysmtp(target),
            serverAttr: "smtpPortOpen",
        },
        {
            hasProgram: () => ns.fileExists("HTTPWorm.exe", "home"),
            runExploit: (target: string) => ns.httpworm(target),
            serverAttr: "httpPortOpen",
        },
        {
            hasProgram: () => ns.fileExists("SQLInject.exe", "home"),
            runExploit: (target: string) => ns.sqlinject(target),
            serverAttr: "sqlPortOpen",
        },
    ]

    for (const host of hosts) {
        const server = ns.getServer(host) as unknown as Record<string, unknown>
        for (const exploit of exploits) {
            // TODO: Can possibly get bools from this when looking at BB src even if it's wrong type void
            if (server[exploit.serverAttr] && exploit.hasProgram())
                exploit.runExploit(host)
        }
    }

    return true
}

export async function NukeHosts(
    ns: NS,
    hosts: Array<string>
): Promise<boolean> {
    if (!checkIsArray(ns, hosts, "[NukeHosts]", "hosts")) return false

    for (const host of hosts) {
        const server = ns.getServer(host)
        const numRequired = ns.getServerNumPortsRequired(host)
        if (server.openPortCount > numRequired) ns.nuke(host)
        else
            await log(
                ns,
                `[NukeHosts][nuke][${host}] Not enough ports open. Has ${server.openPortCount}, expected ${numRequired}`,
                LL.TRACE
            )
    }

    return true
}

interface IExecutors {
    func: (ns: NS, hosts: Array<string>) => Promise<boolean>
    result: boolean | null
}

/**
 * Install custom libraries to, open all ports and nuke all `hosts`
 * @param ns NetScript namespace
 * @param hosts Array of hosts
 * @returns Success - false if something went wrong
 */
export async function InstallHosts(
    ns: NS,
    hosts: Array<string>,
    killall = false
): Promise<boolean> {
    if (!checkIsArray(ns, hosts, "[InstallHosts]", "hosts")) return false

    const exec: Record<string, IExecutors> = {
        sync: {
            func: async (ns: NS, hosts: Array<string>) =>
                await SyncLibraries(ns, hosts),
            result: null,
        },
        exploit: {
            func: async (ns: NS, hosts: Array<string>) =>
                await OpenAllPorts(ns, hosts),
            result: null,
        },
        nuke: {
            func: async (ns: NS, hosts: Array<string>) =>
                await NukeHosts(ns, hosts),
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
            await log(
                ns,
                `[InstallHosts][${name}] Install step failed`,
                LL.ERROR
            )
    }

    return true
}

/**
 * Log a message prefixed with [Worker init]
 * @param {NS} ns NetScape namespace
 * @param {string} msg Message
 * @param {import("./config").LogLevel} logLevel
 */
async function log(
    ns: NS,
    msg: string,
    logLevel: LogLevels = LL.DEBUG
): Promise<void> {
    await _log(ns, `[worker-init]${msg}`, logLevel)
}

/**
 * Check if `possibleArray` is an array
 * @param ns NetScript namespace
 * @param possibleArray Possible array to check
 * @param logPrefix How to prefix logs? E.g. [function-name]
 * @param arrayMemberNickname What are the array members called? E.g. hosts
 * @returns Was `possibleArray` an array?
 */
async function checkIsArray(
    ns: NS,
    possibleArray: unknown,
    logPrefix: string,
    arrayMemberNickname: string
): Promise<boolean> {
    if (!Array.isArray(possibleArray)) {
        await log(
            ns,
            `${logPrefix}[checkIsArray] Given ${arrayMemberNickname} was not an array`
        )
        return false
    }
    return true
}
