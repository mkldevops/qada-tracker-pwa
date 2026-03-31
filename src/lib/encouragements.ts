const ENCOURAGEMENTS: Record<string, string[]> = {
	ar: [
		// المغفرة والتوبة
		'يا ابن آدم، إنك ما دعوتني ورجوتني غفرت لك على ما كان فيك ولا أبالي.',
		'الَّذِينَ يَذْكُرُونَ اللَّهَ وَيَسْتَغْفِرُونَ لِذُنُوبِهِمْ ۗ وَمَن يَغْفِرُ الذُّنُوبَ إِلَّا اللَّهُ',
		'إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ',
		'التوبة الصادقة تمحو ما مضى. ولا يزال باب التوبة مفتوحًا.',

		// الصلاة والقرب من الله
		'أقرب ما يكون العبد من ربه وهو ساجد، فأكثروا الدعاء.',
		'إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ — وكل ركعة مقضاة شاهدة على ذلك.',
		'صلاة الجماعة تفضل صلاة الفذ بسبع وعشرين درجة.',
		'وَأَقِمِ الصَّلَاةَ ۖ إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا',

		// الحساب والاستعداد
		'وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ',
		'وَمَنْ أَعْرَضَ عَن ذِكْرِي فَإِنَّ لَهُ مَعِيشَةً ضَنكًا — وأنت اخترت العودة.',
		'القبر إما روضة من رياض الجنة أو حفرة من حفر النار — استعدّ الآن.',
		'كل جلسة عمل مرسل إلى الغد. لا يضيع منه شيء.',

		// الصبر والابتلاء
		'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
		'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
		'أشد الناس بلاءً الأنبياء، ثم الأمثل فالأمثل — صبرك شاهد على إيمانك.',
		'الصبر على الطاعة يرفع الدرجات ويمحو السيئات.',

		// القدر والتوكل
		'كل شيء بقدر — حتى هذه اللحظة من العودة إلى الله.',
		'مَا شَاءَ اللَّهُ كَانَ، وَمَا لَمْ يَشَأْ لَمْ يَكُنْ — رجوعك كان في قدره.',
		'وَمَا تَشَاؤُونَ إِلَّا أَن يَشَاءَ اللَّهُ — شاء أن تكون هنا، في هذه اللحظة.',
		'كل سجدة تقرّبك من يوم توزن فيه الأعمال.',
	],
	fr: [
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
		'Les plus grandes \u00e9preuves touchent les proph\u00e8tes, puis les meilleurs \u2014 ta lutte t\u00e9moigne de ta foi.',
		'La patience dans l\u2019\u00e9preuve \u00e9l\u00e8ve le rang et efface les p\u00e9ch\u00e9s.',

		// Pr\u00e9destination & confiance
		'Allah a cr\u00e9\u00e9 toute chose par pr\u00e9destination \u2014 y compris ce moment de retour \u00e0 Lui.',
		'Ce qu\u2019Allah a voulu est\u00a0; ce qu\u2019Il n\u2019a pas voulu n\u2019est pas. Ton retour \u00e9tait dans Son d\u00e9cret.',
		'Vous ne voulez que si Allah le veut \u2014 Il a voulu que tu sois l\u00e0, en ce moment.',
		'Chaque prosternation te rapproche du Jour o\u00f9 les actes seront pes\u00e9s.',
	],
	en: [
		// Forgiveness & repentance
		'O son of Adam, as long as you call upon Me with hope, I shall forgive you, whatever your sins may be.',
		'Those who remember Allah and ask forgiveness for their sins \u2014 none forgives sins but Allah.',
		'Allah forgives all sins except associating partners with Him. Never despair of His mercy.',
		'Sincere repentance erases what has passed. It is never too late.',

		// Prayer & divine proximity
		'The servant is closest to his Lord when he is in prostration.',
		'Prayer wards off the abominable \u2014 every made-up rak\u2019a is proof of that.',
		'Prayer in congregation surpasses prayer alone by twenty-seven degrees.',
		'Persevere in prayer \u2014 it is a direct command from your Lord.',

		// Urgency & accountability
		'Let every soul consider what it sends forth for tomorrow.',
		'Whoever turns away from the remembrance of Allah will have a difficult life. You have chosen to return.',
		'The grave is either a garden of Paradise or a pit of Hell \u2014 prepare yourself now.',
		'Every session is a deed sent forward for tomorrow. None of it is lost.',

		// Patience & trials
		'Whoever fears Allah, He will make a way out for them and provide from where they least expect.',
		'Whoever puts their trust in Allah \u2014 He is sufficient for them.',
		'The greatest trials befall the prophets, then the best \u2014 your struggle testifies to your faith.',
		'Patience in trials raises one\u2019s rank and erases sins.',

		// Predestination & trust
		'Allah created all things by predestination \u2014 including this moment of returning to Him.',
		'What Allah wills is; what He does not will is not. Your return was in His decree.',
		'You will only what Allah wills \u2014 He willed that you be here, in this moment.',
		'Every prostration brings you closer to the Day when deeds will be weighed.',
	],
};

export function randomEncouragement(locale: string): string {
	const list = ENCOURAGEMENTS[locale] ?? ENCOURAGEMENTS.fr;
	return list[Math.floor(Math.random() * list.length)];
}
