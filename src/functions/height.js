import { Client } from "pg";

export async function handler(event, context) {
	// https://github.com/brianc/node-postgres/issues/930#issuecomment-230362178
	context.callbackWaitsForEmptyEventLoop = false;

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

	try {
		const height = await getBuildingHeight(bin);

		await client.end();
		return {
			statusCode: 200,
			body: JSON.stringify({
				height
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

	async function getBuildingHeight(bin) {
		const text =
			"SELECT ST_ZMax((SELECT geom FROM ny WHERE bldg_bin = $1))";
		const values = [bin];
		const res = await client.query(text, values);
		if (!res.rows.length) throw `Could not find building data for ${bin}`;
		const { st_zmax } = res.rows[0];
		return parseInt(st_zmax);
	}
}
