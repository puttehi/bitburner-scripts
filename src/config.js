export const config = {
    config: {
        logging: {
            level: 1,
            levels: Object.freeze({
                TRACE: 0,
                DEBUG: 1,
                INFO: 2,
                WARN: 3,
                ERROR: 4,
            }),
        },
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
}
