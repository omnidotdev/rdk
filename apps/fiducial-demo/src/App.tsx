import { XRCanvas, FiducialAnchor } from "@omnidotdev/rdk";

import { Supertorus } from "components";

/**
 * Fiducial marker-based AR demo application.
 */
const App = () => (
	<XRCanvas
		gl={{
			antialias: false,
			powerPreference: "default",
		}}
	>
		{/* lighting */}
		<hemisphereLight intensity={0.6} />
		<directionalLight position={[5, 5, 5]} intensity={1} />

		<FiducialAnchor params={{ smooth: true }} patternUrl="/data/rdk.patt">
			<Supertorus
				R={4}
				n={10}
				t={1.5}
				position={[0, 0, 0]}
				scale={0.25}
				rotation={[Math.PI / 2, 0, 0]}
			/>
		</FiducialAnchor>
	</XRCanvas>
);

export default App;
