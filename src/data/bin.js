const fetch = require("node-fetch");
const qs = require("qs");

const BASE_URL =
	"http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet";

// TODO: Get rest of codes
const boroCodes = {
	manhattan: 1,
	brooklyn: -1,
	bronx: -1,
	queens: -1,
	si: -1
};

const cache = {};

function cachedBIN(address) {
	return cache[JSON.stringify(address)];
}

async function fetchBIN(address) {
	const { boro, houseno, street } = address;
	const params = qs.stringify({ boro, houseno, street });
	const URL = `${BASE_URL}?${params}`;
	return fetch(URL)
		.then(res => res.text())
		.then(text => {
			const bin = parseBin(text);
			cache[JSON.stringify(address)] = bin;
			return bin;
		})
		.catch(err => console.log(err));

	// Hacky parser
	function parseBin(text) {
		const binMatch = text.match(/BIN#(&nbsp;)*(\d+)/);
		if (!binMatch) throw `Error fetching ${houseno} ${street}.`;
		return binMatch[0].replace(/&nbsp;/g, "").replace("BIN#", "");
	}
}

module.exports = { cachedBIN, fetchBIN };
