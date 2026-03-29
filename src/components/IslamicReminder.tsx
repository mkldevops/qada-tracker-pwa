import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { spring } from "@/lib/animations";

interface Reminder {
  text: string;
  source?: string;
}

const REMINDERS: Reminder[] = [
  {
    text: "Quiconque dort pendant l\u2019heure de la pri\u00e8re ou l\u2019oublie doit la prier d\u00e8s qu\u2019il s\u2019en souvient.",
    source: "Proph\u00e8te Muhammad \ufdfd",
  },
  {
    text: "Les savants s\u2019accordent \u00e0 dire que celui qui a omis une pri\u00e8re doit la rattraper \u2014 une obligation qui ne dispara\u00eet pas.",
  },
  {
    text: "Rattraper les pri\u00e8res manqu\u00e9es est une condition de la repentance sinc\u00e8re. Un croyant ne n\u00e9glige pas ce qu\u2019il doit \u00e0 son Seigneur.",
  },
  {
    text: "La pri\u00e8re a \u00e9t\u00e9 prescrite aux croyants \u00e0 des heures d\u00e9termin\u00e9es.",
    source: "Coran 4:103",
  },
  {
    text: "Quiconque Dieu veut du bien, Il lui accorde la compr\u00e9hension de la religion.",
    source: "Proph\u00e8te Muhammad \ufdfd",
  },
  {
    text: "Rechercher la connaissance est une obligation pour tout musulman.",
    source: "Proph\u00e8te Muhammad \ufdfd",
  },
  {
    text: "Dieu \u00e9l\u00e8ve ceux qui ont cru et ceux \u00e0 qui la connaissance a \u00e9t\u00e9 accord\u00e9e, de plusieurs degr\u00e9s.",
    source: "Coran 58:11",
  },
  {
    text: "La mis\u00e9ricorde de Dieu embrasse toutes choses. Ne d\u00e9sesp\u00e8re jamais de Son pardon.",
  },
  {
    text: "Dieu ne l\u00e8se pas le croyant de ses bonnes \u0153uvres \u2014 elles lui apportent subsistance ici-bas et r\u00e9compense dans l\u2019au-del\u00e0.",
  },
  {
    text: "Les meilleures des personnes sont celles qui apprennent et enseignent.",
    source: "Proph\u00e8te Muhammad \ufdfd",
  },
];

export function IslamicReminder() {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * REMINDERS.length),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % REMINDERS.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  const reminder = REMINDERS[index];

  return (
    <motion.div
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, ...spring }}
    >
      <div className="flex items-center gap-3 w-full">
        <div
          className="flex-1"
          style={{ height: 1, background: "var(--border)" }}
        />
        <span
          className="font-display text-xs select-none"
          style={{
            color: "var(--gold)",
            opacity: 0.7,
            letterSpacing: "0.15em",
          }}
        >
          &#10022;
        </span>
        <div
          className="flex-1"
          style={{ height: 1, background: "var(--border)" }}
        />
      </div>

      <motion.button
        type="button"
        className="flex flex-col items-center gap-1.5 text-center cursor-pointer select-none"
        onClick={() => setIndex((i) => (i + 1) % REMINDERS.length)}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            className="font-display text-xl italic leading-relaxed px-2"
            style={{ color: "var(--text-secondary)" }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.45 }}
          >
            &laquo; {reminder.text} &raquo;
          </motion.p>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {reminder.source && (
            <motion.span
              key={`src-${index}`}
              className="text-[10px] font-medium tracking-[1.5px] uppercase"
              style={{ color: "var(--gold)", opacity: 0.6 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              &mdash; {reminder.source}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="flex items-center gap-1">
        {REMINDERS.map((_, i) => (
          <motion.button
            key={i}
            type="button"
            aria-label={`Rappel ${i + 1}`}
            onClick={() => setIndex(i)}
            className="rounded-full"
            animate={{
              width: i === index ? 14 : 4,
              background: i === index ? "var(--gold)" : "var(--border)",
              opacity: i === index ? 1 : 0.5,
            }}
            transition={spring}
            style={{ height: 4 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
