import React, { useState } from "react";
import DocumentTitle from "react-document-title";
import qs from "qs";
import AddressInput from "./AddressInput";

export default function Form(props) {
	const [address, setAddress] = useState("");
	const [bin, setBin] = useState();
	const [lat, setLat] = useState();
	const [lng, setLng] = useState();
	const [disabled, setDisabled] = useState(true);

	const onChange = address => {
		setAddress(address);
		setDisabled(true);
	};
	const onSelect = ({ address, bin, lat, lng }) => {
		setAddress(address);
		setBin(bin);
		setLat(lat);
		setLng(lng);
		setDisabled(false);
	};
	const onSubmit = event => {
		event.preventDefault();
		const query = qs.stringify({
			address,
			bin,
			lat,
			lng
		});
		props.history.push(`/search?${query}`);
	};

	return (
		<DocumentTitle title="Line of Sight">
			<form
				onSubmit={onSubmit}
				className="measure-wide center pv5-ns pv3"
			>
				<h1 className="f4 fw7 mb5 mv3">
					Check for line of sight to supernodes and hubs
				</h1>
				<p className="lh-copy dark-gray">
					This tool uses the{" "}
					<a
						target="_"
						className="dark-blue no-underline"
						href="https://www1.nyc.gov/site/doitt/initiatives/3d-building.page"
					>
						NYC 3D Building Model
					</a>{" "}
					to see if your roof can connect to nearby nodes. The data is
					from 2014, so results are not 100% accurate.
				</p>
				<AddressInput
					address={address}
					onChange={onChange}
					onSelect={onSelect}
				/>
				<input
					tabIndex="2"
					type="submit"
					value="Check"
					disabled={disabled}
					className={`bn fr pa3 white ${
						disabled ? "bg-moon-gray" : "bg-red pointer"
					} br2 fw6 f5-ns f6 ttu shadow mv3 w-auto-ns w-100`}
				/>
			</form>
		</DocumentTitle>
	);
}
