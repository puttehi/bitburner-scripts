/**
 * Convert (milli)seconds to time string (hh:mm:ss[:mss]).
 *
 * @param Boolean hideMillis = true
 *
 * @return String
 */
Number.prototype.toTimeString = function (hideMillis = true) {
    var _24HOURS = 8.64e7;  // 24*60*60*1000

    var ms = hideMillis ? this * 1000 : this,
        endPos = ~(4 * !!hideMillis),  // to trim "Z" or ".sssZ"
        timeString = new Date(ms).toISOString().slice(11, endPos);

    if (ms >= _24HOURS) {  // to extract ["hh", "mm:ss[.mss]"]
        var parts = timeString.split(/:(?=\d{2}:)/);
        parts[0] -= -24 * Math.floor(ms / _24HOURS);
        timeString = parts.join(":");
    }

    return timeString;
};

/**
 * Convert numbers to spaced string
 * 1234567890 -> 1 234 567 890
 *
 * @return String
 */
Number.prototype.toSpacedString = function () {
    return Math.round(this).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};
/**
 * Round numbers to two decimals
 * 12345.67890 -> 12345.68
 *
 * @return Number
 */
Number.prototype.roundToTwoDecimals = function () {
    return Math.round(this * 100) / 100
};


//const HACK_SCRIPT = "h1.js"
// const WEAKEN_SCRIPT = "w1.js"
// const GROW_SCRIPT = "g1.js"
const HACK_SCRIPT = "h2.js"
const WEAKEN_SCRIPT = "w2.js"
const GROW_SCRIPT = "g2.js"
const SHARE_SCRIPT = "s2.js"

/**
 * Finds the optimal server to hack and hacks it from all possible servers except home.
 * Only run from home server
 * @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("disableLog")
    ns.disableLog("enableLog")
    ns.disableLog("getServerMaxMoney")
    ns.disableLog("getServerMoneyAvailable")
    ns.disableLog("getServerMinSecurityLevel")
    ns.disableLog("getServerSecurityLevel")
    ns.disableLog("killall")
    ns.disableLog("getServerUsedRam")
    ns.disableLog("getServerMaxRam")
    ns.disableLog("getServerNumPortsRequired")
    ns.disableLog("getServerRequiredHackingLevel")
    ns.disableLog("getHackingLevel")
    ns.disableLog("scp")
    ns.disableLog("scan")
    ns.disableLog("sleep")
    //let FORCED_HACK_COUNT = 0
    //let SHARED_SERVERS = []

    //if (ns.args.length > 0) FORCED_HACK_COUNT = parseInt(ns.args[0])
    //if (ns.args.length > 1) SHARED_SERVERS = [...js.args.slice(1)] // skip first arg, use remaining as ns.share() servers for factions

    let lastTarget = ""
    let lastTotalStolenCash = 0
    let lastTotalDecreasedSecurity = 0
    let lastTotalMultiplier = 0
    let lastTotalIncreasedCash = 0
    let lastTotalUsedRam = 0
    let lastTotalUsedThreads = 0
    let lastTotalSleepTime = 0

    const MIN_SLEEP_TIME = 2000
    const REMOTE_SCRIPT_LOOPS = 1
    const PROGRESS_REPORT_PROGRESS = 0.1
    while (true) {
        var allServers = await findAllServers(ns);  // finds all servers and clones grow hack and weaken files
        var { rootableServers, optimalServer } = await findHackable(ns, allServers);    // finds and nukes optimal, hackable, and rootale servers.

        //var TARGET = ns.args[0] || optimalServer;
        //var SHARE_TARGETS = ns.args.slice(1) // ns.args[1:]
        var TARGET = optimalServer;
        var SHARE_TARGETS = []

        const numShared = parseInt(ns.args[0])
        if (!isNaN(numShared)) {
            // First were number of servers, second was prefix, find matching
            SHARE_TARGETS = findAllByPrefix(ns, ns.args[1]).splice(0, numShared)
        } else {
            // All were servers given, use explicit list
            SHARE_TARGETS = ns.args
        }

        if (SHARE_TARGETS != null && SHARE_TARGETS.length > 0)
            for (let i = 0; i < SHARE_TARGETS.length; i++) {
                const shareTarget = SHARE_TARGETS[i]

                ns.killall(shareTarget)
                const shareThreads = (ns.getServerMaxRam(shareTarget) - ns.getServerUsedRam(shareTarget)) / ns.getScriptRam(SHARE_SCRIPT, shareTarget)

                ns.exec(SHARE_SCRIPT, shareTarget, shareThreads)

                rootableServers = rootableServers.filter(val => val != shareTarget)
            }
        const totalSharePower = ns.getSharePower().toFixed(2)
        ns.tprint('[SHARING] @ ' + SHARE_TARGETS + ` (${totalSharePower})`)

        ns.tprint('[STARTED] @ ' + TARGET);
        const WEAKEN_TIME = ns.getWeakenTime(TARGET)
        const GROW_TIME = ns.getGrowTime(TARGET)
        const HACK_TIME = ns.getHackTime(TARGET)

        let hacked = false
        let weakened = false
        //let dbgarr = []
        let totalUsedRam = 0
        let totalUsedThreads = 0
        let totalSleepTime = 0
        let totalStolenCash = 0
        let totalDecreasedSecurity = 0
        let totalMultiplier = 0
        let totalIncreasedCash = 0
        let startSecurity = ns.getServerSecurityLevel(TARGET)
        for (let i = 0; i < rootableServers.length; i++) {
            const remote = rootableServers[i]
            var { longestTotalTime, shouldHack, shouldWeaken, totalRequiredRamPerThread, threadsPerScript } = runScriptsOnRemoteToTarget(ns, remote, TARGET, { loops: REMOTE_SCRIPT_LOOPS });
            hacked = shouldHack
            weakened = shouldWeaken
            totalSleepTime = Math.max(longestTotalTime, totalSleepTime)
            //dbgarr.push(totalSleepTime, longestTotalTime, shouldHack, shouldWeaken)
            //ns.print(">>>>>>>>>>>>>> dbg " + totalSleepTime)
            totalUsedThreads += threadsPerScript * 2
            totalUsedRam += totalRequiredRamPerThread * threadsPerScript
        }

        if (lastTarget != "") {
            const cashSpacedStr = lastTotalStolenCash.toSpacedString()
            const serverCashSpacedStr = (lastTotalMultiplier * ns.getServerMaxMoney(lastTarget)).toSpacedString()
            const decrSecuRoundedStr = lastTotalDecreasedSecurity.roundToTwoDecimals()
            const targetSecurRoundedStr = ns.getServerSecurityLevel(lastTarget).roundToTwoDecimals()
            ns.print(`*** RESULTS FROM LAST RUN ON ${lastTarget} ***`)
            ns.print(`<<< FROM ${lastTarget} <<<`)
            ns.print(`+ \$${cashSpacedStr} stolen`)
            ns.print(`>>> ON ${lastTarget} >>>`)
            ns.print(`- ${decrSecuRoundedStr} security (${startSecurity.roundToTwoDecimals()}->${targetSecurRoundedStr})`)
            ns.print(`+ \$${serverCashSpacedStr} grow on server`)

            // Reset target counters
            lastTarget = ""
            lastTotalStolenCash = 0
            lastTotalDecreasedSecurity = 0
            lastTotalMultiplier = 0
            lastTotalIncreasedCash = 0
            lastTotalUsedRam = 0
            lastTotalUsedThreads = 0
            lastTotalSleepTime = 0
        }
        const cashSpacedStr = ns.getServerMoneyAvailable(TARGET).toSpacedString()
        const secuRounded = ns.getServerSecurityLevel(TARGET).roundToTwoDecimals()
        const sleepTime = (MIN_SLEEP_TIME + totalSleepTime).toTimeString(false)
        ns.print(`************ TARGET: ${TARGET} ************`)
        ns.print(`Target cash: \$ ${cashSpacedStr}`)
        ns.print(`Target security: ${secuRounded}`)
        ns.print(`do? oper.\ttime(hh:mm:ss.mss)`)
        ns.print(`${weakened ? "[x]" : "[ ]"} weaken\tbase ${WEAKEN_TIME.toTimeString(false)}`)
        ns.print(`${hacked ? "[x]" : "[ ]"} hack\tbase ${HACK_TIME.toTimeString(false)}`)
        ns.print(`${hacked ? "[ ]" : "[x]"} grow\tbase ${GROW_TIME.toTimeString(false)}`)
        ns.print(`Workers: ${rootableServers.length}`)
        ns.print(`Total execution time for ${REMOTE_SCRIPT_LOOPS} loops: ${sleepTime}`)
        ns.print(`Total RAM/threads used: ${totalUsedRam.roundToTwoDecimals()} / ${totalUsedThreads.roundToTwoDecimals()}`)
        //ns.print("dbgarr: " + dbgarr)
        let startSleepTime = totalSleepTime
        let reportMulti = 1 // Increases every PROGRESS_REPORT_PROGRESS
        const PORT_TICK_TIME_MS = 50
        while (totalSleepTime > 0) {
            // Report progress
            // totalSleepTime ticks down, starting from startSleepTime
            //  so progress should be: (C - timeRemaining) / C
            const progress = (startSleepTime - totalSleepTime) / startSleepTime
            if (progress > PROGRESS_REPORT_PROGRESS * reportMulti) {
                const pctStr = (progress * 100).toFixed(0).toString()
                const timeStr = totalSleepTime.toTimeString(false)
                ns.print(`..${".".repeat(reportMulti * 2)}${pctStr}% done (${timeStr} left)`)
                reportMulti += 1
            }

            // Read incoming port data
            for (const port of [1, 2, 3]) {
                const data = ns.readPort(port)
                if (data == "NULL PORT DATA") {
                    continue
                }

                const prevSecurity = ns.getServerSecurityLevel(TARGET)
                const prevCash = ns.getServerMoneyAvailable("home")
                const prevServerMoney = ns.getServerMoneyAvailable(TARGET)

                switch (port) {
                    case 1:
                        {
                            const { hostname, target, stolenCash } = JSON.parse(data)
                            if (stolenCash == 0) break
                            const asCashSpaced = ns.getServerMoneyAvailable(target).toSpacedString()
                            const prevCashSpaced = prevCash.toSpacedString()
                            ns.print(`+Cash hacked: \$ ${stolenCash.toSpacedString()} from ${target} using ${hostname} (\$ ${prevCashSpaced}->\$ ${asCashSpaced})`)
                            totalStolenCash += stolenCash
                            break;
                        }
                    case 2:
                        {
                            const { hostname, target, decreasedSecurity } = JSON.parse(data)
                            const serverSecurity = ns.getServerSecurityLevel(target).roundToTwoDecimals()
                            ns.print(`-Security: ${decreasedSecurity.roundToTwoDecimals()} on ${target} using ${hostname} (${prevSecurity.roundToTwoDecimals()}->${serverSecurity})`)
                            totalDecreasedSecurity += decreasedSecurity
                            break;
                        }
                    case 3:
                        {
                            // Multiplier = [0.0, x.x] so `currMoney = prevMoney * (1 + multiplier)`
                            const { hostname, target, multiplier } = JSON.parse(data)
                            //ns.print(`DEBUG: ${multiplier}`)
                            const serverMoney = ns.getServerMoneyAvailable(target)
                            const asCash = serverMoney * multiplier
                            const asCashSpaced = asCash.toSpacedString()
                            const multiplierRounded = multiplier.roundToTwoDecimals()
                            ns.print(`+Cash grown: \$ ${asCashSpaced}[x${multiplierRounded}] on ${target} (\$ ${prevServerMoney.roundToTwoDecimals()}->\$ ${serverMoney.toSpacedString()}) using ${hostname}`)
                            totalMultiplier += multiplier
                            totalIncreasedCash += asCash
                            break;
                        }
                }
            }
            await ns.sleep(PORT_TICK_TIME_MS)
            totalSleepTime -= PORT_TICK_TIME_MS

            //! END Port read loop
        }
        await ns.sleep(MIN_SLEEP_TIME + totalSleepTime)
        lastTarget = TARGET
        lastTotalStolenCash = totalStolenCash
        lastTotalDecreasedSecurity = totalDecreasedSecurity
        lastTotalMultiplier = totalMultiplier
        lastTotalIncreasedCash = totalIncreasedCash
        lastTotalUsedRam = totalUsedRam
        lastTotalUsedThreads = totalUsedThreads
        lastTotalSleepTime = totalSleepTime

        //! END Script execution loop
    }

    //! END Main loop
}

/** @param {NS} ns **/
function runScriptsOnRemoteToTarget(ns, remote, target, ...args) {
    const moneyThreshold = args.moneyThreshold || 0.6
    const securityThreshold = args.securityThreshold || 0.3
    const loops = args.loops || 1
    const serverMaxMoney = ns.getServerMaxMoney(target)
    const serverCurrMoney = ns.getServerMoneyAvailable(target)
    const serverMinSecurity = ns.getServerMinSecurityLevel(target)
    const serverCurrSecurity = ns.getServerSecurityLevel(target)

    var shouldHack = serverCurrMoney > serverMaxMoney * moneyThreshold
    var shouldWeaken = serverCurrSecurity > serverMinSecurity + (serverMinSecurity * securityThreshold)

    const weakenTime = ns.getWeakenTime(target) * Number(shouldWeaken)
    const growTime = ns.getGrowTime(target) * Number(!shouldHack)
    const hackTime = ns.getHackTime(target) * Number(shouldHack)
    const longestTime = Math.max(weakenTime, growTime, hackTime)
    var longestTotalTime = longestTime * loops

    ns.killall(remote);
    const jobCount = 1 + (shouldWeaken | 0) // bool to num
    const availableRam = (ns.getServerMaxRam(remote) - ns.getServerUsedRam(remote))
    let totalRequiredRamPerThread = 0
    //totalThreads /= ns.getScriptRam(HACK_SCRIPT, "home");
    if (shouldHack) totalRequiredRamPerThread += ns.getScriptRam(HACK_SCRIPT, remote);
    else totalRequiredRamPerThread += ns.getScriptRam(GROW_SCRIPT, remote);
    if (shouldWeaken) totalRequiredRamPerThread += ns.getScriptRam(WEAKEN_SCRIPT, remote);
    const threadsPerScript = availableRam / totalRequiredRamPerThread //s / jobCount
    if (threadsPerScript < 1) {
        return { longestTotalTime, shouldHack, shouldWeaken, totalRequiredRamPerThread, threadsPerScript }
    }
    let opsStr = remote + "->" + target
    // Always hack or grow
    if (shouldHack) {
        ns.exec(HACK_SCRIPT, remote, threadsPerScript, target); opsStr += ": hack";
    }
    else {
        ns.exec(GROW_SCRIPT, remote, threadsPerScript, target); opsStr += ": grow";
    }
    // But sometimes weaken too
    if (shouldWeaken) ns.exec(WEAKEN_SCRIPT, remote, threadsPerScript, target); opsStr + "+weaken";
    //ns.tprint(`${opsStr}: ${totalExecutionTime}ms`)

    return { longestTotalTime, shouldHack, shouldWeaken, totalRequiredRamPerThread, threadsPerScript }
}

/**
* Copies files in file list to all servers and returns an array of all servers
* @param {NS} ns **/
async function findAllServers(ns) {
    const fileList = [HACK_SCRIPT, WEAKEN_SCRIPT, GROW_SCRIPT, SHARE_SCRIPT];   //These files just infinitely hack, weaken, and grow respectively.
    var q = [];
    var serverDiscovered = [];

    q.push("home");
    serverDiscovered["home"] = true;

    while (q.length) {
        let v = q.shift();

        let edges = ns.scan(v);

        for (let i = 0; i < edges.length; i++) {
            if (!serverDiscovered[edges[i]]) {
                serverDiscovered[edges[i]] = true;
                q.push(edges[i]);
                await ns.scp(fileList, edges[i], "home");
            }
        }
    }
    return Object.keys(serverDiscovered);
}

/**
* Finds list of all hackable and all rootable servers. Also finds optimal server to hack.
* A hackable server is one which you can hack, grow, and weaken.
* A rootable server is one which you can nuke.
* Returns a 2d array with list of hackable, rootable, and the optimal server to hack
* @param {NS} ns **/
async function findHackable(ns, allServers) {
    var hackableServers = [];
    var rootableServers = [];
    var numPortsPossible = 0;

    if (ns.fileExists("BruteSSH.exe", "home")) {
        numPortsPossible += 1;
    }
    if (ns.fileExists("FTPCrack.exe", "home")) {
        numPortsPossible += 1;
    }
    if (ns.fileExists("RelaySMTP.exe", "home")) {
        numPortsPossible += 1;
    }
    if (ns.fileExists("HTTPWorm.exe", "home")) {
        numPortsPossible += 1;
    }
    if (ns.fileExists("SQLInject.exe", "home")) {
        numPortsPossible += 1;
    }


    for (let i = 0; i < allServers.length; i++) {
        //if your hacking level is high enough and you can open enough ports, add it to hackable servers list
        if (ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(allServers[i]) && numPortsPossible >= ns.getServerNumPortsRequired(allServers[i])) {
            hackableServers.push(allServers[i]);
        }
        //if it isn't home(this makes sure that you don't kill this script) and you either
        //already have root access(this is useful for servers bought by the player as you have access to those even if the security is higher than you can nuke)
        //  or you can open enough ports
        const portsAllowHacking = numPortsPossible >= ns.getServerNumPortsRequired(allServers[i])
        if (allServers[i] != "home" && (ns.hasRootAccess(allServers[i]) || portsAllowHacking)) {
            rootableServers.push(allServers[i]);
            //if you don't have root access, open ports and nuke it
            if (!ns.hasRootAccess(allServers[i])) {
                if (ns.fileExists("BruteSSH.exe")) {
                    ns.brutessh(allServers[i]);
                }
                if (ns.fileExists("FTPCrack.exe")) {
                    ns.ftpcrack(allServers[i]);
                }
                if (ns.fileExists("RelaySMTP.exe")) {
                    ns.relaysmtp(allServers[i]);
                }
                if (ns.fileExists("HTTPWorm.exe")) {
                    ns.httpworm(allServers[i]);
                }
                if (ns.fileExists("SQLInject.exe")) {
                    ns.sqlinject(allServers[i]);
                }
                ns.nuke(allServers[i]);
            } else {
                // try {
                //     if (await ns.singularity.connect(allServers[i])) {
                //         await ns.singularity.installBackdoor()
                //         await ns.singularity.connect("home")
                //     }

                // } catch (e) {
                //     ns.tprint(e)
                // }
            }
        }
    }

    //finds optimal server to hack
    let optimalServer = await findOptimal(ns, hackableServers);

    return { hackableServers, rootableServers, optimalServer };
}

/**
 * Finds the best server to hack.
 * The algorithm works by assigning a value to each server and returning the max value server.
 * The value is the serverMaxMoney divided by the sum of the server's weaken time, grow time, and hack time.
 * You can easily change this function to choose a server based on whatever optimizing algorithm you want,
 *  just return the server name to hack.
*/
async function findOptimal(ns, hackableServers) {
    let optimalServer = "n00dles";
    let optimalVal = 0;
    let currVal;
    let currTime;

    for (let i = 0; i < hackableServers.length; i++) {
        currVal = ns.getServerMaxMoney(hackableServers[i]);
        currTime = ns.getWeakenTime(hackableServers[i]) + ns.getGrowTime(hackableServers[i]) + ns.getHackTime(hackableServers[i]);
        currVal /= currTime;
        if (currVal >= optimalVal) {
            optimalVal = currVal;
            optimalServer = hackableServers[i];
        }
    }

    return optimalServer;
}

/** @param {NS} ns */
function findAllByPrefix(ns, prefix) {
    const nearby = ns.scan()
    const matching = nearby.filter(s => s.startsWith(prefix))
    return matching
}