import { NS } from "@ns"
import { Subscriptions /*ISubscriberMetadata*/ } from "pubsub"
import { LL, log as _log } from "/common"
import { LogLevels } from "/config"

async function log(
    ns: NS,
    message: string,
    prefix = "",
    logLevel: LogLevels = LL.DEBUG
): Promise<void> {
    const scriptPrefix = `[ps-service][${ns.getHostname()}]`
    await _log(ns, `${scriptPrefix}${prefix} ${message}`, logLevel)
}

interface IPubSubCtor {
    new (ns: NS): IPubSub
}

interface IPubSub {
    _subscriptions: Subscriptions
    _lock: boolean
    _subscriptionAttemptCount: number
    sendPort: number
    receivePort: number
    getSubscriptions(ns: NS): Promise<Subscriptions>
    setSubscriptions(ns: NS, newSubscriptions: Subscriptions): Promise<void>
    ReadNextDataRequest(ns: NS): Promise<Record<string, unknown> | false | null>
    SendDataRequestResult(
        ns: NS,
        message: Record<string, unknown>
    ): Promise<boolean>
}

async function createPubSub(ctor: IPubSubCtor, ns: NS): Promise<IPubSub> {
    return await new ctor(ns)
}

class PubSub implements IPubSub {
    _subscriptions = {
        "hack-request": [],
        "hack-request-response": [],
    } as Subscriptions
    _lock = false
    _subscriptionAttemptCount = 0
    sendPort = 2 // Will send data request results to this port
    receivePort = 1 // Will read data requests from this port

    async setSubscriptions(
        ns: NS,
        newSubscriptions: Subscriptions
    ): Promise<void> {
        while (this._lock) await ns.sleep(50)

        this._lock = true
        const subscriptionsBefore: Subscriptions = JSON.parse(
            JSON.stringify(this._subscriptions)
        )
        this._subscriptions = JSON.parse(JSON.stringify(newSubscriptions))
        await log(
            ns,
            `_subscriptions before: ${JSON.stringify(subscriptionsBefore)}`,
            //`_subscriptions: ${await tree(ns, _subscriptions)}`,
            "[setSubscriptions]",
            LL.TRACE
        )
        await log(
            ns,
            `_subscriptions after: ${JSON.stringify(this._subscriptions)}`,
            //`_subscriptions: ${await tree(ns, _subscriptions)}`,
            "[setSubscriptions]",
            LL.TRACE
        )
        this._lock = false
        this._subscriptionAttemptCount += 1
    }

    async getSubscriptions(ns: NS): Promise<Subscriptions> {
        while (this._lock) await ns.sleep(50)
        await log(
            ns,
            `_subscriptions: ${JSON.stringify(this._subscriptions)}`,
            //`_subscriptions: ${await tree(ns, _subscriptions)}`,
            "[getSubscriptions]",
            LL.TRACE
        )
        return JSON.parse(JSON.stringify(this._subscriptions))
    }

    /**
     * Send a message to a receiver.
     * @param ns NetScript namespace
     * @param message Message to send
     * @returns Was message sent?
     */
    async SendDataRequestResult(
        ns: NS,
        message: Record<string, unknown>
    ): Promise<boolean> {
        try {
            const stringified = JSON.stringify(message)
            //ns.tryWritePort(port:number, data:string|number)
            await ns.tryWritePort(this.sendPort, stringified)
        } catch (err) {
            if (err instanceof Error)
                await log(ns, err.message, "[SendToReceiver]", LL.ERROR)
            return false
        }

        return true
    }

    /**
     * Read a message from a sender.
     * @param ns NetScript namespace
     * @returns Next message from port this.receivePort, `null` if no messages were available or `false` when something went wrong
     */
    async ReadNextDataRequest(
        ns: NS
    ): Promise<Record<string, unknown> | false | null> {
        let message = null
        try {
            //ns.readPort(port:number)
            const data = ns.readPort(this.receivePort)
            if (data != "NULL PORT DATA") {
                message = JSON.parse(data.toString())
            }
        } catch (err) {
            if (err instanceof Error)
                await log(ns, err.message, "[SendToReceiver]", LL.ERROR)
            return false
        }

        return message
    }
}

export async function main(ns: NS): Promise<boolean> {
    const ps = await createPubSub(PubSub, ns)
    await log(ns, "Created ps", "[main]", LL.TRACE)
    while (true) {
        // Read data requests
        const req = await ps.ReadNextDataRequest(ns)
        await log(ns, `New request: ${JSON.stringify(req)}`, "[main]", LL.TRACE)
        if (req) {
            if (req.setSubscriptions) {
                await log(
                    ns,
                    `Request to set subscriptions to ${JSON.stringify(
                        req.newSubscriptions
                    )}`,
                    "[main]",
                    LL.TRACE
                )
                await ps.setSubscriptions(
                    ns,
                    req.newSubscriptions as Subscriptions
                )
            }
            // TODO: if(req.unsubscribe)
            if (req.getSubscriptions) {
                await log(
                    ns,
                    `Request to get subscriptions`,
                    "[main]",
                    LL.TRACE
                )
                const data = await ps.getSubscriptions(ns)
                await ns.tryWritePort(ps.sendPort, JSON.stringify(data))
            }
        } else {
            await log(
                ns,
                `Invalid request: ${JSON.stringify(req)}`,
                "[main]",
                LL.TRACE
            )
        }
        await ns.sleep(1000)
    }
}
