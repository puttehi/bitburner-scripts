//import moment from "./vendor/moment.min.js"

export enum LogLevels {
    TRACE = 0,
    DEBUG,
    INFO,
    WARN,
    ERROR,
    HELP,
    SUCCESS,
}

export enum SenderChannels {
    SEND_GWH_MAIN = 1, // Grow, Weaken, Hack - main channel
    SEND_GWH_DEADLETTER = 2, // Grow, Weaken, Hack - deadletter channel where messages go to storage until getting destroyed
    SEND_GWH_COPY = 3, // Grow, Weaken, Hack - copy channel for additional non-critical services
}

export enum ReceiverChannels {
    RECV_GWH_MAIN = 4, // Grow, Weaken, Hack - main channel
    RECV_GWH_DEADLETTER = 5, // Grow, Weaken, Hack - deadletter channel where messages go to storage until getting destroyed
    RECV_GWH_COPY = 6,
}

export const config = {
    logging: {
        level: LogLevels.DEBUG,
        levels: LogLevels,
        // levels: ({ [val in LogLevel]: number } = {
        //     [LogLevel.TRACE]: val,
        //     [LogLevel.DEBUG]: val,
        //     [LogLevel.INFO]: val,
        //     [LogLevel.WARN]: val,
        //     [LogLevel.ERROR]: val,
        //     [LogLevel.HELP]: val,
        //     [LogLevel.SUCCESS]: val,
        // }),
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
            sender: SenderChannels,
            //({ [val in SenderChannel]: number } = {
            //    [SenderChannel.SEND_GWH_MAIN]: val,
            //    [SenderChannel.SEND_GWH_DEADLETTER]: val,
            //    [SenderChannel.SEND_GWH_COPY]: val,
            //}),
            receiver: ReceiverChannels,
            //({ [val in ReceiverChannel]: number } = {
            //    [ReceiverChannel.RECV_GWH_MAIN]: 4,
            //    [ReceiverChannel.RECV_GWH_DEADLETTER]: 5,
            //    [ReceiverChannel.RECV_GWH_COPY]: 6,
            //}),
        },
        timestamp_format: "YYYY-MM-DD HH:mm:ss:SSSSSSSSS", // https://momentjs.com/docs/#/parsing/string-format/
    },
    libs: [
        //"/vendor/moment.min.js",
        "common.js",
        "config.js",
        "ports.js",
        "/testing/hack_receiver.js",
        "/testing/hack_sender.js",
        "/testing/tree.js",
        "/testing/ps-hacker.js",
        "pubsub.js",
    ],
}
