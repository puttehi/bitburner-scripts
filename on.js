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