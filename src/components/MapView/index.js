import React from "react";

import MapComponent from "./MapComponent";

export default function NodeMap(props) {
	return (
		<div className="h-100 w-100 flex flex-column">
			<MapComponent {...props} />
		</div>
	);
}
