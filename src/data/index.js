const fs = require("fs");
const LineByLineReader = require("line-by-line");
const csv = require("csv-parser");
const xml = require("./xml");
const { writeFile } = require("./utils");

const PLUTO_DATA = "./data/pluto/";
const PAD_DATA = "./data/pad/bobaadr.txt";
const OUT_DATA = "./data/json/";

// updateBIN();

// https://www1.nyc.gov/site/planning/data-maps/open-data/dwn-pluto-mappluto.page
function updatePLUTO(binByAddress) {
	fs.readdir(
		PLUTO_DATA,
		(err, files) => {
			if (err) {
				throw err;
			}
			files.slice(0, 1).forEach(file => {
				const binByAddress = {};

				fs
					.createReadStream(`${PLUTO_DATA}${file}`)
					.pipe(csv())
					.on("data", data => {
						console.log(data);
					})
					.on("end", () => {
						writeFile(binByAddress, `${OUT_DATA}binByAddress.json`);
					})
					.on("error", err => console.log(err));
			});
		},
		err => console.log(err)
	);
}

// https://data.cityofnewyork.us/City-Government/Property-Address-Directory/bc8t-ecyu
function updatePAD(binByAddress) {
	lr = new LineByLineReader(BIN_DATA);
	lr.on("line", line => {
		const [
			boro,
			block,
			lot,
			bin,
			lhnd,
			lhns,
			lcontpar,
			lsos,
			hhnd,
			hhns,
			hcontpar,
			hsos,
			scboro,
			sc5,
			sclgc,
			stname,
			addrtype,
			realb7sc,
			validlgcs,
			dapsflag,
			naubflag,
			parity,
			b10sc,
			segid,
			zipcode,
			physical_id
		] = line.split(",").map(str =>
			str
				.replace(/\s+/g, " ")
				.replace(/"/g, "")
				.trim()
		);
		const lotInt = parseInt(lot, 10);
		const address = `${lotInt} ${stname}`;
		binByAddress[address] = bin;
	});
	lr.on("end", () => writeFile(binByAddress, `${OUT_DATA}binByAddress.json`));
	lr.on("error", err => console.log(err));
}

function updateGML() {
	const dataByBIN = {};
	let count = 0;

	fs.readdir(
		GML_DATA,
		(err, files) => {
			files.forEach(file => {
				const reader = xml.createReader(
					`${GML_DATA}${file}`,
					/Building/
				);

				reader.on("record", handleRecord);
				reader.on("end", () =>
					writeFile(dataByBIN, `${OUT_DATA}dataByBIN.json`)
				);
				reader.on("error", error => console.log(error));
			});
		},
		err => console.log(err)
	);

	function handleRecord(record) {
		const data = {};
		record.children.forEach(child => handleChild(child, data));
		dataByBIN[data.bin] = data;

		if (++count % 100 === 0) {
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(`🏨 Processed ${count} buildings.`);
		}
	}

	function handleChild(child, data) {
		let bin, lowerCorner, upperCorner, height;

		switch (child.tag) {
			case "gen:stringAttribute":
				if (child.attrs.name === "BIN") {
					bin = child.children[0].text;
					data.bin = bin;
				}
				break;
			case "bldg:boundedBy":
				const roofSurface = getDescendantWithTag(
					child,
					"bldg:RoofSurface"
				);
				if (roofSurface) {
					const posList = getDescendantWithTag(
						roofSurface,
						"gml:posList"
					);
					data.posList = posList.text;
				}
				break;
		}
	}

	function getDescendantWithTag(record, tag) {
		if (!record.children) {
			return null;
		}

		for (var i = 0; i < record.children.length; i++) {
			const child = record.children[i];
			if (child.tag === tag) return child;
			const matchingDescendant = getDescendantWithTag(child, tag);
			if (matchingDescendant) return matchingDescendant;
		}
	}
}
