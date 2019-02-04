const fs = require("fs-extra");
const xml = require("./xml");
const { writeFile } = require("../utils");

const GML_DATA_PATH = "./data/citygml/";
const GML_JSON_FILE_PATH = "./data/buildingData.json";
const GML_CSV_FILE_PATH = "./data/buildingData.csv";

const buildingRoofs = {};

updateGML();

async function updateGML() {
	let count = 0;

	await fs.remove(GML_CSV_FILE_PATH);
	await fs.outputFile(GML_CSV_FILE_PATH, "bin,x,y,z\n");

	fs.readdir(GML_DATA_PATH, handleFiles, err => console.log(err));

	function handleFiles(err, files) {
		files.forEach(file => {
			const reader = xml.createReader(
				`${GML_DATA_PATH}${file}`,
				/Building/
			);
			reader.on("record", handleRecord);
			reader.on("error", error => console.log(error));
		});
	}

	async function handleRecord(record) {
		const buildingData = {};

		// Recurse into children to extract the data we care about
		record.children.forEach(child => handleChild(child, buildingData));

		buildingRoofs[buildingData.bin] = buildingData;

		// Append to csv
		const { bin, midRoofPoint } = buildingData;
		if (midRoofPoint) {
			const { x, y, z } = midRoofPoint;
			const line = `${[bin, x, y, z].map(i => `${i}`)}\n`;
			fs.appendFileSync(GML_CSV_FILE_PATH, line);
		} else {
			console.log(bin, "missing midRoofPoint");
		}

		// Write json to individual file
		// await fs.outputJSON(
		// `${GML_JSON_DATA_PATH}${buildingData.bin}.json`,
		// buildingData
		// );

		if (++count % 1000 === 0) {
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(`🏨 Processed ${count} buildings.`);
		}

		// if (count % 10000 === 0) {
		// 	// Write json of all building data
		// 	await fs.outputJSON(GML_JSON_FILE_PATH, buildingRoofs);
		// }
	}

	function handleChild(child, data) {
		let bin, lowerCorner, upperCorner, height;

		switch (child.tag) {
			case "gen:stringAttribute":
				if (child.attrs.name === "BIN" && child.children[0]) {
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
					data.midRoofPoint = midRoofPoint(posList.text);
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

	function midRoofPoint(roofSurface) {
		let maxX = 0,
			minX = Number.MAX_VALUE,
			maxY = 0,
			minY = Number.MAX_VALUE,
			maxZ = 0;

		roofSurface.split(" ").forEach((point, index) => {
			// X?
			if ((index + 1) % 3 === 1) {
				maxX = Math.max(maxX, point);
				minX = Math.min(minX, point);
			}

			// Y?
			if ((index + 1) % 3 === 2) {
				maxY = Math.max(maxY, point);
				minY = Math.min(minY, point);
			}

			// Z
			if ((index + 1) % 3 === 0) {
				maxZ = Math.max(maxZ, point);
			}
		});

		const midX = midPoint(minX, maxX);
		const midY = midPoint(minY, maxY);

		return { x: parseInt(midX), y: parseInt(midY), z: parseInt(maxZ) };
	}

	function midPoint(a, b) {
		const diff = Math.abs(a - b);
		const min = Math.min(a, b);
		return min + diff / 2;
	}
}
