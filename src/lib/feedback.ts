const TALLY_FORM_ID = 'EkDK5X';

export function openFeedback(lang: string) {
	const url = `https://tally.so/r/${TALLY_FORM_ID}?lang=${lang}`;
	window.open(url, '_blank', 'noopener,noreferrer');
}
