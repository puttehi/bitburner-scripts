import { LL, log } from "common"

const DIVIDER = "*─────────────────────────────*"

/**
 * @param {NS} ns NetScript namespace
 */
export async function main(ns) {
    //const stringifiedJson = ns.args[0]

    //const asJson = JSON.parse(stringifiedJson)

    const asJson = {
        message: "Something went wrong",
        logLevel: "DEBUG",
        timestamp: "1985-01-01 06:90:71551769420",
        meta: {
            script: "123.js",
            threads: 256,
        },
        exec_meta: {
            target: "joesguns",
        },
        stats_meta: {
            wgh: {
                targets: {
                    joesguns: {
                        weaken: "1234",
                        hack: "123456789234234",
                        grow: "12567891123124",
                    },
                    "iron-gym": {
                        weaken: "123456",
                        hack: "123456789234234",
                        grow: "1234891123124",
                    },
                },
            },
            ports: {
                send_backs: 230,
                send_successes: 3495,
                recv_successes: 201,
                time_congestioned: 235.14,
            },
        },
    }

    //const str = DIVIDER + "\n" + (await tree(ns, asJson)) + DIVIDER
    const str = await tree(ns, asJson)

    ns.tprint("\n" + str)

    return 0
}

function isObject(value) {
    return !!(value && typeof value === "object" && !Array.isArray(value))
}

export async function tree(ns, obj, accum = "", indent = 0, leftPad = 1) {
    if (!isObject(obj)) return accum

    const vertical = "│"
    const horizontal = "──"
    const connection = "├─"
    //const connection = "."
    const corner = "└─"

    //│   ├──

    accum += "\n"

    let outer = 0
    let inner = 0

    const padLeft = " ".repeat(leftPad)

    const countKeys = Object.keys(obj).length

    //accum += DIVIDER

    for (const [k, v] of Object.entries(obj)) {
        inner = 0
        //await log(ns, `${k}: ${v} (${indent}: ${outer} | ${inner})`, LL.DEBUG)
        // Accum key
        //accum += padLeft + connection + horizontal.repeat(padding) + ` ${k}\n`
        accum +=
            padLeft +
            //`${outer} | ${inner}` +
            connection +
            horizontal.repeat(indent) +
            ` ${k}`
        indent += 2
        if (isObject(v)) {
            // Going deeper, accum results
            //accum += await tree(ns, v, accum, padding)
            accum = "\n" + (await tree(ns, v, accum, indent))
            inner += 1
        } else {
            // Reached end, add value
            //padding += 2
            // const con =
            //     `${outer} | ${inner}` + outer + 1 >= countKeys
            //         ? corner
            //         : connection
            // accum += padLeft + con + horizontal.repeat(padding) + ` ${v}\n`
            accum += `: ${v}\n`
        }
        //accum += "\n"
        indent = Math.max(indent - 2, 0)
        outer += 1
    }

    return accum
}
