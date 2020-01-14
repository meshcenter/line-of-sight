import React, { useState, useEffect } from "react";
import DocumentTitle from "react-document-title";
import { Link } from "react-router-dom";
import qs from "qs";
import AddressInput from "./AddressInput";
import MapView from "./MapView";
import { icons } from "./NodeName";

export default function Search(props) {
	const queryString = props.location.search.replace("?", "");
	const { address, bin, lat, lng } = qs.parse(queryString);
	const [results, setResults] = useState();
	const [showPlanned, setShowPlanned] = useState(false);

	useEffect(() => {
		if (!address || !bin) {
			setResults();
			setShowPlanned(false);
			return;
		}
		async function fetchLos() {
			setResults();
			const results = await (await fetch(
				`${process.env.REACT_APP_API_ROOT}/v1/los?bin=${bin}`
			)).json();
			setResults(results);
		}
		fetchLos();
	}, [address, bin]);

	const onSelect = ({ address, bin, lat, lng }) => {
		const query = qs.stringify({
			address,
			bin,
			lat,
			lng
		});
		props.history.push(`/search?${query}`);
	};

	const nodeFromRequest = request => ({
		...request,
		name: (request.address || "").split(",")[0],
		status: "planned",
		devices: [
			{
				id: request.id,
				type: {
					id: -1,
					name: "Planned",
					manufacturer: null,
					radius: 0,
					width: 0
				},
				lat: parseFloat(request.lat),
				lng: parseFloat(request.lng),
				alt: parseFloat(request.alt),
				azimuth: 0,
				status: "active"
			}
		]
	});

	const title = address ? `${address} - Line of Sight` : "Line of Sight";

	const { visibleSectors = [], visibleOmnis = [], visibleRequests = [] } =
		results || {};

	const losNodes = results
		? [
				...visibleSectors,
				...visibleOmnis,
				...(showPlanned ? visibleRequests.map(nodeFromRequest) : [])
		  ].filter(
				node =>
					node.devices.filter(
						device => device.type.name !== "Unknown"
					).length
		  )
		: [];

	return (
		<DocumentTitle title={title}>
			<div className="flex-l flex-column h-100">
				<Header address={address} onSelect={onSelect} />
				<div className="flex flex-row-reverse-l flex-column w-100 h-100-l overflow-y-hidden">
					<Map
						lat={lat}
						lng={lng}
						address={address}
						losNodes={losNodes}
						results={results}
					/>
					<div className="br-l b--light-gray w-100 mw5-5-l overflow-y-scroll-l flex flex-column justify-between">
						<div>
							<Info address={address} />
							<BuildingInfo address={address} results={results} />
							<List
								results={results}
								losNodes={losNodes}
								visibleRequests={visibleRequests}
								showPlanned={showPlanned}
								setShowPlanned={setShowPlanned}
							/>
						</div>
						<Links
							lat={lat}
							lng={lng}
							address={address}
							results={results}
						/>
					</div>
				</div>
			</div>
		</DocumentTitle>
	);
}

function Header({ address, onSelect }) {
	return (
		<div className="flex items-center justify-between pv2 pr3 bb b--light-gray">
			<div className="w-100-l mw5-5-l ph3 ">
				<div className="flex items-center justify-start">
					<Link to="/" className="link black">
						<span className=" fw5 nowrap flex items-center">
							<span
								className="f4"
								role="img"
								aria-label="telescope emoji"
							>
								🔭
							</span>
						</span>
					</Link>
				</div>
			</div>
			<AddressInput defaultAddress={address} onSelect={onSelect} />
		</div>
	);
}

function List({
	losNodes,
	visibleRequests,
	showPlanned,
	setShowPlanned,
	results
}) {
	if (results && results.error) {
		let message = results.error;
		if (
			message ===
			"more than one row returned by a subquery used as an expression"
		) {
			message = "Building data not found.";
		}
		return (
			<div className="mt3 pa3 mh3 ba b--light-gray bg-washed-yellow br2 flex flex-column">
				<div className="fw6 mv0 flex items-center">
					<span
						className="f4 mr2"
						role="img"
						aria-label="disappointed emoji"
					>
						⚠️
					</span>
					<span>Error</span>
				</div>
				<p className="mid-gray mb0 mt2 lh-copy">{message}</p>
			</div>
		);
	}

	if (results && !losNodes.length)
		return (
			<div className="pa3 mh3 ba b--light-gray bg-washed-yellow br2 flex flex-column">
				<div className="fw5 f5 mv0 flex items-center">
					<span
						className="f4 mr2"
						role="img"
						aria-label="disappointed emoji"
					>
						😞
					</span>
					<span>No line of sight</span>
				</div>
				<p className="mid-gray mb0 mt2 lh-copy">
					There are no nearby visible nodes.
				</p>
			</div>
		);
	return (
		<div>
			<ul className="list ma0 pa0">
				{losNodes
					.filter(node => node.type !== "los")
					.sort((a, b) => a.distance - b.distance)
					.map(node => {
						const nonUnknown = node.devices.filter(
							d => d.type.name !== "Unknown"
						);
						const device = nonUnknown[0] ||
							node.devices[0] || { type: {} };
						return (
							<NodeRow
								key={`${node.id}-${device.type.name}-${device.type.id}`}
								node={node}
								device={device}
							/>
						);
					})}
			</ul>

			{visibleRequests.length ? (
				<div className="ma3 flex items-center">
					<button
						className="gray pointer bn pa0 f6"
						onClick={() => setShowPlanned(!showPlanned)}
						style={{ outline: "none" }}
					>
						{showPlanned
							? "Hide planned"
							: `Show planned (${visibleRequests.length})`}
					</button>
				</div>
			) : null}
		</div>
	);

	function NodeRow({ node, device }) {
		return (
			<li className="bb b--light-gray pv2 pointer ph3 flex items-start justify-between">
				<div className="flex items-center mr4">
					<div className="mr3 flex items-center justify-center">
						{node.status === "planned"
							? icons.potential
							: icons.omni}
					</div>
					<div>
						<div className="flex items-center">
							<span className="f6 black">
								{node.name || `Node ${node.id}`}
							</span>
						</div>
						<div className="mt1">
							<span className="mid-gray db f6 nowrap">
								{`${parseFloat(node.distance / 1000).toFixed(
									1
								)}km`}
							</span>
						</div>
					</div>
				</div>
				<div>
					<span className="f7 black-50 bg-near-white ph1 pv05 br1">
						{device.type.name}
					</span>
				</div>
			</li>
		);
	}
}

function Map({ lat, lng, address, losNodes, results }) {
	const mapNodes = [...losNodes];
	if (address && lat && lng) {
		mapNodes.push({
			id: address.split(",")[0],
			lat: parseFloat(lat),
			lng: parseFloat(lng),
			devices: [{ lat, lng, type: {} }],
			status: "los"
		});
	}

	const mapLinks = [];
	mapLinks.push(
		...losNodes.map((losNode, index) => ({
			id: losNode.id,
			status: "los",
			nodes: [
				{
					id: `${losNode.id}-${index}`
				},
				losNode
			],
			devices: [
				{
					id: losNode.id + "fake",
					lat: parseFloat(lat),
					lng: parseFloat(lng),
					alt: 100,
					device_type_id: 1,
					type: {
						id: 1,
						name: "Omni",
						manufacturer: null,
						radius: 0,
						width: 360
					}
				},
				losNode.devices[0]
			]
		}))
	);

	return (
		<div className="h-100-l h5 w-100 relative">
			<MapView nodes={mapNodes} links={mapLinks} loading={!results} />
		</div>
	);
}

function BuildingInfo({ address, results }) {
	if (!results || results.error) return null;

	return (
		<div className="pa3 br2 flex flex-column">
			<div className="f5 fw5 pb2 flex items-center">
				<h1 className="f5 fw5 lh-title mv0">{address}</h1>
			</div>
			<div className="mv0 flex items-center justify-between mid-gray f5">
				<span>{results.buildingHeight}m</span>
			</div>
		</div>
	);
}

function Links({ lat, lng, address, results }) {
	if (!address) return null;
	const earthURL = `https://earth.google.com/web/search/${address
		.split(" ")
		.map(encodeURIComponent)
		.join("+")}/@${lat},${lng},${(results || {}).buildingHeight / 3.32 ||
		100}a,300d,35y,0.6h,65t,0r`;
	return (
		<div>
			{results && lat && lng ? (
				<div className="ma3">
					<a
						target="_"
						className="blue link nowrap f6"
						href={earthURL}
					>
						View Earth →
					</a>
				</div>
			) : null}
		</div>
	);
}

function Info({ address }) {
	if (address) return null;
	return (
		<div className="pa3">
			<h1 className="f4 fw7 mt0 mb3 lh-title">
				Check for line of sight to nearby nodes
			</h1>
			<p className="lh-copy mid-gray">
				This tool uses the{" "}
				<a
					target="_"
					className="dark-blue no-underline"
					href="https://www1.nyc.gov/site/doitt/initiatives/3d-building.page"
				>
					NYC 3D Building Model
				</a>{" "}
				to check if your roof can connect to nearby nodes. Results are
				not 100% accurate!
			</p>
		</div>
	);
}
