import React from "react";
import { OverlayView } from "@react-google-maps/api";

const getPixelPositionOffset = (width, height) => ({
	x: -width / 2,
	y: -height
});

export default function NodeDetail(props) {
	const { node } = props;

	if (!node) {
		return null;
	}

	const { lat, lng } = node;

	return (
		<OverlayView
			position={new window.google.maps.LatLng(lat, lng)}
			mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
			getPixelPositionOffset={getPixelPositionOffset}
		>
			<div
				ref={ref =>
					ref &&
					window.google.maps.OverlayView.preventMapHitsFrom(ref)
				}
				className="flex flex-column items-center"
			>
				<div className="flex items-center bg-white br1 overflow-hidden shadow pv05 ph1">
					<span className="f6 nowrap helvetica db">
						{node.name || node.id}
					</span>
				</div>
				<svg
					viewBox="0 5 12 12"
					version="1.1"
					width="12"
					height="12"
					aria-hidden="true"
					style={{ marginTop: "-1px" }}
				>
					<path fillRule="evenodd" fill="white" d="M0 5l6 6 6-6H0z" />
				</svg>
			</div>
		</OverlayView>
	);
}
