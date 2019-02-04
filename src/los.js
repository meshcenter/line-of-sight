const fs = require("fs-extra");
const { cachedBIN, fetchBIN } = require("./data/bin");

const Z_THRESHOLD = 0; // how many feet below path to check for intersections

let allBuildingData = {},
	buildings = [];

async function loadBuildingData() {
	console.log("🏙  Loading building data...");
	allBuildingData = await fs.readJSON("./data/buildingData.json");
	console.log("🌆  Loaded bulding data");
	buildings = Object.values(allBuildingData);
}

async function hasLOS(address1, address2) {
	const building1 = await getBuildingData(address1);
	const building2 = await getBuildingData(address2);
	const intersections = getIntersections(building1, building2);
	return { building1, building2, intersections };
}

// BIN -> 3-D Model
async function getBuildingData(address) {
	console.log(`Fetching BIN for ${JSON.stringify(address)}...`);
	const bin = cachedBIN(address) || (await fetchBIN(address));
	if (!bin) return;
	const data = allBuildingData[bin];
	return { bin, ...data };
}

// Check for intersection of path and buildings along LoS
// Bonus: model fresnel zones
function getIntersections(buildingData1, buildingData2) {
	console.log("Calculating intersections...");
	const intersections = [];
	const path = getPath(buildingData1, buildingData2);

	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	process.stdout.write(`🏨 Processed ${0}/${buildings.length} buildings.`);
	buildings.forEach((building, index) => {
		console.log(building);
		const { midRoofPoint } = building;
		const { distance, zDiff } = distanceToPath(midRoofPoint, path);
		const intersectsPath = distance < range;
		const obstructsPath = zDiff > Z_THRESHOLD;
		if (!intersectsPath) return;
		// console.log(building, { distance, zDiff });
		if (obstructsPath) {
			intersections.push(building);
		}
		if (index % 1000 === 0) {
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(
				`🏨 Processed ${index}/${buildings.length} buildings.`
			);
		}
	});

	return intersections;
}

// Create path from roof to roof.
function getPath(startBuildingData, endBuildingData) {
	const startPoint = startBuildingData.midRoofPoint;
	const endPoint = endBuildingData.midRoofPoint;
	const distance = distance2d(startPoint, endPoint);
	return { startPoint, endPoint, distance };
}

// Util functions
function distanceToPath(point, path) {
	// const pointOnPathAtZ = pointAtZ(path, point.z);
	const closestPoint = closestPointOnPath(path, point);
	const distance = distance2d(point, closestPoint);
	const zDiff = point.z - pointOnPathAtZ.z;
	return {
		distance,
		zDiff
	};
}

function closestPointOnPath(path, point) {
	const pathDeltaX = path.startPoint.x - path.endPoint.x;
	const pathDeltaY = path.startPoint.y - path.endPoint.y;
	const pathDeltaZ = path.startPoint.Z - path.endPoint.Z;
	const pathDistance2d = distance2d(path.startPoint, path.endPoint);
	const pathAngle = Math.atan(pathDeltaY / pathDeltaX) * 180 / Math.PI;
	const pathAngleZ = Math.atan(pathDeltaZ / pathDistance2d) * 180 / Math.PI;
}

// function pointAtZ(path, z) {
// 	const { startPoint, endPoint } = path;
// 	const { percent: zPercent } = rangeDiffPercent(z, startPoint.z, endPoint.z);

// 	// Interpolate z onto x and y
// 	const xRange = endPoint.x - startPoint.x;
// 	const yRange = endPoint.y - startPoint.y;
// 	const interpolatedX = startPoint.x + zPercent * xRange;
// 	const interpolatedY = startPoint.y + zPercent * yRange;

// 	return {
// 		x: interpolatedX,
// 		y: interpolatedY,
// 		z
// 	};
// }

function rangeDiffPercent(point, start, end) {
	const range = end - start;
	const diff = point - start;
	const percent = diff / range;
	return { range, diff, percent };
}

function midPoint(a, b) {
	const diff = Math.abs(a - b);
	const min = Math.min(a, b);
	return min + diff / 2;
}

// Pythagorean Theorem
function distance2d(pointA, pointB) {
	const xDiff = Math.abs(pointA.x - pointB.x);
	const yDiff = Math.abs(pointA.y - pointB.y);
	return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}

module.exports = {
	hasLOS,
	loadBuildingData
};
