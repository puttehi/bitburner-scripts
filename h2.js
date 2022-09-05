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