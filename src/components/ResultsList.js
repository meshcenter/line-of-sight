import React, { useState, useEffect } from "react";
import DocumentTitle from "react-document-title";
import { Link } from "react-router-dom";
import qs from "qs";
import NodeName from "./NodeName";
import MapView from "./MapView";

export default function ResultsList(props) {
	const { location } = props;
	const { bin, address, lat, lng } = qs.parse(
		location.search.replace("?", "")
	);

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

	const {
		visibleSectors = [],
		visibleOmnis = [],
		visibleRequests = [],
		error
	} = results || {};

	const nodeFromRequest = request => ({
		...request,
		name: (request.address || "").split(",")[0],
		status: "los",
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

	function renderHeader() {
		return (
			<div className="flex items-center justify-between pa3 bb b--light-gray flex-shrink-0">
				<h1 className="f4 fw6 mv0">{address}</h1>
				<div className="db-ns dn">{viewEarth()}</div>
			</div>
		);
	}

	function renderMap() {
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
			<div className="h-100-l h5 w-100">
				<MapView nodes={mapNodes} links={mapLinks} />
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
					<Link to="/" className="flex red no-underline nowrap mt2">
						Check another address →
					</Link>
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
				{losNodes.length ? (
					<div className="">
						<ul className="list ma0 pa0">
							{losNodes.map(node => {
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
										<span className="mid-gray db f6">
											{device.type.name}
										</span>
									</li>
								);
							})}
						</ul>
						{visibleRequests.length ? (
							<div className="ph3 pt3 flex items-center">
								<div
									className="gray pointer"
									onClick={() => setShowPlanned(!showPlanned)}
								>
									{showPlanned
										? "Hide planned"
										: "Show planned"}
								</div>
							</div>
						) : null}
						<div className="dn-ns db mh3 mt3">{viewEarth()}</div>
						<div className="pv3">
							<Link
								to="/"
								className="flex red no-underline nowrap mh3 "
							>
								Check another address →
							</Link>
						</div>
					</div>
				) : null}
			</div>
		);
	}

	function viewEarth() {
		return (
			<a
				target="_"
				className="blue link"
				href={`https://earth.google.com/web/search/${address
					.split(" ")
					.map(encodeURIComponent)
					.join("+")}/@${lat},${lng},${(results || {})
					.buildingHeight / 3.32 || 100}a,300d,35y,0.6h,65t,0r`}
			>
				View Earth →
			</a>
		);
	}

	return (
		<DocumentTitle title={`${address} - Line of Sight`}>
			<div className="flex-l flex-column h-100">
				{renderHeader()}

				{results
					? ((error ? (
							<div className="pa3">
								{results.error}
								<div className="pv3">
									<Link
										to="/"
										className="flex red no-underline nowrap "
									>
										Check another address →
									</Link>
								</div>
								<div className="dn-ns db">{viewEarth()}</div>
							</div>
					  ) : (
							<div className="flex flex-row-reverse-l flex-column w-100 h-100-l overflow-y-hidden">
								{renderMap()}
								<div className="br-l b--light-gray w-100 measure-narrow-l overflow-y-scroll-l">
									{renderStatus()}
									{renderList()}
								</div>
							</div>
					  )): null)
					: null}
			</div>
		</DocumentTitle>
	);
}
