/** @param {NS} ns **/
export async function main(ns) {
    var target = ns.args[0];
    var sTime = ns.args[1]; // ms
    var strategy = ns.args[2]; // w/g/h
    var infinite = ns.args[3]; // bool

    while (infinite) {
        for (const c of strategy) {
            if (sTime > 0) await ns.sleep(sTime);
            switch (c) {
                case "h":
                    await ns.hack(target);
                case "g":
                    await ns.grow(target);
                case "w":
                    await ns.weaken(target);
                default:
                    break;
            }
        }
    }
}
