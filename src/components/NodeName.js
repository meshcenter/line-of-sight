import React from "react";

export const icons = {
	dead: (
		<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14">
			<circle
				cx="7"
				cy="7"
				r="5"
				stroke="#fff"
				strokeWidth="2"
				fill="#aaa"
				opacity="1"
			/>
		</svg>
	),
	potential: (
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
			<circle
				cx="8"
				cy="8"
				r="6"
				stroke="#fff"
				strokeWidth="2"
				fill="#777"
				opacity="1"
			/>
		</svg>
	),
	"potential-hub": (
		<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22">
			<circle
				fill="#777"
				stroke="white"
				r="8"
				strokeWidth="3"
				cy="11"
				cx="11"
			/>
		</svg>
	),
	"potential-supernode": (
		<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">
			<g>
				<circle
					opacity="1"
					fill="#777"
					strokeWidth="4"
					stroke="#fff"
					r="10"
					cy="14"
					cx="14"
				/>
			</g>
		</svg>
	),
	active: (
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
			<circle
				fill="rgb(255,45,85)"
				stroke="white"
				r="6"
				strokeWidth="2"
				cx="8"
				cy="8"
			/>
		</svg>
	),
	remote: (
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
			<circle
				fill="rgb(255,45,85)"
				stroke="white"
				r="6"
				strokeWidth="2"
				cx="8"
				cy="8"
			/>
		</svg>
	),
	kiosk: (
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
			<circle
				fill="rgb(255,45,85)"
				stroke="white"
				r="6"
				strokeWidth="2"
				cx="8"
				cy="8"
			/>
		</svg>
	),
	omni: (
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
			<circle
				fill="rgb(90,200,250)"
				stroke="white"
				r="6"
				strokeWidth="2"
				cx="8"
				cy="8"
			/>
		</svg>
	),
	hub: (
		<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22">
			<circle
				fill="rgb(90,200,250)"
				stroke="white"
				r="8"
				strokeWidth="3"
				cy="11"
				cx="11"
			/>
		</svg>
	),
	supernode: (
		<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">
			<g>
				<circle
					opacity="1"
					fill="#007aff"
					strokeWidth="4"
					stroke="#fff"
					r="10"
					cy="14"
					cx="14"
				/>
			</g>
		</svg>
	),
	linkNYC: (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
			<circle
				cx="10"
				cy="10"
				r="3"
				stroke="white"
				strokeWidth="0"
				fill="#01a2eb"
				opacity="1"
			/>
		</svg>
	)
};

export default function NodeName(props) {
	const { node } = props;
	const name = node.name || node.id;
	return (
		<div className="flex justify-start items-center">
			<div className="mr2 flex items-center justify-center">
				{node.status === "planned" ? icons.potential : icons.omni}
			</div>
			<div className="">
				<span className="f5 fw5 black">{name}</span>
			</div>
		</div>
	);
}
