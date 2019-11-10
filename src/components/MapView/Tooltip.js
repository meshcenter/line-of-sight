import React from "react";
import { OverlayView } from "@react-google-maps/api";
import { Link } from "react-router-dom";

const getPixelPositionOffset = (width, height) => ({
	x: -width / 2,
	y: -height
});

export default function NodeDetail(props) {
	const { node } = props;

	if (!node) {
		return null;
	}

	const { lat, lng, panoramas = [] } = node;

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
				<div className="flex items-center bg-white br2 overflow-hidden shadow-2">
					<div className="pv1 ph2 flex flex-column justify-end">
						<span className="f5 fw6 nowrap sans-serif">
							{node.name || node.id}
						</span>
					</div>
				</div>
				<svg
					viewBox="0 5 12 12"
					version="1.1"
					width="12"
					height="12"
					aria-hidden="true"
				>
					<path fillRule="evenodd" fill="white" d="M0 5l6 6 6-6H0z" />
				</svg>
			</div>
		</OverlayView>
	);
}
