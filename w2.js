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