/** @param {NS} ns */
export async function main(ns) {
	const files = ns.ls("home",".js")
	for (const file of files) {
		const content = ns.read(file)
		ns.tprint(`\n>>>>>>>>>>>> ${file} <<<<<<<<<<<<\n${content}\n<<<<<<<<<< END ${file} >>>>>>>>>>\n`)
	}
}