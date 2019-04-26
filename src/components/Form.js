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
		name: "Soft Surplus",
		bin: "3319903"
	},
	{
		name: "Simona",
		bin: "3070130"
	},
	{
		name: "Cypress Inn",
		bin: "3333240"
	},
	{
		name: "SN4",
		bin: "3029670"
	}
];

export default function Form() {
	const [address, setAddress] = useState("");
	const [intersections, setIntersections] = useState({});
	return (
		<div className="pv5 ph3">
			<form
				className="f4 mw7 w-100 center"
				onSubmit={event => {
					event.preventDefault();
					const newIntersections = {};
					setIntersections(newIntersections);
					fetchAddress(address).then(({ bin, label }) => {
						setAddress(label);
						targets.forEach(target => {
							fetchIntersections(bin, target.bin).then(
								targetIntersections => {
									newIntersections[
										target.bin
									] = targetIntersections;
									setIntersections({ ...newIntersections });
								}
							);
						});
					});
				}}
			>
				<p className="fw6 tc mb5">
					Check for line of sight to supernodes and hubs
				</p>
				<div className="flex bg-red">
					<input
						name="address"
						value={address}
						placeholder="Street address"
						className="pa3 shadow-1 w-100"
						onChange={({ target }) => setAddress(target.value)}
					/>
				</div>
				<input
					type="submit"
					value="Check"
					className="bn fr pa3 white bg-red br2 fw6 f5-ns f6 ttu shadow mt4-ns mt3 pointer w-auto-ns w-100"
				/>
			</form>
			<div className="measure-narrow center mt6">
				<ul className="list ma0 pa0">
					{targets.map(target => {
						const targetIntersections = intersections[target.bin];
						const loading = !targetIntersections;
						if (loading) return null;

						const error =
							targetIntersections.length &&
							targetIntersections[0] === "error";
						const visible =
							targetIntersections && !targetIntersections.length;
						const label = visible
							? "Line of sight!"
							: `${targetIntersections.length} intersections`;
						return (
							<li
								key={target.bin}
								className="pv2 bb b--light-gray flex items-center justify-between"
							>
								<div>
									<span className="">
										{visible ? "✅" : "❌"}
									</span>
									<span className="ml2 fw6">
										{target.name}
									</span>
								</div>
								<span
									className={
										visible && !error ? "green" : "red"
									}
								>
									{!error ? label : "Error"}
								</span>
							</li>
						);
					})}
				</ul>
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
		const intersections = await fetch(
			`/.netlify/functions/intersections/?bin1=${bin1}&bin2=${bin2}`
		).then(res => res.json());
		return intersections;
	} catch (error) {
		return ["error"];
	}
}
