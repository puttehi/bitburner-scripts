//import moment from "./vendor/moment.min.js"
//import * as moment from "./vendor/moment.min.js"
//var moment = require("./vendor/moment.min.js")
//var moment = await require("https://momentjs.com/downloads/moment.min.js")
//var moment = require("//vendor/moment.min")
//import moment from "https://momentjs.com/downloads/moment.js"
//var moment = import("https://momentjs.com/downloads/moment.js").moment
//var moment = import("./vendor/moment.min.js").moment
//import { moment } from "./vendor/moment.min.js"
import { config } from "config.js"
import { log, LL } from "common.js"

// Message metadatas

/**
 * @typedef {Object} MessageMetadata
 * Base message properties
 * - If either party rejects the message, it will be sent to the deadletter channel to wait for handling.
 *   When the deadletter channel is full, the message could be destroyed instead. Consider recovering those
 *   messages a rare occurence. They are more for debugging than anything else.
 *   - If the receiver rejects the message and sends it back, they will increase the `recv_rejects`
 *   - If the sender rejects the message and sends it back, they will increase the `send_rejects`
 * @property {number} id Amount of time the message was rejected by the sender. `0` -> Deadletter.
 * @property {string} type Message type, used to make channels multi-purpose
 * @property {string} sender Sender host
 * @property {string} receiver Receiver host
 * @property {string} timestamp Timestamp in format `config.ports.timestamp_format`
 * @property {number} recv_max_rejects Amount of times the message can be rejected by the receiver before deadlettering it.
 * @property {number} send_max_rejects Amount of times the message can be rejected by the sender before deadlettering it.
 * @property {number} recv_rejects Amount of times the message was rejected by the receiver. `recv_max_rejects` -> Deadletter.
 * @property {number} send_rejects Amount of times the message was rejected by the sender. `recv_max_rejects` -> Deadletter.
 * @global
 */

/**
 * @typedef {Object} ScriptExecutionMetadata
 * @property {string} script Path for the script to be executed
 * @property {!number?} threads Number of threads to use for script execution. Defaults to 1.
 * @global
 */

/**
 * @typedef {Object} HackRequestMetadata
 * @property {string} target Target for execution
 * @global
 */

/**
 * @typedef {Object} HackRequestResponseMetadata
 * @property {OriginalHackRequestData} request
 * @property {number} stolenMoney Stolen money as a result of the original request
 * @global
 */

// Messages

/**
 * @typedef {Object} MessageData
 * @property {MessageMetadata} meta Message metadata
 * @global
 */

/**
 * @typedef {Object} ScriptExecutionMessageData
 * @property {MessageMetadata} meta Message metadata
 * @property {ScriptExecutionMetadata} exec_meta
 * @global
 */

/**
 * @typedef {Object} HackRequestMessageData
 * @property {MessageMetadata} meta Message metadata
 * @property {ScriptExecutionMetadata} exec_meta Script execution metadata (script, threads)
 * @property {HackRequestMetadata} hack_meta Hack request metadata
 * @global
 * @typedef {HackRequestMessageData} OriginalHackRequestData
 */

/**
 * @typedef {Object} HackRequestResponseData
 * @property {MessageMetadata} meta Message metadata
 * @property {OriginalHackRequestData} request // Original request
 * @property {number} stolenMoney // Stolen money as a result of the original request
 * @global
 */

const MESSAGE_TYPES = {
    HACK_REQUEST: "hack-request",
    HACK_REQUEST_RESPONSE: "hack-request-response",
}

// Read config

/**
 * Get values of config.io.channels.* for readPort, writePort
 * @param {import("./config").SenderChannel} channelsConfig
 * @returns {number[]} Values of `channelsPorts`
 */
const readConfigChannels = channelsConfig => {
    const channels = Object.keys(channelsConfig)

    const channelsAsPorts = []
    for (const channel of channels) {
        channelsAsPorts.push(channelsConfig[channel])
    }

    return channelsAsPorts
}

const SEND_CHANNELS = readConfigChannels(config.io.channels.sender)
const RECV_CHANNELS = readConfigChannels(config.io.channels.receiver)

var _nextId = 0

/**
 *
 * @param {NS} ns ns
 * @param {string} sender Sender host
 * @param {string} receiver Receiver host
 * @param {number} recv_max_rejects Amount of times the message can be rejected by the receiver before deadlettering it.
 * @param {number} send_max_rejects Amount of times the message can be rejected by the sender before deadlettering it.
 * @returns {MessageMetadata} Base message metadata to attach to every message
 */
function CreateMessageMetadata(
    ns,
    sender,
    receiver,
    recv_max_rejects,
    send_max_rejects
) {
    const meta = {
        id: NextMessageId(),
        type: "base",
        sender: sender,
        receiver: receiver,
        timestamp: CreateTimestamp(ns),
        recv_max_rejects: recv_max_rejects,
        send_max_rejects: send_max_rejects,
        recv_rejects: 0,
        send_rejects: 0,
    }

    return meta
}

function NextMessageId() {
    const id = _nextId

    _nextId += 1

    return id
}

function CreateTimestamp(ns) {
    const format = config.io.timestamp_format

    //log(ns, moment, LL.DEBUG)

    //const timestamp = moment().format(format)

    const timestamp = format // TODO: DEBUG

    return timestamp
}

/**
 * Create a hack request message to ask `receiver` to start hacking the `target`
 * @param {NS} ns ns
 * @param {string} sender Sender host
 * @param {string} receiver Receiver host
 * @param {number} recv_max_rejects Amount of times the message can be rejected by the receiver before deadlettering it.
 * @param {number} send_max_rejects Amount of times the message can be rejected by the sender before deadlettering it.
 * @param {string} script Path for the script to be executed
 * @param {!number?} threads Number of threads to use for script execution. Defaults to 1.
 * @param {string} target Hack target
 * @returns {HackRequestMessageData} Base message metadata to attach to every message
 */
function CreateHackRequestMessage(
    ns,
    sender,
    receiver,
    recv_max_rejects,
    send_max_rejects,
    script,
    threads,
    target
) {
    const meta = CreateMessageMetadata(
        ns,
        sender,
        receiver,
        recv_max_rejects,
        send_max_rejects
    )
    const exec_meta = CreateScriptExecutionMetadata(ns, script, threads)
    const hack_meta = CreateHackRequestMetadata(ns, target)
    const message = {
        meta: meta,
        exec_meta: exec_meta,
        hack_meta: hack_meta,
    }
    message.meta.type = MESSAGE_TYPES.HACK_REQUEST

    return message
}

/**
 *
 * @param {NS} ns ns
 * @param {string} script Path for the script to be executed
 * @param {!number?} threads Number of threads to use for script execution. Defaults to 1.
 * @returns {ScriptExecutionMetadata} Script execution metadata to attach to a script execution message
 */
function CreateScriptExecutionMetadata(ns, script, threads = 1) {
    const exec_meta = {
        script: script,
        threads: threads,
    }

    return exec_meta
}

/**
 *
 * @param {NS} ns ns
 * @param {string} target Hack target
 * @returns {HackRequestMetadata} Script execution metadata to attach to a script execution message
 */
function CreateHackRequestMetadata(ns, target) {
    const hack_meta = {
        target: target,
    }

    return hack_meta
}

/**
 *
 * @param {NS} ns NetScript namespace
 * @param {string} receiver Message recipient
 * @param {string} script Script to use
 * @param {number} threads Amount of threads to use
 * @param {string} target Hack target host
 * @returns {boolean} Was message sent?
 */
export async function SendHackRequestMessage(
    ns,
    receiver,
    script,
    threads,
    target
) {
    const sender = ns.getHostname() // This library will be on every machine, so it will be called "locally"
    const max_rejections_by_recipient = 10
    const max_retries = 10
    const message = CreateHackRequestMessage(
        ns,
        sender,
        receiver,
        max_rejections_by_recipient,
        max_retries,
        script,
        threads,
        target
    )

    const success = await SendToReceiver(
        ns,
        config.io.channels.sender.SEND_GWH_MAIN,
        message
    )

    return success
}

/**
 *
 * @param {NS} ns
 * @param {OriginalHackRequestData} originalRequest Original hack request
 * @param {number} stolenMoney Stolen money
 * @returns {boolean} Was message sent?
 */
export async function SendHackRequestResponse(
    ns,
    originalRequest,
    stolenMoney
) {
    const sender = ns.getHostname() // This library will be on every machine, so it will be called "locally"
    const max_rejections_by_recipient = 10
    const max_retries = 10
    const meta = CreateMessageMetadata(
        ns,
        sender,
        originalRequest.meta.sender,
        max_rejections_by_recipient,
        max_retries
    )
    /**
     * @type {HackRequestResponseData} response
     */
    const response = {
        meta: meta,
        request: originalRequest,
        stolenMoney: stolenMoney,
    }
    response.meta.type = MESSAGE_TYPES.HACK_REQUEST_RESPONSE

    const success = await SendToReceiver(
        ns,
        config.io.channels.sender.SEND_GWH_MAIN,
        response
    )

    return success
}

/**
 * Send a message to a receiver.
 * @param {NS} ns NetScript namespace
 * @param {import("./config").SenderChannel} channel Sender channel to write to
 * @param {Object} message Message to send
 * @returns {boolean} Was message sent?
 */
export async function SendToReceiver(ns, channel, message) {
    if (SEND_CHANNELS.findIndex(val => val == channel) == -1) {
        // User error
        await log(
            ns,
            `[SendToReceiver] Invalid channel: ${channel} - Valid channels: ${JSON.stringify(
                SEND_CHANNELS
            )}`,
            LL.ERROR
        )
    }

    try {
        const stringified = JSON.stringify(message)
        //ns.tryWritePort(port:number, data:string|number)
        ns.tryWritePort(channel, stringified)
    } catch (err) {
        await log(ns, err, LL.ERROR)
        return false
    }

    return true
}

/**
 * Read a message from a sender.
 * @param {NS} ns NetScript namespace
 * @param {import("./config").SenderChannel} channel Sender channel to read from
 * @returns {Object | null | false} Next message from `channel`, `null` if no messages were available or `false` when something went wrong
 */
export async function ReadFromSender(ns, channel) {
    if (!(channel in SEND_CHANNELS)) {
        // User error
        await log(
            ns,
            `[ReadFromSender] Invalid channel: ${channel} - Valid channels: ${SEND_CHANNELS}`,
            LL.ERROR
        )
        return false
    }

    let message = null
    try {
        //ns.readPort(port:number)
        const data = ns.readPort(channel)
        if (data != "NULL PORT DATA") {
            message = JSON.parse(data)
        }
    } catch (err) {
        await log(ns, err, LL.ERROR)
        return false
    }

    return message
}
