const PERMIT_DATA = "./data/permits/DOB_NOW__Build___Approved_Permits.csv";

// function updateBIN() {
// 	const binByAddress = {};
// 	fs
// 		.createReadStream(PERMIT_DATA)
// 		.pipe(csv())
// 		.on("data", data => {
// 			const house = data["House No"];
// 			const street = data["Street Name"];
// 			const bin = data.Bin;
// 			console.log(house, street, bin);
// 		})
// 		.on("end", () => {
// 			writeFile(binByAddress, `${OUT_DATA}binByAddress.json`);
// 		})
// 		.on("error", err => console.log(err));
// }
