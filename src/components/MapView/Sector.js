import React from "react";
import { Polygon } from "@react-google-maps/api";
// import { sectorColors } from "../../utils";

export default function Sector(props) {
	const { device } = props;

	const { lat, lng, azimuth } = device;
	const { range, width } = device.type;
	const path = getPath({ lat, lng, range, azimuth, width });

	return (
		<Polygon
			key={`${device.id} ${device.lat} ${device.lng}`}
			path={path}
			options={{
				strokeColor: "transparent",
				strokeOpacity: 0,
				strokeWidth: 0,
				fillColor: "rgb(0,122,255)",
				fillOpacity: 0.0625,
				clickable: false,
				zIndex: 1
			}}
		/>
	);
}

function getPath({ lat, lng, range, azimuth, width }) {
	var centerPoint = { lat, lng };
	var PRlat = (range / 3963) * (180 / Math.PI); // using 3963 miles as earth's radius
	var PRlng = PRlat / Math.cos(lat * (Math.PI / 180));
	var PGpoints = [];
	PGpoints.push(centerPoint);

	const lat1 =
		lat + PRlat * Math.cos((Math.PI / 180) * (azimuth - width / 2));
	const lon1 =
		lng + PRlng * Math.sin((Math.PI / 180) * (azimuth - width / 2));
	PGpoints.push({ lat: lat1, lng: lon1 });

	const lat2 =
		lat + PRlat * Math.cos((Math.PI / 180) * (azimuth + width / 2));
	const lon2 =
		lng + PRlng * Math.sin((Math.PI / 180) * (azimuth + width / 2));

	var theta = 0;
	var gamma = (Math.PI / 180) * (azimuth + width / 2);

	for (var a = 1; theta < gamma; a++) {
		theta = (Math.PI / 180) * (azimuth - width / 2 + a);
		const PGlon = lng + PRlng * Math.sin(theta);
		const PGlat = lat + PRlat * Math.cos(theta);

		PGpoints.push({ lat: PGlat, lng: PGlon });
	}

	PGpoints.push({ lat: lat2, lng: lon2 });
	PGpoints.push(centerPoint);

	return PGpoints;
}
