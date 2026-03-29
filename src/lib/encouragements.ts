export const ENCOURAGEMENTS = [
	// Pardon & repentir
	'\u00d4 fils d\u2019Adam, tant que tu M\u2019implores avec espoir, Je te pardonnerai quelles que soient tes fautes.',
	'Ceux qui se souviennent d\u2019Allah et demandent pardon pour leurs fautes \u2014 nul autre qu\u2019Allah ne pardonne.',
	'Allah pardonne tous les p\u00e9ch\u00e9s, sauf l\u2019association. Ne d\u00e9sesp\u00e8re jamais de Sa mis\u00e9ricorde.',
	'Le repentir sinc\u00e8re efface ce qui est pass\u00e9. Il n\u2019est jamais trop tard.',

	// Pri\u00e8re & proximit\u00e9 divine
	'L\u2019esclave est le plus proche de l\u2019agr\u00e9ment de son Seigneur lorsqu\u2019il est en prosternation.',
	'La pri\u00e8re emp\u00eache l\u2019abominable \u2014 chaque rak\u2019a rattrap\u00e9e en est la preuve.',
	'La pri\u00e8re en assembl\u00e9e d\u00e9passe de vingt-sept degr\u00e9s la pri\u00e8re accomplie seul.',
	'Pers\u00e9v\u00e8re dans la pri\u00e8re \u2014 c\u2019est un commandement direct de ton Seigneur.',

	// Urgence & bilan
	'Que chaque \u00e2me regarde ce qu\u2019elle envoie pour demain.',
	'Qui s\u2019\u00e9loigne du rappel d\u2019Allah aura une vie difficile. Tu as choisi le retour.',
	'La tombe est soit un jardin du Paradis, soit une fosse de l\u2019Enfer \u2014 pr\u00e9pare-toi d\u00e8s maintenant.',
	'Chaque session est un acte envoy\u00e9 pour demain. Aucun ne se perd.',

	// Patience & \u00e9preuves
	'Quiconque craint Allah, Il lui m\u00e9nagera une issue et lui accordera au-del\u00e0 de toute attente.',
	'Quiconque s\u2019en remet \u00e0 Allah \u2014 Il lui suffit.',
	'Les plus grandes \u00e9preuves touchent les prophètes, puis les meilleurs \u2014 ta lutte t\u00e9moigne de ta foi.',
	'La patience dans l\u2019\u00e9preuve \u00e9l\u00e8ve le rang et efface les p\u00e9ch\u00e9s.',

	// Pr\u00e9destination & confiance
	'Allah a cr\u00e9\u00e9 toute chose par pr\u00e9destination \u2014 y compris ce moment de retour \u00e0 Lui.',
	'Ce qu\u2019Allah a voulu est\u00a0; ce qu\u2019Il n\u2019a pas voulu n\u2019est pas. Ton retour \u00e9tait dans Son d\u00e9cret.',
	'Vous ne voulez que si Allah le veut \u2014 Il a voulu que tu sois l\u00e0, en ce moment.',
	'Chaque prosternation te rapproche du Jour o\u00f9 les actes seront pes\u00e9s.',
];

export function randomEncouragement(): string {
	return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}
