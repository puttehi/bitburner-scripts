import { config } from "config.js"

// Logging levels
const LL = Object.freeze({
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
})

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
