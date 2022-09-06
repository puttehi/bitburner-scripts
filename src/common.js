import { config } from "./config.js"

const LL = config.logging.levels

/**@param {NS} ns @param {string} filepath @returns {Object} JSON obj*/
export async function readJsonTxtFile(ns, filepath) {
    const content = ns.read(filepath)
    log(ns, "CONTENT")
    ns.tprint(content)
    let obj = {}
    try {
        obj = JSON.parse(content)
    } catch (err) {
        log(ns, err, LL.ERROR)
        throw err
    } finally {
        log(ns, "OBJ")
        ns.tprint(JSON.stringify(obj))
        return obj
    }
}

/**@param {NS} ns @param {string} level @param {string} message*/
export async function log(ns, message = "\n", level = LL.DEBUG) {
    if (level < config.logging.level) return

    ns.tprint(`${level.toUpperCase()} | ${message}`)
}
