import "@testing-library/jest-dom";

// mock AR.js globals that might be missing in test environment
global.THREEx = {
	ArToolkitSource: class {
		init() {
			return Promise.resolve();
		}
		onReady() {}
	},
	ArToolkitContext: class {
		init() {
			return Promise.resolve();
		}
		update() {}
	},
	ArMarkerControls: class {
		constructor() {}
	},
};
