import pg from "pg";
import targets from "../targets";

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
		for (var i = 0; i < targets.length; i++) {
			const target = targets[i];
			const targetMidpoint = await getBuildingMidpoint(target.bin);
			const distance = await getDistance(point, targetMidpoint);
			if (distance < radius) {
				hubsInRange.push({ ...target, distance });
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