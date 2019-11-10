import React from "react";

import MapComponent from "./MapComponent";

export default function NodeMap(props) {
	const { nodes, links } = props;
	return (
		<div className="h-100 w-100 flex flex-column">
			<MapComponent nodes={nodes} links={links} />
		</div>
	);
}
