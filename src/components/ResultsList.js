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

	useEffect(() => {
		if (!address || !bin) return;
		async function fetchLos() {
			const results = await (await fetch(
				`${process.env.REACT_APP_API_ROOT}/los?bin=${bin}`
			)).json();
			setResults(results);
		}
		fetchLos();
	}, [address, bin]);

	if (results && results.error) return <div>{results.error}</div>;

	const losNodes = results
		? [
				...results.visibleSectors,
				...results.visibleOmnis,
				...results.visibleRequests.map(request => ({
					...request,
					status: "los",
					devices: [
						{
							type: {
								id: 1,
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
				}))
		  ].filter(
				node =>
					node.devices.filter(
						device => device.type.name !== "Unknown"
					).length
		  )
		: [];

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

	return (
		<DocumentTitle title={`${address} - Line of Sight`}>
			<div className="flex-l flex-column h-100">
				<div className="flex items-center justify-between pa3 bb b--light-gray flex-shrink-0">
					<h1 className="f4 fw6 mv0">{address}</h1>
				</div>
				{results ? (
					<div className="flex flex-row-reverse-l flex-column w-100 h-100-l">
						<div className="h-100-l h5 w-100">
							{results ? (
								<MapView
									nodes={[
										...losNodes,
										{
											id: address.split(",")[0],
											lat: parseFloat(lat),
											lng: parseFloat(lng),
											devices: [],
											status: "los"
										}
									]}
									links={[
										...losNodes.map(omniNode => ({
											id: "asdf",
											status: "los",
											nodes: [
												{
													id: "1234"
												},
												omniNode
											],
											devices: [
												{
													id: "test",
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
												omniNode.devices[0]
											]
										}))
									]}
								/>
							) : null}
						</div>
						<div className="br-l b--light-gray w-100 measure-narrow-l h-100 overflow-y-scroll-l">
							{renderStatus()}
							<div className="h-100">
								{losNodes.length ? (
									<div className="">
										<ul className="list ma0 pa0">
											{losNodes.map(node => {
												const nonUnknown = node.devices.filter(
													d =>
														d.type.name !==
														"Unknown"
												);
												const device =
													nonUnknown[0] ||
													node.devices[0];
												return (
													<li className="bb b--light-gray pv3 pointer ph3 flex items-center justify-between">
														<NodeName node={node} />
														<span className="mid-gray db f6">
															{device.type.name}
														</span>
													</li>
												);
											})}
										</ul>
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
						</div>
					</div>
				) : null}
			</div>
		</DocumentTitle>
	);
}
