import React from "react";
import { Marker } from "@react-google-maps/api";
import Tooltip from "./Tooltip";

export default function NodeMarker(props) {
	const { node, onClick } = props;
	const { lat, lng } = node;
	const title = node.name || String(node.id);
	const icon = getIcon(node);
	const zIndex = getZ(node);
	const opacity = 1;
	return (
		<>
			<Marker
				position={{ lat, lng }}
				title={title}
				icon={icon}
				options={{ opacity }}
				zIndex={zIndex}
				onClick={onClick}
			/>
			<Tooltip node={node} />
		</>
	);
}

function getIcon(node) {
	const { name, notes, devices, status } = node;

	if (status === "los")
		return {
			url: "/img/map/potential.svg",
			anchor: { x: 6, y: 6 }
		};

	// Supernode -- TODO: Have a flag in db like "upstream"
	if (name && name.includes("Supernode"))
		return {
			url: "/img/map/supernode.svg",
			anchor: { x: 9, y: 9 }
		};

	// Hub
	if (notes && notes.includes("hub"))
		return {
			url: "/img/map/hub.svg",
			anchor: { x: 9, y: 9 }
		};

	// Omni
	if (devices.filter(device => device.type.name === "Omni").length)
		return {
			url: "/img/map/omni.svg",
			anchor: { x: 6, y: 6 }
		};

	return {
		url: "/img/map/active.svg",
		anchor: { x: 6, y: 6 }
	};
}

function getZ(node) {
	const { name, notes, devices } = node;

	if (name && name.includes("Supernode")) return 4;
	if (notes && notes.includes("hub")) return 3;
	if (devices.filter(device => device.type.name === "Omni").length) return 2;
	return 1;
}
