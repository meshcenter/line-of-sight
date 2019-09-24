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

const questionIcon = (
	<svg
		width="24"
		height="24"
		viewBox="0 0 14 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		style={{
			minWidth: "24"
		}}
	>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M6 9H8V11H6V9ZM10 5.5C10 7.64 8 8 8 8H6C6 7.45 6.45 7 7 7H7.5C7.78 7 8 6.78 8 6.5V5.5C8 5.22 7.78 5 7.5 5H6.5C6.22 5 6 5.22 6 5.5V6H4C4 4.5 5.5 3 7 3C8.5 3 10 4 10 5.5ZM7 1.29999C10.14 1.29999 12.7 3.85999 12.7 6.99999C12.7 10.14 10.14 12.7 7 12.7C3.86 12.7 1.3 10.14 1.3 6.99999C1.3 3.85999 3.86 1.29999 7 1.29999ZM7 0C3.14 0 0 3.14 0 7C0 10.86 3.14 14 7 14C10.86 14 14 10.86 14 7C14 3.14 10.86 0 7 0Z"
			transform="translate(0 1)"
			fill="rgb(255, 99, 0)"
		/>
	</svg>
);

const RANGE_LIMIT = 8000; // ~1.5 miles
const RANGE_LIMIT_2 = 10500; // ~1.5 miles

export default function ResultsList(props) {
	const { location } = props;
	const { bin, address } = qs.parse(location.search.replace("?", ""));

	const [results, setResults] = useState();

	useEffect(() => {
		if (!address || !bin) return;
		const newResults = {};
		setResults(newResults);
		async function checkTargets() {
			for (var i = 0; i < targets.length; i++) {
				const target = targets[i];
				const result = await fetchIntersections(bin, target.bin);
				newResults[target.bin] = result;
				setResults({ ...newResults });
			}
		}
		checkTargets();
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
			result.distance < RANGE_LIMIT_2
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
				const maybeInRange = distance < RANGE_LIMIT_2; // ~2 miles
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
							{visible
								? hasLOS
									? checkIcon
									: questionIcon
								: xIcon}
							<span
								className={`ml2 ${
									visible
										? hasLOS
											? "green fw6"
											: "orange"
										: "silver"
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
									className={
										maybeInRange
											? inRange
												? "green fw6"
												: "orange fw6"
											: "silver"
									}
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
