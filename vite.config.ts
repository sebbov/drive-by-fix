import checker from 'vite-plugin-checker';
import react from '@vitejs/plugin-react'

export default {
    plugins: [
        checker({
	    typescript: {
		tsconfigPath: "tsconfig.app.json"
	    }
	}),
	react(),
    ],
};
