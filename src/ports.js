import moment from "./vendor/moment.min.js"
import { config } from "./config"
import { log, LL } from "./common"

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
 * @typedef {Object} HackRequestMessageData
 * @property {MessageMetadata} meta Message metadata
 * @property {ScriptExecutionMetadata} exec_meta Script execution metadata (script, threads)
 * @property {string} target Target for execution
 */

const SEND_CHANNELS = config.io.channels.sender
const RECV_CHANNELS = config.io.channels.receiver

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
        timestamp: CreateTimestamp(),
        recv_max_rejects: recv_max_rejects,
        send_max_rejects: send_max_rejects,
        recv_rejects: 0,
        send_rejects: 0,
    }

    return meta
}

function NextMessageId() {
    const id = _next_id

    next_id += 1

    return id
}

function CreateTimestamp() {
    const format = config.io.timestamp_format

    const timestamp = moment().format(format)

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
    const message = {
        meta: meta,
        exec_meta: exec_meta,
        target: target,
    }

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
 * Send a message to a receiver.
 * @param {NS} ns NetScript namespace
 * @param {import("./config").SenderChannel} channel Sender channel to write to
 * @param {Object} message Message to send
 * @returns {boolean} Was message sent?
 */
export async function SendToReceiver(ns, channel, message) {
    if (!(channel in SEND_CHANNELS)) {
        // User error
        log(
            ns,
            `[SendToReceiver] Invalid channel: ${channel} - Valid channels: ${SEND_CHANNELS}`,
            LL.ERROR
        )
        return false
    }

    try {
        const stringified = JSON.stringify(message)
        //ns.tryWritePort(port:number, data:string|number)
        ns.tryWritePort(channel, stringified)
    } catch (err) {
        log(ns, err, LL.ERROR)
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
        log(
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
            message = JSON.parse(stringified)
        }
    } catch (err) {
        log(ns, err, LL.ERROR)
        return false
    }

    return message
}
