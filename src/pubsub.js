import { log as _log, LL, isObject } from "common"
import { tree } from "testing/tree"

async function log(ns, message, prefix = "", logLevel = LL.DEBUG) {
    const scriptPrefix = `[pubsub][${ns.getHostname()}]`
    _log(ns, `${scriptPrefix}${prefix} ${message}`, logLevel)
}

/**
 * Subscription list where values are the lists of hosts that subscribed
 * @typedef {Object<string,Array<SubscriberMetadata>} Subscriptions
 *
 * All subscriptions
 * TODO: Figure out how to make constants properly
 * @type {Subscriptions}
 */
let _subscriptions = {
    "hack-request": [],
    "hack-request-response": [],
}
let _lock = false

async function setSubscriptions(ns, newSubscriptions) {
    while (_lock) await ns.sleep(50)

    _lock = true
    const subscriptionsBefore = JSON.parse(JSON.stringify(_subscriptions))
    _subscriptions = JSON.parse(JSON.stringify(newSubscriptions))
    log(
        ns,
        `_subscriptions before: ${JSON.stringify(subscriptionsBefore)}`,
        //`_subscriptions: ${await tree(ns, _subscriptions)}`,
        "[setSubscriptions]",
        LL.TRACE
    )
    log(
        ns,
        `_subscriptions after: ${JSON.stringify(_subscriptions)}`,
        //`_subscriptions: ${await tree(ns, _subscriptions)}`,
        "[setSubscriptions]",
        LL.TRACE
    )
    _lock = false
}

async function getSubscriptions(ns) {
    while (_lock) await ns.sleep(50)
    log(
        ns,
        `_subscriptions: ${JSON.stringify(_subscriptions)}`,
        //`_subscriptions: ${await tree(ns, _subscriptions)}`,
        "[getSubscriptions]",
        LL.TRACE
    )
    return JSON.parse(JSON.stringify(_subscriptions))
}

/**
 * Subscribe a host to a message with a specific type and start receiving those types of messages
 * @param {NS} ns
 * @param {string} typeStr Type to subscribe to.
 * @param {MessageHandlerCallback} callback Function called on new messages with the message as the argument
 * @param {string} host Host to subscribe to the message type. If null, current host will be used.
 */
export async function Subscribe(ns, type, callback, host) {
    const typeStr = String(type)
    const subscriber = host || ns.getHostname()
    const subscriptions = await getSubscriptions(ns)
    if (!isObject(subscriptions)) {
        log(
            ns,
            `subscriptions was not an object: ${subscriptions}`,
            "[subscribe]",
            LL.ERROR
        )
        return false
    }

    const currentSubscriptions = JSON.parse(JSON.stringify(subscriptions)) // copy
    log(
        ns,
        `currentSubscriptions before: ${JSON.stringify(currentSubscriptions)}`,
        "[subscribe]",
        LL.TRACE
    )
    log(
        ns,
        `subscriptions before: ${JSON.stringify(subscriptions)}`,
        "[subscribe]",
        LL.TRACE
    )
    currentSubscriptions[typeStr] = Array.isArray(currentSubscriptions[typeStr])
        ? currentSubscriptions[typeStr]
        : []
    log(
        ns,
        `currentSubscriptions after: ${JSON.stringify(currentSubscriptions)}`,
        "[subscribe]",
        LL.TRACE
    )
    log(
        ns,
        `subscriptions after: ${JSON.stringify(subscriptions)}`,
        "[subscribe]",
        LL.TRACE
    )

    const addedSubscriptionsCount = currentSubscriptions[typeStr].push({
        subscriber: subscriber,
        callback: callback,
    })
    log(
        ns,
        `addedSubscriptionsCount: ${JSON.stringify(addedSubscriptionsCount)}`,
        "[subscribe]",
        LL.TRACE
    )
    await setSubscriptions(ns, currentSubscriptions)
    const after = await getSubscriptions(ns)
    log(
        ns,
        `Subscriptions after: ${JSON.stringify(after)}`,
        "[subscribe]",
        after ? LL.INFO : LL.ERROR
    )

    if (!after) {
        // something is wrong
        return false
    }

    return true
}

/**
 * Unsubscribe a host from a message with a specific type to eventually stop receiving those types of messages
 * @param {NS} ns
 * @param {string} type Type to subscribe to.
 * @param {string?} host Host to unsubscribe from the message type. If null, current host will be used.
 */
export async function Unsubscribe(ns, type, host = null) {
    const typeStr = String(type)
    const subscriber = host || ns.getHostname()
    const currentSubscriptions = await getSubscriptions(ns)
    const subscribers = currentSubscriptions[typeStr]
    const newSubscriptions = JSON.parse(JSON.stringify(currentSubscriptions)) // copy
    newSubscriptions[typeStr] = subscribers.filter(val => val != subscriber) // remove host
    await setSubscriptions(ns, newSubscriptions)
}

/**
 * Push a message to the ether for any subscribes to read
 * @param {NS} ns
 * @param {string} type
 * @param {Object} message
 */
export async function Publish(ns, type, message) {
    const subscriptions = await getSubscriptions(ns)
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
    for (const { host, callback } of subscriptions[type]) {
        //await writeData(ns, message)
        await log(
            ns,
            `${host}.callback(ns, ${JSON.stringify(message)})`,
            "[publish]",
            LL.TRACE
        )
        await callback(ns, message)
    }
    return true
}

/**
 * @callback MessageHandlerCallback
 * @param {NS} ns
 * @param {Object} message
 */

/**
 * @typedef {Object} SubscriberMetadata
 * @property {string} host Subscriber hostname
 * @property {MessageHandlerCallback} callback Callback provided by the subscriber
 */
