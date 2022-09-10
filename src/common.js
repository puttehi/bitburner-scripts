import { config } from "config"

export const LL = config.logging.levels

const LOG_LEVEL = config.logging.level

/**
 * Deprecated: Read a json.txt file to an object
 * @param {NS} ns
 * @param {string} filepath
 * @returns {Object} JSON obj*/
export async function readJsonTxtFile(ns, filepath) {
    const content = ns.read(filepath)
    await log(ns, "CONTENT")
    ns.tprint(content)
    let obj = {}
    try {
        obj = JSON.parse(content)
    } catch (err) {
        await log(ns, err, LL.ERROR)
        throw err
    } finally {
        await log(ns, "OBJ")
        ns.tprint(JSON.stringify(obj))
        return obj
    }
}

/**
 * @param {NS} ns NetScript namespace
 * @param {import("./config.js").LogLevel} level Log level
 * @param {string} message Log message
 * */
export async function log(ns, message = "\n", level = LL.DEBUG) {
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
export async function deepscan(ns) {
    let servers = new Set(["."])
    for (const next of servers)
        ns.scan(next).forEach(server => servers.add(server))
    return [...servers]
}

export function isObject(value) {
    return !!(value && typeof value === "object" && !Array.isArray(value))
}
