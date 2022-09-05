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