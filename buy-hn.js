// TODO: Buying nodes and maxing those out too

/** @param {NS} ns */
export async function main(ns) {

	//const maxMoneySpentPct = 0.4 // Spend 40% of cash
	const maxMoneySpentPct = 0.95 // Spend 95% of cash
	//const minMoneyAvailable = 1000000000 // keep 1b always
	const minMoneyAvailable = 1000000000000 // keep 1t always
	const playerMoney = ns.getPlayer().money
	const nodeCost = ns.hacknet.getPurchaseNodeCost()

	let totalPrice = 0
	const nodeCount = ns.hacknet.numNodes()
	for (let i = 0; i < nodeCount; i++) {
		const node = ns.hacknet.getNodeStats(i)

		// non-maxed only
		const isMaxLevel = node.level > 199
		const isMaxRam = node.ram > 63
		const isMaxCores = node.cores > 15
		const isMaxed = isMaxLevel && isMaxRam && isMaxCores
		ns.tprint(`maxed ${i}?: ${isMaxed}`)
		if (isMaxed) continue

		const amountLevels = 199// - node.level // buy to max 199
		const amountRamLevels = 6// - node.ram  // buy to max 6
		const amountCoreLevels = 15// - node.cores // buy to max 15
		const levelPrice = ns.hacknet.getLevelUpgradeCost(i, amountLevels)
		const ramPrice = ns.hacknet.getRamUpgradeCost(i, amountRamLevels)
		const corePrice = ns.hacknet.getCoreUpgradeCost(i, amountCoreLevels)
		const price = levelPrice + ramPrice + corePrice
		const accumulatedPrice = totalPrice + price

		const underMaxSpendByPct = accumulatedPrice < playerMoney * maxMoneySpentPct
		const hasMinMoneyAvailable = playerMoney - accumulatedPrice > minMoneyAvailable
		const inBudget = underMaxSpendByPct && hasMinMoneyAvailable
		ns.tprint(`level +${amountLevels}: \$${levelPrice} ram +${amountRamLevels}: \$${ramPrice} cores +${amountCoreLevels}: \$${corePrice}`)
		ns.tprint(`new total: \$${totalPrice} + \$${price} = \$${accumulatedPrice}`)
		ns.tprint(`still in budget for ${i}?: ${inBudget}`)

		// Can't spend no more, stop processing
		if (!inBudget) break

		totalPrice += price
	}

	ns.tprint(`total price: \$${totalPrice}`)
	// TODO: Add upgrade amount
	ns.tprint(`new node: \$${nodeCost}`)

	if (totalPrice == 0) return

	const answer = await ns.prompt(`Buy upgrades for: \$${totalPrice} ?`, { type: "select", choices: ["Yes", "Abort"] })
	if (answer == "Abort" || !answer) {
		ns.tprint("Aborting purchase")
		return
	}
	// TODO: Buy
	ns.tprint(`Bought upgrades for \$${totalPrice} leaving \$${playerMoney - totalPrice}`)

}