import { Client } from "pg";
import targets from "../targets";

export async function handler(event, context) {
	const { queryStringParameters } = event;
	const { bin } = queryStringParameters;

	const client = new Client({
		host: process.env.DB_HOST,
		database: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		port: process.env.DB_PORT,
		ssl: {
			mode: "require"
		}
	});

	try {
		await client.connect();
	} catch (err) {
		console.log(err);
		await client.end();
		return {
			statusCode: 500,
			body: JSON.stringify({
				error: "Failed to connect to db"
			})
		};
	}

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
				visibleHubs
			},
			null,
			2
		)
	};

	async function getBuildingMidpoint(bin) {
		const text =
			"SELECT ST_AsText(ST_Centroid((SELECT geom FROM ny WHERE bldg_bin = $1)))";
		const values = [bin];
		const res = await client.query(text, values);
		if (!res.rows.length) throw `Could not find building data for ${bin}`;
		const { st_astext } = res.rows[0];
		if (!st_astext) throw `Could not find building data for ${bin}`;
		const rawText = st_astext.replace("POINT(", "").replace(")", ""); // Do this better
		const [lat, lng] = rawText.split(" ");
		return [parseFloat(lat), parseFloat(lng)];
	}

	async function getBuildingHeight(bin) {
		const text =
			"SELECT ST_ZMax((SELECT geom FROM ny WHERE bldg_bin = $1))";
		const values = [bin];
		const res = await client.query(text, values);
		if (!res.rows.length) throw `Could not find building data for ${bin}`;
		const { st_zmax } = res.rows[0];
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
		const res = await client.query(text);
		if (!res.rows.length) throw "Failed to calculate distance";
		const { st_distance } = res.rows[0];
		return st_distance;
	}

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
		const res = await client.query(text);
		if (!res.rows) throw "Failed to get intersections";
		return res.rows;
	}
}
