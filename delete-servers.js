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