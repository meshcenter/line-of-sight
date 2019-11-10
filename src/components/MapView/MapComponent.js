import React, { useState, useRef, createRef } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

import NodeMarker from "./NodeMarker";
import LinkLine from "./LinkLine";
import Sector from "./Sector";

const DEFAULT_ZOOM = 14;
const DEFAULT_CENTER = { lat: 40.69, lng: -73.9595798 };

const options = {
	fullscreenControl: false,
	streetViewControl: false,
	mapTypeControl: false,
	zoomControlOptions: {
		position: "9"
	},
	mapTypeControlOptions: {
		position: "3"
	},
	backgroundColor: "#fff",
	gestureHandling: "greedy",
	clickableIcons: false,
	styles: [
		{
			elementType: "labels.icon",
			stylers: [
				{
					visibility: "off"
				}
			]
		},
		{
			featureType: "road",
			elementType: "labels.icon",
			stylers: [
				{
					visibility: "off"
				}
			]
		},
		{
			featureType: "road.highway",
			stylers: [
				{
					visibility: "off"
				}
			]
		},
		{
			featureType: "transit",
			stylers: [
				{
					visibility: "off"
				}
			]
		}
	]
};

export default function MapComponent(props) {
	const { nodes, links } = props;
	if (!nodes || !links) throw new Error("Missing nodes or links");
	return (
		<div className="h-100 w-100 flex flex-column">
			<LoadScript
				id="script-loader"
				googleMapsApiKey="AIzaSyBNClp7oJsw-eleEoR3-PQKV23tpeW-FpE"
				loadingElement={<div />}
			>
				<GoogleMap
					zoom={DEFAULT_ZOOM}
					center={DEFAULT_CENTER}
					options={options}
					mapContainerClassName="flex h-100 w-100"
					onLoad={map => {
						if (nodes.length === 1) {
							const { lat, lng } = nodes[0];
							map.panTo({ lng, lat });
							return;
						}

						let minLng = 9999,
							minLat = 9999,
							maxLng = -9999,
							maxLat = -9999;

						nodes.forEach(node => {
							const { lat, lng } = node;
							if (lng < minLng) minLng = lng;
							if (lng > maxLng) maxLng = lng;
							if (lat < minLat) minLat = lat;
							if (lat > maxLat) maxLat = lat;
						});

						const newBounds = {
							east: maxLng,
							north: maxLat,
							south: minLat,
							west: minLng
						};

						map.fitBounds(newBounds, 32);
					}}
				>
					<NodeLayer nodes={nodes} />
					<LinkLayer links={links} />
					<SectorLayer nodes={nodes} />
				</GoogleMap>
			</LoadScript>
		</div>
	);
}

function NodeLayer(props) {
	const { nodes } = props;
	return nodes.map(node => <NodeMarker key={node.id} node={node} />);
}

function LinkLayer(props) {
	const { links } = props;
	return links.map(link => <LinkLine key={link.id} link={link} />);
}

function SectorLayer(props) {
	const { nodes } = props;
	return nodes.map(node =>
		(node.devices || []).map((device, index) => (
			<Sector key={device.id} device={device} />
		))
	);
}
