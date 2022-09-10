import { LL, log } from "common"
// import { config } from "./config.js"

/**
 * @param {NS} ns NetScript namespace
 */
export async function main(ns) {
    const script = "/homehack/wgh.js"
    const ramTarget = 100 // TODO: This is wrong
    const scriptCost = ns.getScriptRam(script)
    const maxPossibleThreads = Math.floor(ramTarget / scriptCost)

    ns.killall("home")

    await log(
        ns,
        `Starting ${script} with ${maxPossibleThreads} threads`,
        LL.INFO
    )

    const pid = ns.run(script, maxPossibleThreads)

    if (pid === 0) {
        await log(ns, `${script} execution failed! PID was 0`, LL.ERROR)
        return 1
    }

    await log(ns, `${script} running with PID ${pid}`, LL.INFO)

    await log(ns, `Exiting`, LL.INFO)
    return 0
}
