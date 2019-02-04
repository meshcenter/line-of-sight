const fs = require("fs");

function readFiles(dirname, onFilenames, onError) {
	fs.readdir(dirname, function(err, filenames) {
		if (err) {
			onError(err);
			return;
		}
		onFilenames(filenames);
	});
}

function writeFile(data, path, spaces = 2) {
	if (!path || !data) {
		throw "Missing path or data.";
	}

	if (typeof data === "object") {
		fs.writeFile(path, JSON.stringify(data, null, spaces), function(err) {
			if (err) console.error("Error writing to " + path, err);
		});
	} else {
		fs.writeFile(path, data, function(err) {
			if (err) console.error("Error writing to " + path, err);
		});
	}
}

module.exports = {
	writeFile
};
