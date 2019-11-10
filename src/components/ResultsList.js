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
				`https://api.nycmesh.net/los?bin=${bin}`
			)).json();
			setResults(results);
		}
		fetchLos();
	}, [address, bin]);

	const losNodes = results
		? [...results.visibleSectors, ...results.visibleOmnis].filter(
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
						<span className="f4 mr1">😞</span>{" "}
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
					<span className="f4 mr1">🎉</span>{" "}
					<span>You have line of sight!</span>
				</div>
				<p className="mid-gray mb0 mt2 lh-copy">
					There {losNodes.length === 1 ? "is" : "are"}{" "}
					{losNodes.length} nearby visible{" "}
					{losNodes.length === 1 ? "node" : "nodes"}.
				</p>
			</div>
		);
	}

	return (
		<DocumentTitle title={`${address} - Line of Sight`}>
			<div className=" flex flex-column h-100">
				<div className="flex items-center justify-between pa3 bb b--light-gray">
					<h1 className="f4 fw6 mv0">{address}</h1>
					<Link
						to="/"
						className="flex red no-underline mv0 nowrap ml3"
					>
						Check another address →
					</Link>
				</div>
				{results ? (
					<div className="flex flex-row-reverse-l flex-column w-100 h-100">
						<div className="h-100 w-100">
							{results ? (
								<MapView
									nodes={[
										{
											id: address.split(",")[0],
											lat: parseFloat(lat),
											lng: parseFloat(lng),
											devices: [],
											status: "los"
										},
										...losNodes
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
														range: 0.5,
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
						<div className="br-l b--light-gray w-100 measure-narrow-l h-100 flex flex-column">
							{renderStatus()}
							<div className="h-100 overflow-y-scroll">
								{losNodes.length ? (
									<div className="">
										<ul className="list ma0 pa0">
											{losNodes.map(node => (
												<li className="bb b--light-gray pv3 pointer ph3 flex items-center justify-between">
													<NodeName node={node} />
													<span className="mid-gray db f6">
														{
															node.devices[0].type
																.name
														}
													</span>
												</li>
											))}
										</ul>
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
