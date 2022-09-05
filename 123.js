/** @param {NS} ns */
export async function main(ns) {
	const thisScriptRam = ns.getScriptRam("123.js", "home")
	if (ns.args[0] == undefined) {
		const suggThreads = Math.floor((ns.getServerMaxRam("home") - ns.getServerUsedRam("home")) / thisScriptRam)
		ns.tprint(`Suggested threads: ${suggThreads}`)
		//ns.tprint(`Usage: run 123.js -t <THREADS> <THREADS> <TARGET>`)
		ns.tprint(`Usage: run 123.js -t <THREADS> <TARGET>`)
		return
	}
	//ns.getRunningScript(ns.getScriptName(), ns.getHostname(), ns.args).threads
	//const THIS_THREADS = ns.args[0]
	const THIS_THREADS = ns.getRunningScript(ns.getScriptName(), ns.getHostname(), ...ns.args).threads
	//const TARGET = ns.args[1]
	const TARGET = ns.args[0]
	const MONEY_THRESHOLD = 0.75
	const MIN_SEC_LEVEL = ns.getServerMinSecurityLevel(TARGET)
	const SEC_LEVEL = ns.getServerSecurityLevel(TARGET)
	while (true) {
		if (ns.getServerMoneyAvailable(TARGET) / ns.getServerMaxMoney(TARGET) > MONEY_THRESHOLD) {
			ns.print(`Enough money, hacking`)
			await ns.hack(TARGET, { threads: THIS_THREADS });
			}
		else {
			ns.print(`Not enough money, growing`)
			await ns.grow(TARGET, { threads: THIS_THREADS });
			}
		if (SEC_LEVEL > MIN_SEC_LEVEL) {
			ns.print(`Too high security, weakening`)
			await ns.weaken(TARGET, { threads: THIS_THREADS });
			}
	}
}