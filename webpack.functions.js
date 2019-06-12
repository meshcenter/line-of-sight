const path = require("path");

module.exports = {
	resolve: {
		alias: {
			"pg-native": path.join(__dirname, "aliases/pg-native.js"),
			pgpass$: path.join(__dirname, "aliases/pgpass.js")
		}
	}
};
