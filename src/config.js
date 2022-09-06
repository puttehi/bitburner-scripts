export default config =
{
	"logging": {
		"level": DEBUG
	}
	"git-pull": [
    	["github", "puttehi"],
    	["repository", "bitburner-scripts"],
    	["branch", "BN1"],
    	["download", []],
    	["new-file", []],
    	["subfolder", ""],
    	["extension", [".js", ".ns", ".txt", ".script"]],
    	["omit-folder", ["/tmp/", "/trash/"]]
	]
}
