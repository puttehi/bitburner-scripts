//import moment from "./vendor/moment.min.js"

/**
 * @typedef {number} Channel
 * @typedef {Channel} SenderChannel
 * @typedef {Channel} ReceiverChannel
 * @typedef {number} LogLevel
 * @global
 */
export const config = {
    logging: {
        level: 1,
        /**
         * @enum {LogLevel} Logging level
         */
        levels: Object.freeze({
            TRACE: 0,
            DEBUG: 1,
            INFO: 2,
            WARN: 3,
            ERROR: 4,
            HELP: 5,
        }),
    },
    git_pull: [
        ["github", "puttehi"],
        ["repository", "bitburner-scripts"],
        ["branch", "BN1"],
        ["download", []],
        ["new-file", []],
        ["subfolder", ""],
        ["extension", [".js", ".ns", ".txt", ".script"]],
        ["omit-folder", ["/tmp/", "/trash/"]],
    ],
    io: {
        channels: {
            /**
             * @enum {SenderChannel} Ports to be written to only by the sender (send to receiver)
             */
            sender: Object.freeze({
                SEND_GWH_MAIN: 0, // Grow, Weaken, Hack - main channel
                SEND_GWH_DEADLETTER: 1, // Grow, Weaken, Hack - deadletter channel where messages go to storage until getting destroyed
                SEND_GWH_COPY: 2, // Grow, Weaken, Hack - copy channel for additional non-critical services
            }),
            /**
             * @enum {ReceiverChannel} Ports to be written to only by the receiver (send back to sender)
             */
            receiver: Object.freeze({
                RECV_GWH_MAIN: 3, // Grow, Weaken, Hack - main channel
                RECV_GWH_DEADLETTER: 4, // Grow, Weaken, Hack - deadletter channel where messages go to storage until getting destroyed
                RECV_GWH_COPY: 5,
            }), // Grow, Weaken, Hack - copy channel for additional non-critical services
        },
        timestamp_format: "YYYY-MM-DD HH:mm:ss:SSSSSSSSS", // https://momentjs.com/docs/#/parsing/string-format/
    },
    libs: [
        "/vendor/moment.min.js",
        "common.js",
        "config.js",
        "ports.js",
        "/testing/hack_receiver.js",
        "/testing/hack_sender.js",
    ],
}
