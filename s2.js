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