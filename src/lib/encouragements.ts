export const ENCOURAGEMENTS = [
	"Chaque pri\u00e8re rattrap\u00e9e est un pas de plus vers Sa satisfaction.",
	"Allah r\u00e9compense chaque effort, m\u00eame le plus petit.",
	"La constance vaut mieux que l\u2019intensit\u00e9. Avance \u00e0 ton rythme.",
	"Tu as fait le premier pas. C\u2019est le plus courageux.",
	"Allah agr\u00e9e que Son serviteur revienne \u00e0 Lui, encore et encore.",
	"Le repentir sinc\u00e8re efface ce qui est pass\u00e9. Commence aujourd\u2019hui.",
	"Nul ne conna\u00eet la mis\u00e9ricorde d\u2019Allah mieux que celui qui revient \u00e0 Lui.",
	"Chaque jour est une nouvelle chance offerte par Allah.",
	"La r\u00e9gularit\u00e9, m\u00eame modeste, est agr\u00e9e d\u2019Allah.",
	"Ce que tu accomplis aujourd\u2019hui, tu le retrouveras demain.",
	"Chaque session est une victoire sur la procrastination.",
	"Tu es plus proche du bilan qu\u2019hier. Continue.",
	"Allah voit ton effort, m\u00eame quand personne d\u2019autre ne le voit.",
	"Une pri\u00e8re rattrap\u00e9e vaut mieux que mille intentions.",
	"Le chemin est long, mais chaque pas compte.",
	"Sois fier de ce que tu as accompli aujourd\u2019hui.",
	"Allah n\u2019impose \u00e0 aucune \u00e2me plus qu\u2019elle ne peut supporter.",
	"Ce qui est fait avec sinc\u00e9rit\u00e9 ne se perd jamais.",
	"Revenir \u00e0 Allah est toujours possible, \u00e0 tout moment.",
	"La douceur envers soi-m\u00eame fait partie de la sagesse.",
];

export function randomEncouragement(): string {
	return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}
