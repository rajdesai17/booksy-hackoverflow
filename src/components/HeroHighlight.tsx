import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HighlightProps {
  children: string;
  className?: string;
}

const Highlight = ({ children, className }: HighlightProps) => {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </span>
  );
};

interface HeroHighlightProps {
  text: string;
  highlightWords?: string[];
}

const HeroHighlight = ({ text, highlightWords = [] }: HeroHighlightProps) => {
  const words = text.split(" ");

  return (
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-4xl md:text-5xl lg:text-6xl font-bold text-center leading-tight"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="inline-block"
        >
          {highlightWords.includes(word) ? (
            <Highlight>{word}</Highlight>
          ) : (
            word
          )}{" "}
        </motion.span>
      ))}
    </motion.h1>
  );
};

export default HeroHighlight;