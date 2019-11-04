import pg from "pg";
const hubs = [
	{ id: 3, name: "Brian", bin: 3122755 },
	{ id: 303, name: "Dekalb", bin: 3325497 },
	{ id: 329, name: "Simona", bin: 3070130 },
	{ id: 363, bin: 1012854 },
	{ id: 407, name: "Henry hub", bin: 1087057 },
	{ id: 659, bin: 1004045 },
	{ id: 664, name: "Cypress", bin: 4548430 },
	{ id: 731, name: "7th St Hub Alphabet City", bin: 1086499 },
	{ id: 944, name: "Flo", bin: 3057781 },
	{ id: 1126, bin: 2051270 },
	{ id: 1147, bin: 1006456 },
	{ id: 1340, name: "Saratoga", bin: 3039983 },
	{ id: 1350, name: "Ehud", bin: 3050714 },
	{ id: 1384, name: "Alex", bin: 1083419 },
	{ id: 1417, name: "Soft Surplus", bin: 3319903 },
	{ id: 1515, name: "Domino", bin: 3335796 },
	{ id: 1567, name: "Pierre", bin: 1006327 },
	{ id: 1896, bin: 1059774 },
	{ id: 1971, name: "Two Bridges", bin: 3001646 },
	{ id: 2090, name: "Guernsey hub", bin: 3065507 },
	{ id: 2463, name: "Rivington Hotel", bin: 1075676 },
	{ id: 2646, bin: 3052348 },
	{ id: 2743, bin: 4082193 },
	{ id: 2874, bin: 3045578 },
	{ id: 2932, name: "RiseBoro Youth Center", bin: 3387654 },
	{ id: 2950, name: "Ave D", bin: 1004447 },
	{ id: 2959, bin: 3045585 },
	{ id: 3085, bin: 3073369 },
	{ id: 3244, bin: 3065067 },
	{ id: 3461, name: "Prospect Heights (PH)", bin: 3029628 },
	{ id: 3662, bin: 3045876 },
	{ id: 3716, bin: 3064719 },
	{ id: 3946, name: "YWCA", bin: 3000753 },
	{ id: 4402, bin: 3115969 },
	{ id: 4431, bin: 3045315 },
	{ id: 4459, bin: 3115843 },
	{ id: 4507, bin: 3115952 },
	{ id: 4530, bin: 3116000 }
];

export async function handler(event, context) {
	const { queryStringParameters } = event;
	const { bin } = queryStringParameters;

	const buildingMidpoint = await getBuildingMidpoint(bin);
	const buildingHeight = await getBuildingHeight(bin);
	const hubsInRange = await getHubsInRange(buildingMidpoint);

	const visibleHubs = [];
	for (var i = 0; i < hubsInRange.length; i++) {
		const hub = hubsInRange[i];
		const hubMidpoint = await getBuildingMidpoint(hub.bin);
		const hubHeight = await getBuildingHeight(hub.bin);
		const intersections = await getIntersections(
			buildingMidpoint,
			buildingHeight,
			hubMidpoint,
			hubHeight
		);
		if (!intersections.length) {
			visibleHubs.push(hub);
		}
	}

	return {
		statusCode: 200,
		body: JSON.stringify(
			{
				hubsInRange,
				visibleHubs,
				buildingHeight
			},
			null,
			2
		)
	};

	async function getBuildingMidpoint(bin) {
		const text =
			"SELECT ST_AsText(ST_Centroid((SELECT geom FROM ny WHERE bldg_bin = $1)))";
		const values = [bin];
		const res = await performQuery(text, values);
		if (!res.length) throw `Could not find building data for ${bin}`;
		const { st_astext } = res[0];
		if (!st_astext) throw `Could not find building data for ${bin}`;
		const rawText = st_astext.replace("POINT(", "").replace(")", ""); // Do this better
		const [lat, lng] = rawText.split(" ");
		return [parseFloat(lat), parseFloat(lng)];
	}

	async function getBuildingHeight(bin) {
		const text =
			"SELECT ST_ZMax((SELECT geom FROM ny WHERE bldg_bin = $1))";
		const values = [bin];
		const res = await performQuery(text, values);
		if (!res.length) throw `Could not find building data for ${bin}`;
		const { st_zmax } = res[0];
		const offset = 4;
		return parseInt(st_zmax) + offset;
	}

	async function getDistance(point1, point2) {
		const [x1, y1] = point1;
		const [x2, y2] = point2;
		const text = `SELECT ST_Distance(
			'POINT (${x1} ${y1})'::geometry,
			'POINT (${x2} ${y2})'::geometry
		);`;
		const res = await performQuery(text);
		if (!res.length) throw "Failed to calculate distance";
		const { st_distance } = res[0];
		return st_distance;
	}

	// TODO: Get nearby hubs using postgis query
	// like select all nodes where type = hub and distance < 2 miles
	async function getHubsInRange(point) {
		const [lat, lng] = point;
		const radius = 2 * 5280; // Miles
		const hubsInRange = [];
		for (var i = 0; i < hubs.length; i++) {
			const hub = hubs[i];
			const hubMidpoint = await getBuildingMidpoint(hub.bin);
			const distance = await getDistance(point, hubMidpoint);
			if (distance < radius) {
				hubsInRange.push({ ...hub, distance });
			}
		}

		return hubsInRange;
	}

	async function getIntersections(midpoint1, height1, midpoint2, height2) {
		const [x1, y1] = midpoint1;
		const [x2, y2] = midpoint2;
		const text = `SELECT a.bldg_bin FROM ny AS a WHERE ST_3DIntersects(a.geom, ST_SetSRID('LINESTRINGZ (${x1} ${y1} ${height1}, ${x2} ${y2} ${height2})'::geometry, 2263)) LIMIT 10`;
		const res = await performQuery(text);
		if (!res) throw "Failed to get intersections";
		return res;
	}
}

let pgPool;

async function createPool() {
	pgPool = new pg.Pool({
		host: process.env.DB_HOST,
		database: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		port: process.env.DB_PORT,
		ssl: {
			mode: "require"
		}
	});
}

async function performQuery(text, values) {
	if (!pgPool) await createPool();
	const client = await pgPool.connect();
	const result = await client.query(text, values);
	client.release();
	return result.rows;
}
