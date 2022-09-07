import { config } from "config"

export const LL = config.logging.levels

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
    if (level < config.logging.level) return

    let levelName = "UNKNOWN"
    for (const [k, v] of Object.entries(config.logging.levels)) {
        if (v == level) {
            levelName = k
            break
        }
    }

    ns.tprint(`${levelName.toUpperCase()} | ${message}`)
}
