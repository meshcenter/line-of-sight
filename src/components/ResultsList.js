import React, { useState, useEffect } from "react";
import DocumentTitle from "react-document-title";
import { Link } from "react-router-dom";
import qs from "qs";

import targets from "../targets";

const checkIcon = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="green"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		style={{
			minWidth: "24"
		}}
	>
		<polyline points="20 6 9 17 4 12" />
	</svg>
);

const xIcon = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="silver"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		style={{
			minWidth: "24"
		}}
	>
		<line x1="18" y1="6" x2="6" y2="18" />
		<line x1="6" y1="6" x2="18" y2="18" />
	</svg>
);

const RANGE_LIMIT = 8000; // ~1.5 miles

export default function ResultsList(props) {
	const { location } = props;
	const { bin, address } = qs.parse(location.search.replace("?", ""));

	const [results, setResults] = useState();

	useEffect(() => {
		if (!address || !bin) return;
		const newResults = {};
		setResults(newResults);
		targets.forEach(target => {
			fetchIntersections(bin, target.bin).then(result => {
				newResults[target.bin] = result;
				setResults({ ...newResults });
			});
		});
	}, [address, bin]);

	if (!results || !targets) return null;

	const allResults = Object.values(results);
	const allLoaded = allResults.length === targets.length;
	const allFailed =
		allResults.length &&
		allResults.reduce((acc, cur) => acc && cur.error, true);
	const linesOfSight = allResults.filter(
		result =>
			!result.error &&
			result.intersections &&
			!result.intersections.length &&
			result.distance < RANGE_LIMIT
	);

	const renderStatus = () => (
		<div>
			<p className="lh-copy dark-gray">
				{allFailed
					? "Building data not found."
					: allLoaded
					? linesOfSight.length
						? `${linesOfSight.length} possible ${
								linesOfSight.length > 1
									? "connections"
									: "connection"
						  } found!`
						: "No possible connections found."
					: "Checking for lines of sight. This might take a few moments..."}
			</p>
		</div>
	);

	const renderList = () => (
		<ul className="list ma0 pa0">
			{targets.map(target => {
				const loading = !results[target.bin];
				if (loading)
					return (
						<li
							key={target.bin}
							className="pv2 bb b--light-gray flex items-center justify-between"
						>
							<div className="w-third flex items-center">
								<div
									style={{
										width: "24px",
										height: "24px",
										minWidth: "24px"
									}}
								>
									<div className="spinner" />
								</div>
								<span className="ml2 silver">
									{target.name}
								</span>
							</div>
						</li>
					);

				const { distance, intersections, error } = results[target.bin];
				const inRange = distance < RANGE_LIMIT; // ~1.5 miles
				const rangeLabel = `${(distance / 5280).toFixed(1)} mi`;
				const visible = intersections && !intersections.length;
				const visibleLabel =
					error || visible || !intersections
						? ""
						: `${
								intersections.length === 10
									? "10+"
									: intersections.length
						  } ${
								intersections.length > 1
									? "intersections"
									: "intersection"
						  }`;
				const hasLOS = visible && inRange && !error;
				return (
					<li
						key={target.bin}
						className="pv2 bb b--light-gray flex items-center justify-between"
					>
						<div className="w-third flex items-center">
							{hasLOS ? checkIcon : xIcon}
							<span
								className={`ml2 ${
									hasLOS ? "green fw6" : "silver"
								}`}
							>
								{target.name}
							</span>
						</div>
						<div className="w-50-ns w-two-thirds pl3 flex items-center justify-between">
							<span className="silver">{visibleLabel}</span>
							{error ? (
								<span className={"silver"}>Error</span>
							) : (
								<span
									className={inRange ? "green fw6" : "silver"}
								>
									{rangeLabel}
								</span>
							)}
						</div>
					</li>
				);
			})}
		</ul>
	);

	return (
		<DocumentTitle title={`${address} - Line of Sight`}>
			<div>
				<h1 className="f4 fw7 mv3">{address}</h1>
				{renderStatus()}
				{allFailed ? null : renderList()}
				<Link to="/" className="flex red no-underline mv4">
					Check another address →
				</Link>
			</div>
		</DocumentTitle>
	);
}

async function fetchIntersections(bin1, bin2) {
	try {
		const { distance, intersections, error } = await fetch(
			`/.netlify/functions/intersections/?bin1=${bin1}&bin2=${bin2}`
		).then(res => res.json());
		if (error) throw error;
		return { distance, intersections, error };
	} catch (error) {
		return { error: "Error" };
	}
}
