const restify = require("restify");
const { hasLOS, loadBuildingData } = require("../los");

var server;
startServer();

async function startServer() {
	await loadBuildingData();
	server = restify.createServer();
	server.use(restify.plugins.queryParser());
	server.get("/los", handleLos);
	server.listen(8080, function() {
		console.log("%s listening at %s", server.name, server.url);
	});
}

async function handleLos(req, res, next) {
	const { boro1, houseno1, street1, boro2, houseno2, street2 } = req.query;
	const address1 = {
		boro: boro1,
		houseno: houseno1,
		street: street1
	};
	const address2 = {
		boro: boro2,
		houseno: houseno2,
		street: street2
	};

	try {
		const los = await hasLOS(address1, address2);
		res.send({ los });
		next();
	} catch (err) {
		console.log(err);
		res.send(500, { err });
		next();
	}
}
