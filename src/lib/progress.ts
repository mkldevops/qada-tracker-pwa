export function calculateProgress(completed: number, owed: number): number {
	if (owed <= 0) return 0;
	return Math.min(100, Math.max(0, (completed / owed) * 100));
}
