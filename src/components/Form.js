import React, { useState } from "react";

const targets = [
	{
		name: "SN1",
		bin: "1001389"
	},
	{
		name: "7th St.",
		bin: "1086499"
	},
	{
		name: "Rivington",
		bin: "1075676"
	},
	{
		name: "Ave D",
		bin: "1004447"
	},
	{
		name: "1147",
		bin: "1006456"
	},
	{
		name: "Pierre",
		bin: "1006327"
	},
	{
		name: "Henry",
		bin: "1087057"
	},
	{
		name: "1971",
		bin: "3001646"
	},
	{
		name: "659",
		bin: "1004052"
	},
	{
		name: "1340",
		bin: "3039983"
	},
	{
		name: "Ehud",
		bin: "3050714"
	},
	{
		name: "Flo",
		bin: "3057781"
	},
	{
		name: "3085",
		bin: "3073369"
	},
	{
		name: "Dekalb",
		bin: "3325497"
	},
	{
		name: "RiseBoro",
		bin: "3387654"
	},
	{
		name: "Soft Surplus",
		bin: "3319903"
	},
	{
		name: "Simona",
		bin: "3070130"
	},
	{
		name: "Cypress Inn",
		bin: "4081837"
	},
	{
		name: "SN3",
		bin: "3336893",
	},
	{
		name: "SN4",
		bin: "3029670"
	}
];

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
		stroke="red"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<line x1="18" y1="6" x2="6" y2="18" />
		<line x1="6" y1="6" x2="18" y2="18" />
	</svg>
);

export default function Form() {
	const [address, setAddress] = useState("");
	const [results, setResults] = useState({});
	return (
		<div className="pv5 ph3">
			<div className="measure center">
				<form
					className="f4"
					onSubmit={event => {
						event.preventDefault();
						const newResults = {};
						setResults(newResults);
						fetchAddress(address).then(({ bin, label }) => {
							setAddress(label);
							targets.forEach(target => {
								fetchIntersections(bin, target.bin).then(
									result => {
										newResults[target.bin] = result;
										setResults({ ...newResults });
									}
								);
							});
						});
					}}
				>
					<p className="fw6 tc mb5">
						Check for line of sight to supernodes and hubs
					</p>
					<div className="flex">
						<input
							name="address"
							value={address}
							placeholder="Street address"
							className="pa3 w-100 br2 ba b--moon-gray"
							onChange={({ target }) => setAddress(target.value)}
						/>
					</div>
					<input
						type="submit"
						value="Check"
						className="bn fr pa3 white bg-red br2 fw6 f5-ns f6 ttu shadow mt4-ns mt3 pointer w-auto-ns w-100"
					/>
				</form>
				<div className="measure center mt6">
					<ul className="list ma0 pa0">
						{targets.map(target => {
							const loading = !results[target.bin];
							if (loading) return null;

							const { distance, intersections, error } = results[
								target.bin
							];
							const inRange = distance < 8000; // ~1.5 miles
							const rangeLabel = `${(distance / 5280).toFixed(
								1
							)} mi`;
							const visible =
								intersections && !intersections.length;
							const visibleLabel = error
								? error
								: visible
								? "Line of sight!"
								: `${intersections.length} intersections`;
							return (
								<li
									key={target.bin}
									className="pv2 bb b--light-gray flex items-center justify-between"
								>
									<div className="w-third flex items-center">
										{visible && inRange ? checkIcon : xIcon}
										<span className="ml2">
											{target.name}
										</span>
									</div>
									<span
										className={
											visible && !error ? "green" : "red"
										}
									>
										{visibleLabel}
									</span>
									<span
										className={
											inRange && !error ? "green" : "red"
										}
									>
										{rangeLabel}
									</span>
								</li>
							);
						})}
					</ul>
				</div>
			</div>
		</div>
	);
}

async function fetchAddress(address) {
	const binResRaw = await fetch(
		`https://geosearch.planninglabs.nyc/v1/search?text=${address}`
	);
	const binRes = await binResRaw.json();
	const { features } = binRes;
	if (!features.length) {
		alert("Address not found");
		return;
	}
	const { label, pad_bin: bin } = features[0].properties;
	return { label, bin };
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
