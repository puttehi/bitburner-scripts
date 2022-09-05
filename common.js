/** @param {NS} ns */
export async function readJsonTxtFile(ns) {
	const filepath = ns.args[0]
	const content = ns.read(filepath)
	const obj = JSON.parse(content)
	return obj
}
