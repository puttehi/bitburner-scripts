import { config } from "/config"

export const LL = config.logging.levels

const LOG_LEVEL = config.logging.level

export async function readJsonTxtFile(
    ns: NS,
    filepath: string
): Promise<Record<string, unknown>> {
    const content = ns.read(filepath)
    await log(ns, "CONTENT")
    ns.tprint(content)
    let obj = {}
    try {
        obj = JSON.parse(content)
    } catch (err) {
        if (err instanceof Error) await log(ns, err.message, LL.ERROR)
        throw err
    } finally {
        await log(ns, "OBJ")
        ns.tprint(JSON.stringify(obj))
    }
    return obj
}

/**
 * @param {NS} ns NetScript namespace
 * @param {import("./config.js").LogLevel} level Log level
 * @param {string} message Log message
 * */
export async function log(
    ns: NS,
    message = "\n",
    level = LL.DEBUG
): Promise<void> {
    if (level < LOG_LEVEL) return

    let levelName = "UNKNOWN"
    for (const [k, v] of Object.entries(LL)) {
        if (v == level) {
            levelName = k
            break
        }
    }

    ns.tprint(`${levelName.toUpperCase()} | ${message}`)
}

// /**
//  *
//  * @param {NS} ns
//  * @param {*} accum
//  * @param {*} previous
//  * @param {*} origin
//  * @returns
//  */
// export async function deepscan(
//     ns,
//     accum = [],
//     previous = null,
//     origin = "home",
// ) {

//     if (origin == null) return accum

//     const hosts = ns.scan(origin).filter(val => val != previous)
//     accum.push(...hosts)

//     for (const host of hosts) {
//         const deeperHosts = await deepscan(ns, accum, origin, host)
//         accum.push(...deeperHosts)
//     }

//     return accum
// }

/**
 *
 * @param {NS} ns
 * @returns
 */
export async function deepscan(ns: NS): Promise<Array<string>> {
    const servers = new Set(["."])
    for (const next of servers)
        ns.scan(next).forEach(server => servers.add(server))
    return [...servers]
}

export function isObject(value: unknown): boolean {
    return !!(value && typeof value === "object" && !Array.isArray(value))
}
