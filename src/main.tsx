import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';

(screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })
	.lock?.('portrait')
	?.catch(() => {});

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
