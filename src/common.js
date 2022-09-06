import { config } from "./config.js"

export const LL = config.logging.levels

/**@param {NS} ns @param {string} filepath @returns {Object} JSON obj*/
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

    ns.tprint(`${level.toUpperCase()} | ${message}`)
}
