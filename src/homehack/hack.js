import { LL, log } from "./common.js"
// import { config } from "./config.js"

/**
 * @param {NS} ns NetScript namespace
 */
export async function main(ns) {
    /**
     * Start another script on the current server.
     * @remarks
     * RAM cost: 1 GB
     *
     * Run a script as a separate process. This function can only be used to run scripts located on the
     * current server (the server running the script that calls this function). Requires a significant
     * amount of RAM to run this command.
     *
     * If the script was successfully started, then this functions returns the PID of that script.
     * Otherwise, it returns 0.
     *
     * PID stands for Process ID. The PID is a unique identifier for each script.
     * The PID will always be a positive integer.
     *
     * Running this function with a numThreads argument of 0 will return 0 without running the script.
     * However, running this function with a negative numThreads argument will cause a runtime error.
     *
     * @example
     * ```ts
     * // NS1:
     * //The simplest way to use the run command is to call it with just the script name. The following example will run ‘foo.script’ single-threaded with no arguments:
     * run("foo.script");
     *
     * //The following example will run ‘foo.script’ but with 5 threads instead of single-threaded:
     * run("foo.script", 5);
     *
     * //This next example will run ‘foo.script’ single-threaded, and will pass the string ‘foodnstuff’ into the script as an argument:
     * run("foo.script", 1, 'foodnstuff');
     * ```
     * @example
     * ```ts
     * // NS2:
     * //The simplest way to use the run command is to call it with just the script name. The following example will run ‘foo.script’ single-threaded with no arguments:
     * ns.run("foo.script");
     *
     * //The following example will run ‘foo.script’ but with 5 threads instead of single-threaded:
     * ns.run("foo.script", 5);
     *
     * //This next example will run ‘foo.script’ single-threaded, and will pass the string ‘foodnstuff’ into the script as an argument:
     * ns.run("foo.script", 1, 'foodnstuff');
     * ```
     * @param script - Filename of script to run.
     * @param numThreads - Optional thread count for new script. Set to 1 by default. Will be rounded to nearest integer.
     * @param args - Additional arguments to pass into the new script that is being run. Note that if any arguments are being passed into the new script, then the second argument numThreads must be filled in with a value.
     * @returns Returns the PID of a successfully started script, and 0 otherwise.
     */

    const usedRam = 20
    const mostExpensiveOp = 0.15
    const maxPossibleThreads = Math.ceil(usedRam * mostExpensiveOp)

    const script = "/homehack/wgh.js"

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
