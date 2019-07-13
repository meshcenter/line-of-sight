import React, { useState } from "react";
import AddressInput from "./AddressInput";

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
		bin: "3336893"
	},
	{
		name: "SN4",
		bin: "3029670"
	},
	{
		name: "Guernsey Hub",
		bin: "3065507"
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

export default function Form() {
	const [address, setAddress] = useState("");
	const [bin, setBin] = useState();
	const [results, setResults] = useState({});
	const [hideResults, setHideResults] = useState(true);
	const [hideForm, setHideForm] = useState(false);
	return (
		<div className="pv5-ns pv3 ph3">
			<div className="measure center">
				{hideForm ? (
					<div className="justify-between items-center">
						<button
							className="pa0 bn bg-transparent nowrap pointer red"
							onClick={() => {
								setAddress("");
								setResults({});
								setHideForm(false);
								setHideResults(true);
							}}
						>
							Back
						</button>
						<h2 className="f4 fw6">{address}</h2>
					</div>
				) : (
					<form
						onSubmit={event => {
							event.preventDefault();
							setHideForm(true);
							setHideResults(false);
							const newResults = {};
							setResults(newResults);
							let buildingNotFound = false;
							targets.forEach(target => {
								fetchIntersections(bin, target.bin).then(
									result => {
										if (result.error && !buildingNotFound) {
											alert("Building not found");
											buildingNotFound = true;
										}
										newResults[target.bin] = result;
										setResults({ ...newResults });
									}
								);
							});
						}}
					>
						<div style={{ height: "18px" }} />
						<p className="f4 fw6 mb5 mt3">
							Check for line of sight to supernodes and hubs
						</p>
						<AddressInput
							address={address}
							onChange={address => {
								setAddress(address);
								setResults({});
								setHideResults(true);
							}}
							onSelect={({ address, bin }) => {
								setAddress(address);
								setBin(bin);
								setResults({});
								setHideResults(true);
							}}
						/>

						<input
							type="submit"
							value="Check"
							className="bn fr pa3 white bg-red br2 fw6 f5-ns f6 ttu shadow mv3 pointer w-auto-ns w-100"
						/>
					</form>
				)}
				<div className="measure center mt3">
					<ul className="list ma0 pa0">
						{targets.map(target => {
							if (hideResults) return null;
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

							const { distance, intersections, error } = results[
								target.bin
							];
							const inRange = distance < 8000; // ~1.5 miles
							const rangeLabel = error
								? "Error"
								: `${(distance / 5280).toFixed(1)} mi`;
							const visible =
								intersections && !intersections.length;
							const visibleLabel = error
								? ""
								: visible
								? ""
								: `${
										intersections.length == 10
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
										<span
											className={
												visible && !error
													? "green fw6"
													: "silver"
											}
										>
											{visibleLabel}
										</span>
										<span
											className={
												inRange && !error
													? "green fw6"
													: "silver"
											}
										>
											{rangeLabel}
										</span>
									</div>
								</li>
							);
						})}
					</ul>
				</div>
			</div>
		</div>
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
