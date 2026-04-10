import { Component, type ReactNode } from 'react';

interface Props {
	children: ReactNode;
}

interface State {
	crashed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
	state: State = { crashed: false };

	static getDerivedStateFromError(): State {
		return { crashed: true };
	}

	render() {
		if (this.state.crashed) {
			return (
				<div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
					<span className="font-display text-3xl font-light text-gold">قضاء</span>
					<p className="text-sm text-muted">Une erreur est survenue lors du chargement.</p>
					<button
						type="button"
						className="rounded-lg bg-surface-raised px-4 py-2 text-sm text-foreground"
						onClick={() => window.location.reload()}
					>
						Recharger
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}
