import React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import Form from "./components/Form";
import ResultsList from "./components/ResultsList";

export default function App() {
	return (
		<Router>
			<div className="helvetica absolute absolute--fill ">
				<div className="h-100 w-100">
					<Route path="/" exact component={Form} />
					<Route path="/search/" component={ResultsList} />
				</div>
			</div>
		</Router>
	);
}
