import { Client } from "pg";

export async function handler(event, context) {
	// https://github.com/brianc/node-postgres/issues/930#issuecomment-230362178
	context.callbackWaitsForEmptyEventLoop = false;

	const { queryStringParameters } = event;
	const { bin1, bin2 } = queryStringParameters;

	if (!bin1 || !bin2) {
		return {
			statusCode: 400,
			body: JSON.stringify({
				error: "Missing params"
			})
		};
	}

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

	try {
		const midpoint1 = await getBuildingMidpoint(bin1);
		const midpoint2 = await getBuildingMidpoint(bin2);
		const height1 = await getBuildingHeight(bin1);
		const height2 = await getBuildingHeight(bin2);
		const distance = await getDistance(midpoint1, midpoint2);
		const intersections = await getIntersections(
			midpoint1,
			height1,
			midpoint2,
			height2
		);

		await client.end();
		return {
			statusCode: 200,
			body: JSON.stringify({
				distance,
				intersections
			})
		};
	} catch (error) {
		console.log(error);
		await client.end();
		return {
			statusCode: 500,
			body: JSON.stringify({
				error
			})
		};
	}

	async function getBuildingMidpoint(bin) {
		const text =
			"SELECT ST_AsText(ST_Centroid((SELECT geom FROM ny WHERE bldg_bin = $1)))";
		const values = [bin];
		const res = await client.query(text, values);
		if (!res.rows.length) throw `Could not find building data for ${bin}`;
		const { st_astext } = res.rows[0];
		if (!st_astext) throw `Could not find building data for ${bin}`;
		return st_astext.replace("POINT(", "").replace(")", ""); // Do this better
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
		const [x1, y1] = point1.split(" ");
		const [x2, y2] = point2.split(" ");
		const text = `SELECT ST_Distance(
			'POINT (${x1} ${y1})'::geometry,
			'POINT (${x2} ${y2})'::geometry
		);`;
		const res = await client.query(text);
		if (!res.rows.length) throw "Failed to calculate distance";
		const { st_distance } = res.rows[0];
		return st_distance;
	}

	async function getIntersections(midpoint1, height1, midpoint2, height2) {
		const [x1, y1] = midpoint1.split(" ");
		const [x2, y2] = midpoint2.split(" ");
		const text = `SELECT a.bldg_bin FROM ny AS a WHERE ST_3DIntersects(a.geom, ST_SetSRID('LINESTRINGZ (${x1} ${y1} ${height1}, ${x2} ${y2} ${height2})'::geometry, 2263)) LIMIT 10`;
		const res = await client.query(text);
		if (!res.rows)
			throw `Could not find intersections for ${bin1} <-> ${bin2}`;
		return res.rows
			.map(row => row.bldg_bin)
			.filter(bin => bin !== bin1 && bin !== bin2);
	}
}
