import { NS } from "@ns"
import { log as _log, LL, isObject } from "common"
//import { tree } from "testing/tree"
import { LogLevels } from "/config"

async function log(
    ns: NS,
    message: string,
    prefix = "",
    logLevel: LogLevels = LL.DEBUG
): Promise<void> {
    const scriptPrefix = `[pubsub][${ns.getHostname()}]`
    await _log(ns, `${scriptPrefix}${prefix} ${message}`, logLevel)
}

export type MessageHandlerCallback = (
    ns: NS,
    message: Record<string, unknown>
) => Promise<void>
export interface ISubscriberMetadata {
    subscriber: string
    callback: MessageHandlerCallback
}
export type Subscriptions = Record<string, Array<ISubscriberMetadata>>

// class PubSub {
//     static _subscriptions: Subscriptions = {
//         "hack-request": [],
//         "hack-request-response": [],
//     }
//     static _lock = false

//     static async setSubscriptions(
//         ns: NS,
//         newSubscriptions: Subscriptions
//     ): Promise<void> {
//         while (PubSub._lock) await ns.sleep(50)

//         PubSub._lock = true
//         const subscriptionsBefore: Subscriptions = JSON.parse(
//             JSON.stringify(PubSub._subscriptions)
//         )
//         PubSub._subscriptions = JSON.parse(JSON.stringify(newSubscriptions))
//         await log(
//             ns,
//             `_subscriptions before: ${JSON.stringify(subscriptionsBefore)}`,
//             //`_subscriptions: ${await tree(ns, _subscriptions)}`,
//             "[setSubscriptions]",
//             LL.TRACE
//         )
//         await log(
//             ns,
//             `_subscriptions after: ${JSON.stringify(PubSub._subscriptions)}`,
//             //`_subscriptions: ${await tree(ns, _subscriptions)}`,
//             "[setSubscriptions]",
//             LL.TRACE
//         )
//         PubSub._lock = false
//     }

//     static async getSubscriptions(ns: NS): Promise<Subscriptions> {
//         while (PubSub._lock) await ns.sleep(50)
//         await log(
//             ns,
//             `_subscriptions: ${JSON.stringify(PubSub._subscriptions)}`,
//             //`_subscriptions: ${await tree(ns, _subscriptions)}`,
//             "[getSubscriptions]",
//             LL.TRACE
//         )
//         return JSON.parse(JSON.stringify(PubSub._subscriptions))
//     }
// }

let subscriptionAttemptCount = 0

/**
 * Subscribe a host to a message with a specific type and start receiving those types of messages
 * @param ns
 * @param typeStr Type to subscribe to.
 * @param callback Function called on new messages with the message as the argument
 * @param host Host to subscribe to the message type. If null, current host will be used.
 */
export async function Subscribe(
    ns: NS,
    type: string,
    callback: MessageHandlerCallback,
    host: string | null = null
): Promise<boolean> {
    await log(ns, `Subattempts: ${subscriptionAttemptCount}`)
    subscriptionAttemptCount += 1
    const typeStr = String(type)
    const subscriber = host || ns.getHostname()
    //const subscriptions = await PubSub.getSubscriptions(ns)
    await ns.writePort(1, JSON.stringify({ getSubscriptions: true }))
    let subscriptions: Subscriptions | null = null
    do {
        const data = await ns.readPort(2)
        if ((data as string) != "NULL PORT DATA")
            subscriptions = JSON.parse(data as string)

        await ns.sleep(10)
    } while (subscriptions == null)
    if (!isObject(subscriptions)) {
        await log(
            ns,
            `subscriptions was not an object: ${subscriptions}`,
            "[subscribe]",
            LL.ERROR
        )
        return false
    }

    const currentSubscriptions: Subscriptions = JSON.parse(
        JSON.stringify(subscriptions)
    ) // copy
    await log(
        ns,
        `currentSubscriptions before: ${JSON.stringify(currentSubscriptions)}`,
        "[subscribe]",
        LL.TRACE
    )
    await log(
        ns,
        `subscriptions before: ${JSON.stringify(subscriptions)}`,
        "[subscribe]",
        LL.TRACE
    )
    currentSubscriptions[typeStr] = Array.isArray(currentSubscriptions[typeStr])
        ? currentSubscriptions[typeStr]
        : []
    await log(
        ns,
        `currentSubscriptions after: ${JSON.stringify(currentSubscriptions)}`,
        "[subscribe]",
        LL.TRACE
    )
    await log(
        ns,
        `subscriptions after: ${JSON.stringify(subscriptions)}`,
        "[subscribe]",
        LL.TRACE
    )

    const addedSubscriptionsCount: number = currentSubscriptions[typeStr].push({
        subscriber: subscriber,
        callback: callback,
    } as ISubscriberMetadata)
    await log(
        ns,
        `addedSubscriptionsCount: ${JSON.stringify(addedSubscriptionsCount)}`,
        "[subscribe]",
        LL.TRACE
    )
    //await PubSub.setSubscriptions(ns, currentSubscriptions)
    await ns.writePort(
        1,
        JSON.stringify({
            setSubscriptions: true,
            newSubscriptions: currentSubscriptions,
        })
    )
    // const after: Subscriptions = await PubSub.getSubscriptions(ns)
    // await log(
    // ns,
    // `Subscriptions after: ${JSON.stringify(after)}`,
    // "[subscribe]",
    // after ? LL.INFO : LL.ERROR
    // )

    //if (!after) {
    //    // something is wrong
    //    return false
    //}

    return true
}

/**
 * Unsubscribe a host from a message with a specific type to eventually stop receiving those types of messages
 * @param ns
 * @param type Type to subscribe to.
 * @param host Host to unsubscribe from the message type. If null, current host will be used.
 */
export async function Unsubscribe(
    ns: NS,
    type: string,
    host: string | null = null
): Promise<void> {
    const typeStr = String(type)
    const subscriber: string = host || ns.getHostname()

    // const currentSubscriptions: Subscriptions = await PubSub.getSubscriptions(
    // ns
    // )
    await ns.writePort(1, JSON.stringify({ getSubscriptions: true }))
    let currentSubscriptions: Subscriptions | null = null
    do {
        const data = await ns.readPort(2)
        if ((data as string) != "NULL PORT DATA")
            currentSubscriptions = JSON.parse(data as string)

        await ns.sleep(10)
    } while (currentSubscriptions == null)

    const subscribers: Array<ISubscriberMetadata> =
        currentSubscriptions[typeStr]

    const newSubscriptions: Subscriptions = JSON.parse(
        JSON.stringify(currentSubscriptions)
    ) // copy
    newSubscriptions[typeStr] = subscribers.filter(
        val => val.subscriber != subscriber
    ) // remove host
    //await PubSub.setSubscriptions(ns, newSubscriptions)
    await ns.writePort(
        1,
        JSON.stringify({
            setSubscriptions: true,
            newSubscriptions: newSubscriptions,
        })
    )
}

/**
 * Push a message to the ether for any subscribes to read
 * @param ns
 * @param type
 * @param message
 */
export async function Publish(
    ns: NS,
    type: string,
    message: Record<string, unknown>
): Promise<boolean> {
    //const subscriptions = await PubSub.getSubscriptions(ns)

    await ns.writePort(1, JSON.stringify({ getSubscriptions: true }))
    let subscriptions: Subscriptions | null = null
    do {
        const data = await ns.readPort(2)
        if ((data as string) != "NULL PORT DATA")
            subscriptions = JSON.parse(data as string)

        await ns.sleep(10)
    } while (subscriptions == null)

    if (!subscriptions) {
        await log(
            ns,
            `subscriptions was falsy: ${subscriptions}`,
            "[publish]",
            LL.ERROR
        )
        return false
    }

    const types = Object.keys(subscriptions)
    if (types.indexOf(type) === -1) {
        await log(
            ns,
            `${JSON.stringify(
                type
            )} not a valid type. Valid types: ${JSON.stringify(types)}`,
            "[publish]",
            LL.ERROR
        )
        return false
    }
    for (const { subscriber, callback } of subscriptions[type]) {
        //await writeData(ns, message)
        await log(
            ns,
            `${subscriber}.callback(ns, ${JSON.stringify(message)})`,
            "[publish]",
            LL.TRACE
        )
        await callback(ns, message)
    }
    return true
}
