import React, { useState, useEffect } from "react";
import DocumentTitle from "react-document-title";
import { Link } from "react-router-dom";
import qs from "qs";
import NodeName from "./NodeName";
import MapView from "./MapView";

export default function Search(props) {
	const queryString = props.location.search.replace("?", "");
	const { bin, address, lat, lng } = qs.parse(queryString);

	const [results, setResults] = useState();
	const [showPlanned, setShowPlanned] = useState(false);

	useEffect(() => {
		if (!address || !bin) return;
		async function fetchLos() {
			const results = await (await fetch(
				`${process.env.REACT_APP_API_ROOT}/v1/los?bin=${bin}`
			)).json();
			setResults(results);
		}
		fetchLos();
	}, [address, bin]);

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
					range: 0,
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
		<DocumentTitle title={`${address} - Line of Sight`}>
			<div className="flex-l flex-column h-100">
				{renderHeader()}
				<div className="flex flex-row-reverse-l flex-column w-100 h-100-l overflow-y-hidden">
					{renderMap()}
					<div className="br-l b--light-gray w-100 mw5-5-l overflow-y-scroll-l">
						{renderStatus()}
						{renderList()}
						{renderLinks()}
					</div>
				</div>
			</div>
		</DocumentTitle>
	);

	function renderHeader() {
		return (
			<div className="flex items-center justify-between pa3 bb b--light-gray flex-shrink-0">
				<h1 className="f4 fw6 mv0">{address}</h1>
			</div>
		);
	}

	function renderStatus() {
		if (!results) return null;
		if (!losNodes.length)
			return (
				<div className="pa3 br2 flex flex-column">
					<div className="fw6 mv0 flex items-center">
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
			<div className="pa3 flex flex-column">
				<div className="fw6 mv0 flex items-center">
					<span
						className="f4 mr2"
						role="img"
						aria-label="celebration emoji"
					>
						🎉
					</span>
					<span>Line of sight!</span>
				</div>
				<p className="mid-gray mb0 mt2 lh-copy">
					{`You can connect to ${losNodes.length} ${
						losNodes.length === 1 ? "node" : "nodes"
					}.`}
				</p>
			</div>
		);
	}

	function renderList() {
		return (
			<div>
				<ul className="list ma0 pa0">
					{losNodes
						.sort((a, b) => a.distance - b.distance)
						.map(node => {
							const nonUnknown = node.devices.filter(
								d => d.type.name !== "Unknown"
							);
							const device = nonUnknown[0] || node.devices[0];
							return (
								<li
									key={node.id}
									className="bb b--light-gray pv3 pointer ph3 flex items-center justify-between"
								>
									<NodeName node={node} />
									<div>
										<span className="mid-gray db f6 nowrap">
											{device.type.name} ·{" "}
											{parseFloat(
												node.distance / 1000
											).toFixed(1)}
											km
										</span>
									</div>
								</li>
							);
						})}
				</ul>
			</div>
		);
	}

	function renderLinks() {
		const earthURL = `https://earth.google.com/web/search/${address
			.split(" ")
			.map(encodeURIComponent)
			.join("+")}/@${lat},${lng},${(results || {}).buildingHeight /
			3.32 || 100}a,300d,35y,0.6h,65t,0r`;
		return (
			<div>
				{visibleRequests.length ? (
					<div className="ma3 flex items-center">
						<button
							className="gray pointer bn pa0"
							onClick={() => setShowPlanned(!showPlanned)}
							style={{ outline: "none" }}
						>
							{showPlanned ? "Hide planned" : "Show planned"}
						</button>
					</div>
				) : null}
				{results ? (
					<div className="ma3">
						<a
							target="_"
							className="blue link nowrap "
							href={earthURL}
						>
							View Earth →
						</a>
					</div>
				) : null}
				{results ? (
					<div className="ma3">
						<Link to="/" className="red link nowrap">
							Check another address →
						</Link>
					</div>
				) : null}
			</div>
		);
	}

	function renderMap() {
		if (!results) return null;
		const mapNodes = [
			...losNodes,
			{
				id: address.split(",")[0],
				lat: parseFloat(lat),
				lng: parseFloat(lng),
				devices: [],
				status: "los"
			}
		];
		const mapLinks = [
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
							range: 0,
							width: 360
						}
					},
					losNode.devices[0]
				]
			}))
		];
		return (
			<div className="h-100-l h5 w-100 relative">
				<MapView nodes={mapNodes} links={mapLinks} />
			</div>
		);
	}
}
