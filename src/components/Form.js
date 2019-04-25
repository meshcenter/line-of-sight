import React, { useState } from "react";

export default function Form() {
	return (
		<div className="pv5 flex items-start justify-center">
			<form className="f4 mw7 w-100">
				<p className="fw6 tc mb5">
					Check for line of sight to supernodes and hubs
				</p>
				<div className="flex bg-red">
					<input
						name="address1"
						placeholder="Street address"
						className="pa3 shadow-1 w-100"
					/>
				</div>
				<input
					type="submit"
					value="Check"
					className="bn fr pa3 white bg-red br2 fw6 f5-ns f6 ttu shadow mt4-ns mt3 pointer"
				/>
			</form>
		</div>
	);
}
