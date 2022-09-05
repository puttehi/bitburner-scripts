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