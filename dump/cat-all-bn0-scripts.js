

cat-all.js: 
>>>>>>>>>>>> basic_runner.js <<<<<<<<<<<<
export async function main(ns) {
	while(true) {
		await ns.hack(ns.args[0]);
	}
}
<<<<<<<<<< END basic_runner.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> buy-hn.js <<<<<<<<<<<<
// TODO: Buying nodes and maxing those out too

/** @param {NS} ns */
export async function main(ns) {

	//const maxMoneySpentPct = 0.4 // Spend 40% of cash
	const maxMoneySpentPct = 0.95 // Spend 95% of cash
	//const minMoneyAvailable = 1000000000 // keep 1b always
	const minMoneyAvailable = 1000000000000 // keep 1t always
	const playerMoney = ns.getPlayer().money
	const nodeCost = ns.hacknet.getPurchaseNodeCost()

	let totalPrice = 0
	const nodeCount = ns.hacknet.numNodes()
	for (let i = 0; i < nodeCount; i++) {
		const node = ns.hacknet.getNodeStats(i)

		// non-maxed only
		const isMaxLevel = node.level > 199
		const isMaxRam = node.ram > 63
		const isMaxCores = node.cores > 15
		const isMaxed = isMaxLevel && isMaxRam && isMaxCores
		ns.tprint(`maxed ${i}?: ${isMaxed}`)
		if (isMaxed) continue

		const amountLevels = 199// - node.level // buy to max 199
		const amountRamLevels = 6// - node.ram  // buy to max 6
		const amountCoreLevels = 15// - node.cores // buy to max 15
		const levelPrice = ns.hacknet.getLevelUpgradeCost(i, amountLevels)
		const ramPrice = ns.hacknet.getRamUpgradeCost(i, amountRamLevels)
		const corePrice = ns.hacknet.getCoreUpgradeCost(i, amountCoreLevels)
		const price = levelPrice + ramPrice + corePrice
		const accumulatedPrice = totalPrice + price

		const underMaxSpendByPct = accumulatedPrice < playerMoney * maxMoneySpentPct
		const hasMinMoneyAvailable = playerMoney - accumulatedPrice > minMoneyAvailable
		const inBudget = underMaxSpendByPct && hasMinMoneyAvailable
		ns.tprint(`level +${amountLevels}: \$${levelPrice} ram +${amountRamLevels}: \$${ramPrice} cores +${amountCoreLevels}: \$${corePrice}`)
		ns.tprint(`new total: \$${totalPrice} + \$${price} = \$${accumulatedPrice}`)
		ns.tprint(`still in budget for ${i}?: ${inBudget}`)

		// Can't spend no more, stop processing
		if (!inBudget) break

		totalPrice += price
	}

	ns.tprint(`total price: \$${totalPrice}`)
	// TODO: Add upgrade amount
	ns.tprint(`new node: \$${nodeCost}`)

	if (totalPrice == 0) return

	const answer = await ns.prompt(`Buy upgrades for: \$${totalPrice} ?`, { type: "select", choices: ["Yes", "Abort"] })
	if (answer == "Abort" || !answer) {
		ns.tprint("Aborting purchase")
		return
	}
	// TODO: Buy
	ns.tprint(`Bought upgrades for \$${totalPrice} leaving \$${playerMoney - totalPrice}`)

}
<<<<<<<<<< END buy-hn.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> buy_servers.js <<<<<<<<<<<<
/** @param {NS} ns */

// const NAMES = {
// 	2: "pytty",
// 	4: "kattila",
// 	8: "pannu",
// 	16: "kulho",
// 	32: "pata",
// 	64: "sankko",
// 	128: "saavi",
// 	256: "amme",
// 	512: "paatti",
// 	1024: "vene",
// 	2048: "jahti",
// 	4096: "alus",
// 	8192: "karikko",
// 	16384: "huippu",
// 	32768: "jäävuori",
// 	65536: "atolli",
// 	131072: "saari"
// }

const FILTER_AFFORDABLE_CAP = 400
const FILTER_MAX_UNAFFORDABLE = 4
const MIN_SERVER_RAM = 2
const SERVER_NAMES = [
	"pytty",
	"kattila",
	"pannu",
	"kulho",
	"pata",
	"sankko",
	"saavi",
	"amme",
	"paatti",
	"vene",
	"jahti",
	"alus",
	"karikko",
	"huippu",
	"jäävuori",
	"atolli",
	"saari",
	"maa",
	"vuori",
	"vuoresto", // Cant have matching prefix
	"manner",
	"maapallo",
	"maailma",
	"tähti",
	"aurinko",
	"galaksi",
	"nova",
	"supernova",
	"jätti",
	"jättiläinen"
]

/** @param {NS} ns */
export async function main(ns) {
	//if (ns.args.length != 2 || !(ns.args[0] in NAMES)) {
	if (ns.args.length != 2 || SERVER_NAMES.findIndex(val => val == ns.args[0]) == -1) {
		printHelp(ns)
		return
	}
	//const RAM = ns.args[0]
	const PREFIX = ns.args[0]
	const COUNT = ns.args[1]
	const RAM = getRamForPrefix(PREFIX)

	for (let i = 0; i < COUNT; i++) {
		buyServer(ns, RAM, PREFIX)
	}
}
/** @param {NS} ns */
function printHelp(ns) {
	//const usage = "Usage: run buy_servers.js <RAM> <COUNT>"
	const usage = "Usage: run buy_servers.js <PREFIX> <COUNT>"
	//const allowedRams = Object.keys(NAMES)
	const allowedRams = SERVER_NAMES.map(val => getRamForPrefix(val))
	const currentlyOwned = ns.getPurchasedServers()

	var unaffordableCount = 0

	const pricesArr = allowedRams
		.map((val, i) => {
			if (unaffordableCount >= FILTER_MAX_UNAFFORDABLE) return null

			const price = val * 55000
			const affordable = Math.floor(ns.getServerMoneyAvailable("home") / price)


			//const prefix = NAMES[val]
			const prefix = SERVER_NAMES[i]
			const current = currentlyOwned.reduce((accum, host, i) => {
				if (host.includes(prefix)) return accum + 1
				return accum
			}, 0)

			if (affordable > FILTER_AFFORDABLE_CAP && current == 0) return null
			if (affordable == 0) {
				unaffordableCount++
			}

			let ramStr = `${allowedRams[i]}G`
			if (allowedRams[i] > 1000000000) ramStr = `${Math.floor((allowedRams[i] / 1000000000)).toFixed(0)}E`
			else if (allowedRams[i] > 1000000) ramStr = `${Math.floor((allowedRams[i] / 1000000)).toFixed(0)}P`
			else if (allowedRams[i] > 1000) ramStr = `${Math.floor((allowedRams[i] / 1000)).toFixed(0)}T`

			let priceStr = ""
			if (price > 1000000000000) priceStr = `${(price / 1000000000000).toFixed(2)}T`
			else if (price > 1000000000) priceStr = `${(price / 1000000000).toFixed(2)}B`
			else if (price > 1000000) priceStr = `${(price / 1000000).toFixed(2)}M`
			else if (price > 1000) priceStr = `${(price / 1000).toFixed(2)}k`

			return `${ramStr}:\t${priceStr}\t${affordable}\t\t${current}\t${prefix}`
		})
		.filter(val => val != null)

	const pricing = "GB\t$$$\tCan afford\tOwned\tPrefix\n" + pricesArr.join("\n")
	const currentStatus = `${currentlyOwned.length}/${ns.getPurchasedServerLimit()} servers at the moment`
	ns.tprint(`${usage}\n${pricing}\n${currentStatus}`)
}
/** @param {NS} ns */
function buyServer(ns, ram, prefix) {
	//const prefix = NAMES[ram]
	const nextServerIndex = getNextIndex(ns, prefix)
	const hostName = prefix + nextServerIndex
	ns.tprint(`Purchasing ${hostName} (${ram})`)
	const newServer = ns.purchaseServer(hostName, ram)
	if (newServer != "") {
		ns.tprint(`Success: +${newServer}`)
	} else {
		ns.tprint(`**Error purchasing server ${hostName}**`)
		const maxServers = ns.getPurchasedServerLimit()
		const currServerCount = ns.getPurchasedServers().length
		if (currServerCount >= maxServers) ns.tprint(`Err: Max servers ${currServerCount}/${maxServers}`)
	}
}
/** @param {NS} ns */
function getNextIndex(ns, hostPrefix) {
	const hosts = ns.scan()
	const prefixeds = hosts.reduce((prev, host) => {
		const matches = host.match(hostPrefix + ".*") // match unlimited suffix
		if (matches != null) prev.push(...matches)
		return prev
	}, [])
	ns.tprint(prefixeds)

	const numbers = []
	for (const host of prefixeds) {
		numbers.push(parseInt(host.substr(hostPrefix.length)))
	}
	let biggestIndex = 0
	for (const num of numbers) {
		biggestIndex = Math.max(biggestIndex, num)
	}

	ns.tprint("Biggest: " + biggestIndex)

	return biggestIndex + 1
}

function getRamForPrefix(PREFIX) {
	//return SERVER_NAMES.mapMath.pow(MIN_SERVER_RAM, (i + 1))
	return Math.floor(Math.pow(MIN_SERVER_RAM, SERVER_NAMES.indexOf(PREFIX) + 1))
}
<<<<<<<<<< END buy_servers.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> cat-all.js <<<<<<<<<<<<
/** @param {NS} ns */
export async function main(ns) {
	const files = ns.ls("home",".js")
	for (const file of files) {
		const content = ns.read(file)
		ns.tprint(`\n>>>>>>>>>>>> ${file} <<<<<<<<<<<<\n${content}\n<<<<<<<<<< END ${file} >>>>>>>>>>\n`)
	}
}
<<<<<<<<<< END cat-all.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> delete_server.js <<<<<<<<<<<<
/** @param {NS} ns */
export async function main(ns) {
	var servers = ns.args
	if (servers.length == 0) return 1
 
	if (servers.length == 1) {
		servers = findAllByPrefix(ns, servers[0])
	}

	for (const server of servers) {
		ns.tprint(`Deleting ${server}`)
		const wasKilled = ns.killall(server)
		const didDelete = ns.deleteServer(server)
		if (didDelete) ns.tprint(`Deleted ${server}`)
		else {
			ns.tprint(`Error deleting ${server}`)
			if (!wasKilled) {
				ns.tprint(`(No scripts were killed beforehand)`)
			}
		}
	}
}

/** @param {NS} ns */
function findAllByPrefix(ns, prefix) {
	const nearby = ns.scan()
	const matching = nearby.filter(s => s.startsWith(prefix))
	return matching
}
<<<<<<<<<< END delete_server.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> form.js <<<<<<<<<<<<
/** @param {NS} ns */
export async function main(ns) {

}
<<<<<<<<<< END form.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> g1.js <<<<<<<<<<<<
/** @param {NS} ns **/
export async function main(ns) {
    while(true){
        await ns.grow(ns.args[0]);
    }
}
<<<<<<<<<< END g1.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> g2.js <<<<<<<<<<<<
/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0]
    while(true){
        const multiplier = await ns.grow(target);
        const hostname = ns.getHostname()
        const data = {
            hostname, target, multiplier
        }
		// Log to home
		await ns.writePort(3, JSON.stringify(data))
    }
}
<<<<<<<<<< END g2.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> h1.js <<<<<<<<<<<<
/** @param {NS} ns **/
export async function main(ns) {
    while(true){
        await ns.hack(ns.args[0]);
    }
}
<<<<<<<<<< END h1.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> h2.js <<<<<<<<<<<<
/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0]
    while (true) {
        const stolenCash = await ns.hack(target);
        const hostname = ns.getHostname()
        const data = {
            hostname, target, stolenCash
        }
        // Log to home
        await ns.writePort(1, JSON.stringify(data))
    }
}
<<<<<<<<<< END h2.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> hack-manager-v2.js <<<<<<<<<<<<
/**
 * Finds the optimal server to hack and hacks it from all possible servers except home.
 * Only run from home server
 * @param {NS} ns **/
export async function main(ns) {
    let FORCED_HACK_COUNT = 0
    if (ns.args[0]) FORCED_HACK_COUNT = parseInt(ns.args[0])
    while (true) {
        var allServers = await findAllServers(ns);  // finds all servers and clones grow hack and weaken files
        var multiarray = await findHackable(ns, allServers);    // finds and nukes optimal, hackable, and rootale servers.
        var hackableServers = multiarray[0];
        var rootableServers = multiarray[1];
        var optimalServer = multiarray[2];

        ns.tprint('[STARTED] @ ' + optimalServer);
        var target = optimalServer;
        var moneyThresh = ns.getServerMaxMoney(target) * 0.9;   //change thresholds to whatever values you prefer
        var securityThresh = ns.getServerMinSecurityLevel(target) + 3;
        let numThreads = 1;
        var numTimesToHack = 0.05;

        //Number of times the code weakens/grows/hacks in a row once it decides on which one to do.
        //Change to the value you prefer.
        //Higher number means longer time without updating list of all servers and optimal server, but also less time lost in buffer time in between cycles.
        //I would recommend having it at 1 at the start of the run and gradually increasing it as the rate at which you get more servers you can use decreases.
        //Don't increase it too far tho, as weaken/hack/grow times also tend to increase throughout a run.
        numTimesToHack += 2;

        //weakens/grows/hacks the optimal server from all rootable servers except home
        const weakeners = []
        const growers = []
        const hackers = []
        const forcedHackers = rootableServers.splice(0, FORCED_HACK_COUNT)
        for (const h of forcedHackers) {
            ns.tprint(`Forcing hack on ${h}`)
            await startHacking(ns, h, target)
            hackers.push(h)
        }
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            ns.tprint("weakening")
            for (let i = 0; i < rootableServers.length; i++) {
                ns.killall(rootableServers[i]);
                numThreads = (ns.getServerMaxRam(rootableServers[i]) - ns.getServerUsedRam(rootableServers[i])) //free ram
                numThreads /= ns.getScriptRam("w1.js", "home");
                numThreads = Math.floor(numThreads);
                if (numThreads > 0) {
                    ns.exec("w1.js", rootableServers[i], numThreads, target);
                    weakeners.push(rootableServers[i])
                }
            }
            await ns.sleep(numTimesToHack * ns.getWeakenTime(target) + 300);
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
            ns.tprint("growing")
            for (let i = 0; i < rootableServers.length; i++) {
                ns.killall(rootableServers[i]);
                numThreads = (ns.getServerMaxRam(rootableServers[i]) - ns.getServerUsedRam(rootableServers[i]))
                numThreads /= ns.getScriptRam("g1.js", "home");
                if (numThreads > 0) {
                    ns.exec("g1.js", rootableServers[i], numThreads, target);
                    growers.push(rootableServers[i])
                }
            }
            await ns.sleep(numTimesToHack * ns.getGrowTime(target) + 300);
        } else {
            ns.tprint("hacking")
            for (let i = 0; i < rootableServers.length; i++) {
                startHacking(rootableServers[i], target)
                hackers.push(rootableServers[i])
            }
            await ns.sleep(numTimesToHack * ns.getHackTime(target) + 300);
        }
        ns.tprint(weakeners)
        ns.tprint(growers)
        ns.tprint(hackers)
    }

}

async function startHacking(ns, remote, hackTarget) {
    let numThreads = 1
    ns.killall(remote);
    numThreads = (ns.getServerMaxRam(remote) - ns.getServerUsedRam(remote))
    numThreads /= ns.getScriptRam("h1.js", "home");
    if (numThreads > 0) {
        ns.exec("h1.js", remote, numThreads, hackTarget);
    }
}

/**
* Copies files in file list to all servers and returns an array of all servers
*/
async function findAllServers(ns) {
    const fileList = ["h1.js", "w1.js", "g1.js"];   //These files just infinitely hack, weaken, and grow respectively.
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
                await ns.scp(fileList, "home", edges[i]);
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
*/
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
        if (allServers[i] != "home" && (ns.hasRootAccess(allServers[i]) || (numPortsPossible >= ns.getServerNumPortsRequired(allServers[i])))) {
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
            }
        }
    }

    //finds optimal server to hack
    let optimalServer = await findOptimal(ns, hackableServers);

    return [hackableServers, rootableServers, optimalServer];
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
<<<<<<<<<< END hack-manager-v2.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> hack-manager.js <<<<<<<<<<<<
/**
 * Finds the optimal server to hack and hacks it from all possible servers except home.
 * Only run from home server
 * @param {NS} ns **/
export async function main(ns) {
    while (true) {
        var allServers = await findAllServers(ns);  // finds all servers and clones grow hack and weaken files
        var multiarray = await findHackable(ns, allServers);    // finds and nukes optimal, hackable, and rootale servers.
        var hackableServers = multiarray[0];
        var rootableServers = multiarray[1];
        var optimalServer = multiarray[2];

        ns.tprint('[STARTED] @ ' + optimalServer);
        var target = optimalServer;
        var moneyThresh = ns.getServerMaxMoney(target) * 0.9;   //change thresholds to whatever values you prefer
        var securityThresh = ns.getServerMinSecurityLevel(target) + 3;
        let numThreads = 1;
        var numTimesToHack = 0.05;

        //Number of times the code weakens/grows/hacks in a row once it decides on which one to do.
        //Change to the value you prefer.
        //Higher number means longer time without updating list of all servers and optimal server, but also less time lost in buffer time in between cycles.
        //I would recommend having it at 1 at the start of the run and gradually increasing it as the rate at which you get more servers you can use decreases.
        //Don't increase it too far tho, as weaken/hack/grow times also tend to increase throughout a run.
        numTimesToHack += 2;

        //weakens/grows/hacks the optimal server from all rootable servers except home
        const weakeners = []
        const growers = []
        const hackers = []
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            ns.tprint("weakening")
            for (let i = 0; i < rootableServers.length; i++) {
                ns.killall(rootableServers[i]);
                numThreads = (ns.getServerMaxRam(rootableServers[i]) - ns.getServerUsedRam(rootableServers[i])) //free ram
                numThreads /= ns.getScriptRam("w1.js", "home");
                numThreads = Math.floor(numThreads);
                if (numThreads > 0) {
                    ns.exec("w1.js", rootableServers[i], numThreads, target);
                    weakeners.push(rootableServers[i])
                }
            }
            await ns.sleep(numTimesToHack * ns.getWeakenTime(target) + 300);
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
            ns.tprint("growing")
            for (let i = 0; i < rootableServers.length; i++) {
                ns.killall(rootableServers[i]);
                numThreads = (ns.getServerMaxRam(rootableServers[i]) - ns.getServerUsedRam(rootableServers[i]))
                numThreads /= ns.getScriptRam("g1.js", "home");
                if (numThreads > 0) {
                    ns.exec("g1.js", rootableServers[i], numThreads, target);
                    growers.push(rootableServers[i])
                }
            }
            await ns.sleep(numTimesToHack * ns.getGrowTime(target) + 300);
        } else {
            ns.tprint("hacking")
            for (let i = 0; i < rootableServers.length; i++) {
                ns.killall(rootableServers[i]);
                numThreads = (ns.getServerMaxRam(rootableServers[i]) - ns.getServerUsedRam(rootableServers[i]))
                numThreads /= ns.getScriptRam("h1.js", "home");
                if (numThreads > 0) {
                    ns.exec("h1.js", rootableServers[i], numThreads, target);
                    hackers.push(rootableServers[i])
                }
            }
            await ns.sleep(numTimesToHack * ns.getHackTime(target) + 300);
        }
        ns.print(weakeners)
        ns.print(growers)
        ns.print(hackers)
    }

}

/**
* Copies files in file list to all servers and returns an array of all servers
*/
async function findAllServers(ns) {
    const fileList = ["h1.js", "w1.js", "g1.js"];   //These files just infinitely hack, weaken, and grow respectively.
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
                await ns.scp(fileList, "home", edges[i]);
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
*/
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
        if (allServers[i] != "home" && (ns.hasRootAccess(allServers[i]) || (numPortsPossible >= ns.getServerNumPortsRequired(allServers[i])))) {
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
            }
        }
    }

    //finds optimal server to hack
    let optimalServer = await findOptimal(ns, hackableServers);

    return [hackableServers, rootableServers, optimalServer];
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
<<<<<<<<<< END hack-manager.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> hm.js <<<<<<<<<<<<
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
<<<<<<<<<< END hm.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> home-hacker.js <<<<<<<<<<<<
/** @param {NS} ns */
export async function main(ns) {
	const SCRIPT_NAME = ns.args[0]
	const servers = ns.scan()
	const MAX_TARGETS = ns.args[1] || servers.length
	servers.splice(MAX_TARGETS, servers.length - MAX_TARGETS)
	const unhackable = ns.getPurchasedServers()
	unhackable.push("darkweb")
	unhackable.push(...servers.filter(h => !ns.hasRootAccess(h)))
	const hackable = servers.filter(s => unhackable.indexOf(s) < 0)
	ns.tprint(`Starting hacks on home to: ${hackable}`)
	// kill first to get accurate thread count
	for (const s of hackable) {
		ns.kill(SCRIPT_NAME, "home", s);
	}
	let numThreads = 1
    numThreads = (ns.getServerMaxRam("home") - ns.getServerUsedRam("home"))
    numThreads /= ns.getScriptRam(SCRIPT_NAME, "home");
	const numHackable = hackable.length
	let threads = Math.floor(numThreads / numHackable)
	for (const s of hackable) {
		await startHacking(ns, SCRIPT_NAME, "home", s, threads)
	}
}
/** @param {NS} ns */
async function startHacking(ns, script, remote, hackTarget, threads) {
    if (threads > 0) {    	
        ns.exec(script, remote, threads, hackTarget)
    } else {
		ns.tprint(`Err: Out of threads for hacking ${hackTarget}`)
	}
}
<<<<<<<<<< END home-hacker.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> master.js <<<<<<<<<<<<
// GLOBALS
var hostArray = [];
var attackedHosts = [];
var taintedHosts = [];
var taintTimer = Date.now();
var workersAvailable = false;
var silences = ["getServerMaxMoney", "getHackingLevel", "scan", "getServerRequiredHackingLevel", "sleep", "getServerNumPortsRequired", "getServerMoneyAvailable", "purchaseServer"];
 
// CONFIG
var taintPort = 1; // port to use for taint communication
var taintInterval = 1000 * 60 * 30; // reset taints after 30 minutes
var ram = 1024; // capacity of initial purchased servers
var serverNameTemplate = "nillabotV"; // template to name your purchased servers
 
export async function main(ns) {
    for (var silence of silences) {
        ns.disableLog(silence);
    }
 
    while (true) {
 
        // check for online workers and never go in here again after we found/bough some
        if(!workersAvailable){
            if(ns.getPurchasedServers().length > 0){
                workersAvailable = true;
                ns.print("Workers online. Proceeding with money making baby.")
            } else {
                await hatchBabies(ns);
                continue;
            }
        }
 
        var workerNodes = findEmptyWorkers(ns);
        reevaluateAttacks(ns);
       
 
        for (var worker of workerNodes) {
            checkTaints(ns);
            var target = await findTarget(ns);
           
            //In case we didn't find a suitable target wait a second and continue with the next worker
            if(target == "") {
                await ns.sleep(1000);
                ns.print("No suitable target found...")
                continue;
            }
            ns.run("worker.js", 1, worker, target);
            attackedHosts.push(target);
        }
        await ns.sleep(1000);
    }
}
 
// find and return best target
async function findTarget(ns) {
    let target = "";
   
    //TODO include hackchance in calculation maybe?
    var rootedServers = await searchAndDestroy(ns);
    var usableServers = findUsableServers(ns, rootedServers);
    usableServers = sortByMaxMoney(ns, usableServers);
    for (var server of usableServers) {
        if (attackedHosts.includes(server) || taintedHosts.includes(server)) {
            continue;
        } else {
            target = server;
            break;
        }
    }
    return target;
}
 
// get all server and root them if possible, array of rooted servers
async function searchAndDestroy(ns) {
    hostArray = [];
    var allServers = await searchForHosts(ns, "home", "");
    var rootedServers = [];
    var attackLevel = 0;
 
    if (ns.fileExists("BruteSSH.exe", "home")) {
        attackLevel += 1;
    }
    if (ns.fileExists("FTPCrack.exe", "home")) {
        attackLevel += 1;
    }
    if (ns.fileExists("RelaySMTP.exe", "home")) {
        attackLevel += 1;
    }
    if (ns.fileExists("HTTPWorm.exe", "home")) {
        attackLevel += 1;
    }
    if (ns.fileExists("SQLInject.exe", "home")) {
        attackLevel += 1;
    }
 
    for (var server of allServers) {
        if (ns.hasRootAccess(server)) {
            rootedServers.push(server);
        } else if (ns.getServerNumPortsRequired(server) <= attackLevel) {
            if (ns.fileExists("BruteSSH.exe", "home")) {
                ns.brutessh(server);
            }
            if (ns.fileExists("FTPCrack.exe", "home")) {
                ns.ftpcrack(server);
            }
            if (ns.fileExists("HTTPWorm.exe", "home")) {
                ns.httpworm(server);
            }
            if (ns.fileExists("SQLInject.exe", "home")) {
                ns.sqlinject(server);
            }
            if (ns.fileExists("relaySMTP.exe", "home")) {
                ns.relaysmtp(server);
            }
            ns.nuke(server);
            if (ns.hasRootAccess(server)) {
                rootedServers.push(server);
            }
        }
    }
    return rootedServers;
}
 
// search all hosts and return an array with them
async function searchForHosts(ns, currentNode, prevNode) {
    var nodes = ns.scan(currentNode);
    var pattern = serverNameTemplate + ".*";
    var regex = new RegExp(pattern, "g");
 
    //remove previousNode from Nodes to scan as not to have an infinite loop
    var index = nodes.indexOf(prevNode);
    if (index > -1) {
        nodes.splice(index, 1);
    }
 
    if (nodes.length > 0) {
        nodes = nodes.filter(node => !regex.test(node));
        for (var node of nodes) {
            hostArray.push(node);
            await searchForHosts(ns, node, currentNode);
        }
    }
    return hostArray;
}
 
 
// take array of servers and filter for those we can hack and which hold money, then return it
function findUsableServers(ns, servers) {
 
    //TODO: filter out servers without money (or above a certain treshold) and no possibillity to grow to make the sort later more efficient
    var usableServers = [];
    for (var server of servers) {
        if (ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel() && ns.getServerMaxMoney(server) > 0) {
            usableServers.push(server);
        }
    }
    return usableServers;
}
 
// take array of servers and return sorted for max money (big to small)
function sortByMaxMoney(ns, servers) {
    var serversJson = [];
    var sortedServers = [];
    for (var server of servers) {
        serversJson.push({ "host": server, "maxMoney": ns.getServerMaxMoney(server) });
    }
    serversJson.sort(function (a, b) {
        return b.maxMoney - a.maxMoney;
    });
 
    for (var i = 0; serversJson.length > i; i++) {
        sortedServers[i] = serversJson[i].host;
    }
 
    return sortedServers;
}
 
 
// check all running scripts on the machine and get their targets
function reevaluateAttacks(ns) {
    var portEmpty = false;
    var message = "";
    attackedHosts = [];
    var scripts = ns.ps("home");
    for (var script of scripts) {
        if(script.filename === "worker.js") {
            attackedHosts.push(script.args[1]);
        }
    }
    while (!portEmpty) {
        message = ns.readPort(taintPort);
        if(message != "NULL PORT DATA") {
            taintedHosts.push(message);
            ns.print("Tainted " + message + "...");
        } else {
            portEmpty = true;
            break;
        }
    }
}
 
// reset all taints if configured time has lapsed
function checkTaints(ns) {
    if ((Date.now() - taintTimer) > taintInterval)
    {
        taintedHosts = [];
        taintTimer = Date.now();
        ns.print("Resetting taints...");
    }
}
 
// find all workers that aren't currently attacking anyone and return them
function findEmptyWorkers(ns) {
    //populate emptyWorkers with all workers and then filter out these with running scripts
    var allWorkers = ns.getPurchasedServers();
    var busyWorkers = [];
    var emptyWorkers = [];
 
 
    var scripts = ns.ps("home");
    for (var script of scripts) {
        if(script.filename === "worker.js") {
            busyWorkers.push(script.args[0]);
        }
    }
    emptyWorkers = allWorkers.filter(worker => !busyWorkers.includes(worker));
    //ns.print("emptyWorkers: " + emptyWorkers + "\nbusyWorkers: "+ busyWorkers);
 
    //TODO: check for running scripts on worker as well
 
    return emptyWorkers;
}
 
// initially buy servers if enough money available, else root all possible servers at least
async function hatchBabies(ns) {
    var upgradeCost = ns.getPurchasedServerLimit() * ns.getPurchasedServerCost(ram);
 
    if (upgradeCost < ns.getServerMoneyAvailable("home") / 2) {
        ns.tprint("Buying babies first workernodes ♥(。U ω U。)");
        for (var i = 0; i < ns.getPurchasedServerLimit(); i++) {
            ns.purchaseServer(serverNameTemplate + ram, ram);
        }
        workersAvailable = true;
    } else {
        ns.print("No workers yet, rooting and tooting some servers instead...");
        await searchAndDestroy(ns);
        await ns.sleep(10 * 1000);
    }
}
<<<<<<<<<< END master.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> on.js <<<<<<<<<<<<
// TODO: Read from config
//const KILL_RUNNING_HACKS_ON_BOOT = true
const KILL_ALL_ON_BOOT = true
//const HACK_TARGETS = ["iron-gym", "omega-net", "computek", "rho-construction", "joesguns", "megacorp"]
const HACK_TARGETS = ["iron-gym", "omega-net", "computek", "rho-construction", "joesguns"]
const TICK_RATE_MS = 5000 // Update every ms
const SURPLUS_HOME_HACKER_THREADS = 100 // Leave this many for random scripts to be ran

const WM = "WM"
const HM = "HM"
const HOME_HACKER = "HOME_HACKER"

const SCRIPTS = {
	"WM": { path: "wm.js", threads: 1, workers: 1, arguments: [], tail: false },
	"HM": { path: "hm.js", threads: 1, workers: 1, arguments: [25, "vuoresto"], tail: true },
	"HOME_HACKER": { path: "123.js", threads: 0, workers: HACK_TARGETS.length/*6*/, arguments: [], tail: true },
}

/** @param {NS} ns */
export async function main(ns) {
	//if (KILL_RUNNING_HACKS_ON_BOOT) {
	//	for (let i = 0; i < SCRIPTS.HOME_HACKER.workers; i++) { 
	//		(SCRIPTS.HOME_HACKER.path, "home", SCRIPTS.HOME_HACKER.arguments)
	//	}
	//}
	if (KILL_ALL_ON_BOOT) {
		const running = ns.ps("home")
		for (const script of running) {
			ns.closeTail(script.pid)
		}
		ns.killall()
	}
	while (true) {
		let availableHackingThreads = getMaxThreadsForScript(ns, SCRIPTS.HOME_HACKER)
		SCRIPTS.HOME_HACKER.threads = Math.floor(availableHackingThreads / SCRIPTS.HOME_HACKER.workers)
		//SCRIPTS.HOME_HACKER.arguments = SCRIPTS.HOME_HACKER.arguments.splice(0)
		let nextHackTargetIndex = 0
		for (const [script, obj] of Object.entries(SCRIPTS)) {
			for (let i = 0; i < obj.workers; i++) {
				//ns.tprint(script)
				switch (script) {
					case WM:
						break
					case HM:
						break
					case HOME_HACKER:
						const beforeArgs = obj.arguments
						obj.arguments = [/*obj.threads, */HACK_TARGETS[nextHackTargetIndex]]
						//ns.tprint(`arguments from ${beforeArgs} to ${obj.arguments}`)
						nextHackTargetIndex += 1
						if (nextHackTargetIndex >= HACK_TARGETS.length + 1) continue
						break
					default:
						break
				}
				if (!ns.isRunning(obj.path, "home", ...obj.arguments)) {
					//ns.tprint(`running ${script}: path=${obj.path} threads=${obj.threads} workers=${obj.workers} arguments=${obj.arguments}`)
					//ns.tprint(`nextHackTargetIndex=${nextHackTargetIndex}`)
					ns.exec(obj.path, "home", obj.threads, ...obj.arguments)
					ns.tprint(`Started ${obj.path} on home with args ${obj.arguments} and threads ${obj.threads}`)
					if (obj.tail) ns.tail(obj.path, "home", ...obj.arguments)
				}
			}
		}
		await ns.sleep(TICK_RATE_MS)
	}
}

/** @param {NS} ns */
function getMaxThreadsForScript(ns, script) {
	const scriptRam = ns.getScriptRam(script.path)
	const reservedRam = scriptRam * SURPLUS_HOME_HACKER_THREADS

	const remainingRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home")

	const usableRam = remainingRam - reservedRam

	const threads = Math.floor(usableRam / scriptRam)

	return threads
}
<<<<<<<<<< END on.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> s1.js <<<<<<<<<<<<
/** @param {NS} ns */
export async function main(ns) {
	while (true) {
		await ns.share()
	}
}
<<<<<<<<<< END s1.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> s2.js <<<<<<<<<<<<
/** @param {NS} ns **/
export async function main(ns) {
	//const target = ns.args[0]
	while (true) {
		await ns.share()
		//const sharePower = ns.getSharePower()
		const hostname = ns.getHostname()
		const data = {
			hostname//, target//, sharePower
		}
		// Log to home
		await ns.writePort(4, JSON.stringify(data))
	}
}
<<<<<<<<<< END s2.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> skynet.js <<<<<<<<<<<<
/** @param {NS} ns */
export async function main(ns) {
	const hosts = getHostsRecursive(ns, "home", [])
	ns.tprint(hosts)
}

/** @param {NS} ns */
function getHostsRecursive(ns, host, hosts) {
	ns.tprint(`Scanning nearby hosts of ${host}`)
	const nearby = ns.scan(host).filter((n) => { ns.tprint(n); return n != "home" })
	if (nearby.length == 0) {
		ns.tprint(`Reached last jump: ${host}`)
		return hosts
	}
	ns.tprint(`Found ${nearby}`)
	hosts.push(nearby)
	for (let i = 0; i < nearby.length; i++) {
		const nearbyHost = nearby[i]
		getHostsRecursive(ns, nearbyHost, hosts)
	}
}
<<<<<<<<<< END skynet.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> testthread.js <<<<<<<<<<<<
/** @param {NS} ns */
export async function main(ns) {
	const TARGET = "sigma-cosmetics"
	const WORKER_COUNT = 10
	const CHECK_PERIOD = 100 // ms
	const LOOP_PERIOD = 1000 // ms
	const funcs = []
	for (let i; i < WORKER_COUNT; i++) {
		funcs[i] = { "func": async (ns) => { print(`Hacking ${i}...`); await ns.hack(TARGET); print(`Hacked ${i}`) }, "done": false }
	}

	while (true) {
		for (func in funcs) {
			func.done = false
			print("Starting func")
			func.func()
				.then(() => {
					func.done = true
					print("Func done")
				}) // <- async
		}

		let allDone = false
		while (!allDone) {
			allDone = true			
			for (func in funcs) {
				if (!func.done) allDone = false
			}
			await ns.sleep(CHECK_PERIOD)
		}
		
		await ns.sleep(LOOP_PERIOD)
	}
}
<<<<<<<<<< END testthread.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> w1.js <<<<<<<<<<<<
/** @param {NS} ns **/
export async function main(ns) {
    while(true){
        await ns.weaken(ns.args[0]);
    }
}
<<<<<<<<<< END w1.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> w2.js <<<<<<<<<<<<
/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0]
    while(true){
        const decreasedSecurity = await ns.weaken(target);
        const hostname = ns.getHostname()
        const data = {
            hostname, target, decreasedSecurity
        }
		// Log to home
		await ns.writePort(2, JSON.stringify(data))
    }
}
<<<<<<<<<< END w2.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> wm.js <<<<<<<<<<<<
const BOX_TOP_MARGIN = 5 // px
//const HM_HEIGHT = 300 // px
const SECONDARY_HEIGHT = 150 // px
//const LOCK_SECONDARY_WIDTH_TO_HM = true
const TICK_RATE_MS = 50

const MINIMIZED = "🗖"
const MAXIMIZED = "🗕"

const ANCHOR_SCRIPT = "hm.js" // Must contain this text in titlebar
const GRID_COLS = 3
const _TITLEBAR_HEIGHT = 33 // px
const DEBUG_SHOW_ROW_COL_IN_TITLE = true

// Unlimited rows
// Spaces evenly inside grid
class Grid {
	constructor(ns, width, cols, hmBox, boxes) {
		this.ns = ns
		this.width = width
		this.cols = cols
		this.cellWidth = width / cols
		this.cellHeight = SECONDARY_HEIGHT

		this.hmBox = hmBox
		this.hmTransformX = 0
		this.hmTransformY = 0
		this.hmWidth = 100
		this.hmHeight = 100
		this.hmLeftX = this.hmTransformX
		this.hmBottomY = this.hmTransformY + this.hmHeight

		this.boxes = boxes
		this.lastCellNum = 1

		this.debugElementsAdded = Array(64).fill(Array(64).fill(false)) // Arbitrary size because lazy
	}

	update(ns) {
		if (!this.hmBox) return
		this.updateHmData()
		this.width = this.hmWidth

		this.cellWidth = this.width / this.cols

		const cols = Math.max(this.cols, 1)
		const numBoxes = Object.keys(this.boxes).length
		const rows = Math.max(Math.ceil(numBoxes / this.cols), 1)
		this.lastCellNum = 1
		//this.ns.tprint(`grid loop vals: ${rows}, ${cols}, ${numBoxes}`)

		// Top to bottom, left to right
		let lastCol = 0
		for (let col = 0; col < cols; col++) {
			let lastRow = 0
			for (let row = 0; row < rows; row++) {
				const box = this.boxes[this.lastCellNum.toString()] || null
				// If box was null, the previous one must have been the last one of the row
				if (box == null) break

				box.row = row
				box.col = col

				if (DEBUG_SHOW_ROW_COL_IN_TITLE && !this.debugElementsAdded[row][col]) {
					// <button class="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root jss142 css-10lkun8" tabindex="0" type="button">Kill<span class="MuiTouchRipple-root css-w0pj6f"></span>
					//const customButtonEl = `<div class="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root css-10lkun8">${box.row},${box.col}<span class="MuiTouchRipple-root css-w0pj6f"></span></div>`
					//box.titleBar.innerHTML = customButtonEl + box.titleBar.innerHTML
					box.titleBar.innerText = box.row + "," + box.col + " | " + box.titleBar.innerText
					this.debugElementsAdded[box.row][box.col] = true
					//box.titleBar.innerText = `${box.row},${box.col} | ${box.titleBar.innerText}`
					//ns.tprint(box.titleBar.innerHTML)
					}

				// // If top row, check for HM (main driving force above) instead
				// const above = this.boxes[(this.lastCellNum - 1).toString()] || null

				// // If above box is minimized, account with offset
				// let minimizedOffset = 0
				// if (col == lastCol && above != null) {
				// 	const { transformX, transformY, width, height } = getBoxValues(above)
				// 	minimizedOffset = above.isMinimized ? height - _TITLEBAR_HEIGHT : 0
				// }
				// // If HM (main driving force above) is minimized, account with offset
				// const { transformX, transformY, width, height } = getBoxValues(this.hmBox)
				// minimizedOffset += this.hmBox.isMinimized ? height - _TITLEBAR_HEIGHT : 0

				// If above boxes are minimized, account with sum offset
				const minimizedOffset = this.calculateMinimizedOffset(ns, row, col)

				const x = this.hmLeftX + this.cellWidth * col
				const y = this.hmBottomY + this.cellHeight * row + BOX_TOP_MARGIN - minimizedOffset
				translateEl(box.draggable, x, y)
				resizeEl(box.resizable, this.cellWidth, this.cellHeight)

				this.lastCellNum += 1
				lastRow = row
				lastCol = col
				//this.ns.tprint(`grid el vals: ${x}, ${y}, ${this.cellWidth}, ${this.cellHeight}`)
			}
		}

	}

	calculateMinimizedOffset(ns, row, col) {
		// 0,1,2,3,4,5
		// 0,
		// 1,2,3
		// 4,5,6
		// 7,8,9
		const aboveBoxes = {}

		//const ids = Object.keys(this.boxes)
		// Start from previous box to given box, going down towards first boxes
		for (let i = row + 1 + col + 1 - 1; i > 0; i--) {
			const isAbove = i - this.cols > 0
			const above = this.boxes[i] || null
			if (isAbove && above != null) {
				// Was not HM and still in bounds
				aboveBoxes[i.toString()] = above
			}
			//ns.tprint(`i: ${i} (row ${above.row} col ${above.col}) | Title: ${above.title} | Is above: ${isAbove}`)
		}

		let minimizedOffset = 0
		for (const [id, above] of (Object.entries(aboveBoxes))) {
			const { transformX, transformY, width, height } = getBoxValues(above)
			minimizedOffset += above.isMinimized ? height - _TITLEBAR_HEIGHT : 0
		}

		// If HM (main driving force above) is minimized, account for that too
		const { transformX, transformY, width, height } = getBoxValues(this.hmBox)
		minimizedOffset += this.hmBox.isMinimized ? height - _TITLEBAR_HEIGHT : 0

		const ids = Object.keys(aboveBoxes)
		//ns.tprint(`Ids: ${ids} | Total offset: ${minimizedOffset}`)

		return minimizedOffset
	}

	// The main driving force for "master resizing"
	updateHmData() {
		const { transformX, transformY, width, height } = getBoxValues(this.hmBox)

		//this.ns.tprint(`hm vals: ${transformX}, ${transformY}, ${width}, ${height}`)

		this.hmTransformX = parseInt(transformX)
		this.hmTransformY = parseInt(transformY)
		this.hmWidth = parseInt(width)
		this.hmHeight = parseInt(height)
		this.hmLeftX = this.hmTransformX
		this.hmBottomY = this.hmTransformY + this.hmHeight
	}

	// Next translation position for the next box to position in the grid
	getNextAnchor(aboveMinimized, aboveHeight) {
		const col = Math.floor(this.lastCellNum / this.cols)
		const row = Math.floor(col / this.lastCellNum) // Maybe?

		const startX = this.hmLeftX
		const startY = this.hmBottomY + BOX_TOP_MARGIN

		let minimizedOffset = 0
		if (aboveMinimized) minimizedOffset = aboveHeight

		const posXOffset = this.cellWidth * col
		const posYOffset = this.cellHeight * row - minimizedOffset

		const x = startX + posXOffset
		const y = startY + posYOffset

		//this.ns.tprint(x, " ", y, " ", startX, " ", startY, " ", posXOffset, " ", posYOffset, " ", col, " ", row, " ", this.lastCellNum)

		return { x, y }
	}
}

function getBoxValues(box) {
	const trans = box.draggable.style.getPropertyValue("transform")
	const transPxs = trans.substring(10, trans.length - 1) // no 'transform(' or ');'
	const transNumsPxs = transPxs.split(", ") // "12px, 345px" -> [12px, 345px]
	const transX = transNumsPxs[0].substring(0, transNumsPxs[0].length - 2) // no 'px'
	const transY = transNumsPxs[1].substring(0, transNumsPxs[1].length - 2) // no 'px'

	const heightPxs = box.resizable.style.getPropertyValue("height")
	const height = heightPxs.substring(0, heightPxs.length - 2) // no 'px'
	const widthPxs = box.resizable.style.getPropertyValue("width")
	const width = widthPxs.substring(0, widthPxs.length - 2) // no 'px'

	return {
		transformX: parseInt(transX),
		transformY: parseInt(transY),
		width: parseInt(width),
		height: parseInt(height)
	}
}

function translateEl(el, x, y) {
	el.style.transform = `translate(${x}px,${y}px)`
}

function resizeEl(el, width, height) {
	el.style.width = `${width}px`
	el.style.height = `${height}px`
}

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep")
	const grid = new Grid(ns, 150, GRID_COLS, null, {})
	while (true) {

		// Get all tails
		//ns.tprint(document.innerHTML)
		const boxes = getBoxes(ns)

		// Re-set boxes in grid
		grid.hmBox = boxes["0"]
		for (const [k, v] of Object.entries(boxes)) {
			if (k == "0") continue
			grid.boxes[k] = v
		}

		// Update grid
		grid.update(ns)

		// Wait for next update cycle
		await ns.sleep(TICK_RATE_MS)
	}
}

/** @param {NS} ns */
function getBoxes(ns) {
	let scriptTitle = ""
	let scriptBoxes = {}
	let nextId = 1

	//ns.tprint(document.innerHTML)

	document.querySelectorAll("h6")
		.forEach((v, k, parent) => {
			scriptTitle = v.innerHTML

			const resizable = v.parentElement.parentElement
			if (resizable == null) return
			if (resizable.className.indexOf("react-resizable") == -1) {
				// not script box
				return
			}

			const titleBar = resizable.querySelector("span")
			const minimizeButton = titleBar.querySelectorAll("button")[1] // Always second (run minimize close)
			const isMinimized = minimizeButton.innerText != MAXIMIZED

			const draggable = resizable.parentElement
			if (draggable == null) return
			if (draggable.className.indexOf("react-draggable") == -1) {
				// not draggable box
				return
			}
			if (scriptTitle.indexOf(ANCHOR_SCRIPT) != -1) {
				// was hm.js
				scriptBoxes["0"] = {
					title: scriptTitle,
					//titleBar: titleBar,
					resizable: resizable,
					draggable: draggable,
					titleBar: v,
					isMinimized: isMinimized,
					row: null,
					col: null,
				}
			} else {
				// was some other script
				scriptBoxes[nextId++] = {
					title: scriptTitle,
					//titleBar: titleBar,
					resizable: resizable,
					draggable: draggable,
					titleBar: v,
					isMinimized: isMinimized,
					row: null,
					col: null,
				}
			}
		}
		)

	//let dbgBoxes = ""
	//for (const [id, box] of Object.entries(scriptBoxes)) {
	//	dbgBoxes += `${id}: ${box.title}`
	//}
	//ns.tprint(`Found boxes ${dbgBoxes}`)

	this.debugElementsAdded = Array(64).fill(Array(64).fill(false)) // Arbitrary size because lazy

	return scriptBoxes
}
<<<<<<<<<< END wm.js >>>>>>>>>>

cat-all.js: 
>>>>>>>>>>>> worker.js <<<<<<<<<<<<
// GLOBALS
var workerRam = "";
var wRam = "";
var gRam = "";
var silences = ["exec", "getServerMaxMoney", "sleep", "getServerSecurityLevel", "getServerMinSecurityLevel", "getServerMoneyAvailable", "getServerUsedRam", "getPurchasedServerCost", "getServerMaxRam"];
 
//  CONFIG
var taintPort = 1; // port to use for taint communication
var secTresh = 20; // treshold for weakening while growing (point value)
var serverNameTemplate = "nillabotV"; // template to name your purchased servers
// percentage of money to steal from target
// smaller percentages may be desirable in earlier game
var stealPercentage = 50;
 
 
//TODO: kill yourself after set time to make way for better targets (thinking at least two cycles and after an hour)
 
 
export async function main(ns) {
    var worker = ns.args[0];
    var target = ns.args[1];
    var fileList = ["hack.js", "grow.js", "weaken.js"]
    var hRam = ns.getScriptRam("hack.js");
    gRam = ns.getScriptRam("grow.js");
    wRam = ns.getScriptRam("weaken.js");
    workerRam = ns.getServerMaxRam(worker);
 
    // Logging helper
    for (var silence of silences) {
        ns.disableLog(silence);
    }
 
    await ns.scp(fileList, "home", worker,);
    upgradeCheck(ns, worker);
 
 
    while (true) {
 
        if (!isTargetMaxed(ns, target)) {
            await fillThatBitchUp(ns, target, worker);
        }
 
        if (!isTargetSoft(ns, target)) {
            await makeTargetSoft(ns, target, worker);
        }
 
        var hThreads = fetchHackThreads(ns, target);
        var w1Threads = fetchWeakenThreads(ns.hackAnalyzeSecurity(hThreads));
        var gThreads = fetchGrowThreads(ns, target);
        var w2Threads = fetchWeakenThreads(ns.growthAnalyzeSecurity(gThreads));
 
        let totalRam = hRam * hThreads + gRam * gThreads + (w1Threads + w2Threads) * wRam;
        if (totalRam > workerRam) {
            await taintAndQuit(ns, target);
        }
 
        // only continue if we can at least run one iteration,
        // this is kinda redundant with the line above but I found to still need it
        let iterations = Math.floor(workerRam / totalRam)
        if (iterations < 1) {
            await taintAndQuit(ns, target);
        }
 
        // only run as many iterations as we can start while the first weaken in a run executes
        // as not to still spawn more processes while the earlier ones already resolve
        if ((iterations * 1.1) > (ns.getWeakenTime(target) / 1000) + 1) {
            iterations = Math.floor(ns.getWeakenTime(target) / 1000) - 2;
        }
 
        ns.print("Running " + iterations + " iterations...");
        for (var i = 1; i <= iterations; i++) {
            ns.exec("hack.js", worker, hThreads, target, fetchHackSleep(ns, target), i);
            ns.exec("weaken.js", worker, w1Threads, target, 0, i);
            ns.exec("grow.js", worker, gThreads, target, fetchGrowSleep(ns, target), i);
            ns.exec("weaken.js", worker, w2Threads, target, 100, i);
            await ns.sleep(200);
        }
 
        //make sure the last iteration has run through before restarting the loop
        await ns.sleep(ns.getWeakenTime(target) + 150);
        upgradeCheck(ns, worker);
    }
}
 
// run weaken against the target until it's reached it's min Security
async function makeTargetSoft(ns, target, worker) {
    var threads = Math.ceil((ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)) / 0.05) + 1;
    ns.print("Weakening for " + threads + " threads.");
 
    if (threads > Math.floor((workerRam - ns.getServerUsedRam(worker)) / wRam)) {
        threads = Math.floor((workerRam - ns.getServerUsedRam(worker)) / wRam);
        ns.print("Too many threads for one cycle weakening. Weakening for " + threads + " threads instead.");
    }
    if (threads < 1) {
        ns.tprint("Negative Error on Worker: " + worker + "\nThreads: " + threads + "\nWorkerRam: " + workerRam + "\nUsed ram: " + ns.getServerUsedRam(worker));
    }
    ns.exec("weaken.js", worker, threads, target, 0, 0);
    await ns.sleep(ns.getWeakenTime(target) + 200);
 
    if (ns.getServerSecurityLevel(target) != ns.getServerMinSecurityLevel(target)) {
        await makeTargetSoft(ns, target, worker);
    }
}
 
// run grow against the target until it's reached it's max money
async function fillThatBitchUp(ns, target, worker) {
    var maxMoney = ns.getServerMaxMoney(target);
    var threads = Math.ceil(ns.growthAnalyze(target, maxMoney / ns.getServerMoneyAvailable(target)));
    ns.print("Growing for " + threads + " threads.");
 
    //Weaken if over secTreshold as not to make the grow take forever
    if ((ns.getServerSecurityLevel - ns.getServerMinSecurityLevel(target)) > secTresh) {
        makeTargetSoft(ns, target, worker);
    }
 
    if (threads > Math.floor((workerRam - ns.getServerUsedRam(worker)) / gRam)) {
        threads = Math.floor((workerRam - ns.getServerUsedRam(worker)) / gRam);
        ns.print("Too many threads for one cycle Grow. Growing for " + threads + " threads instead.");
    }
    ns.exec("grow.js", worker, threads, target, 0, 0);
    await ns.sleep(ns.getGrowTime(target) + 200);
 
    if (ns.getServerMoneyAvailable(target) != ns.getServerMaxMoney(target)) {
        await fillThatBitchUp(ns, target, worker);
    }
}
 
// check if target sec = min sec
function isTargetSoft(ns, target) {
    if (ns.getServerMinSecurityLevel(target) == ns.getServerSecurityLevel(target)) {
        return true;
    } else {
        return false;
    }
}
 
// check if target money = max money
function isTargetMaxed(ns, target) {
    if (ns.getServerMaxMoney(target) == ns.getServerMoneyAvailable(target)) {
        return true;
    } else {
        return false;
    }
}
 
// calculate threads needed for hack operation
function fetchHackThreads(ns, target) {
    let pPerThread = ns.hackAnalyze(target);
    let threadCount = Math.floor((stealPercentage / 100) / pPerThread);
    return threadCount;
}
 
// calculate threads needed for growth operation
function fetchGrowThreads(ns, target) {
    // 0.5 added as safety measure
    let threadCount = ns.growthAnalyze(target, (100 / (100 - stealPercentage)) + 0.5);
    return threadCount;
}
 
// calculate threads needed for weaken operation
function fetchWeakenThreads(amount) {
    //+1 or we could be left with less than 0,05 of security difference left...
    let threadCount = Math.ceil(amount / 0.05) + 1
    return threadCount;
}
 
function fetchHackSleep(ns, target) {
    var sTime = (ns.getWeakenTime(target) - ns.getHackTime(target)) - 50;
    return sTime;
}
 
function fetchGrowSleep(ns, target) {
    var sTime = (ns.getWeakenTime(target) - ns.getGrowTime(target)) + 50;
    return sTime;
}
 
// write target to taint port and kill this script
async function taintAndQuit(ns, target) {
    await ns.writePort(taintPort, target);
    ns.exit();
}
 
// Check if we have enough money and upgrade if we do
function upgradeCheck(ns, worker) {
    var currentRam = ns.getServerMaxRam(worker);
    var maxRam = ns.getPurchasedServerMaxRam();
 
    //upgrade if we can buy upgrade all 25 servers with half our money
    if (((ns.getServerMoneyAvailable("home") / 2) / 25) >= ns.getPurchasedServerCost(currentRam * 2) && currentRam != maxRam) {
        var ram = currentRam * 2;
        ram = ram > maxRam ? maxRam : ram;
 
 
        if (ns.getServerUsedRam(worker) > 0) {
            ns.killall(worker);
        }
 
        ns.deleteServer(worker);
        ns.purchaseServer(fetchServername(ram), ram);
        ns.tprint("Upgrade " + worker + " to " + ns.nFormat(ram * 1024 * 1024 * 1024, '0b') + "of ram.");
        ns.exit();
    }
}
 
// helper function for server purchasing
function fetchServername(ram) {
    var version = ""
    if (ram > 1000) {
        version = Math.round(ram / 1000) + "k";
    } else {
        version = ram;
    }
    return serverNameTemplate + version;
}
<<<<<<<<<< END worker.js >>>>>>>>>>