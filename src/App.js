import React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import Form from "./components/Form";
import ResultsList from "./components/ResultsList";

export default function App() {
	return (
		<Router>
			<div className="helvetica pv5-ns pv3 ph3">
				<div className="measure-wide center">
					<Route path="/" exact component={Form} />
					<Route path="/search/" component={ResultsList} />
				</div>
			</div>
		</Router>
	);
}
