export function calculateProgress(completed: number, owed: number): number {
	return owed > 0 ? Math.min(100, (completed / owed) * 100) : 0;
}
