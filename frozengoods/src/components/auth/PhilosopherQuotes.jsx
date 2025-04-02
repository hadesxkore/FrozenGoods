import { useState, useEffect } from "react";
import { Snowflake } from "lucide-react";

const quotes = [
  {
    text: "The unexamined life is not worth living.",
    author: "Socrates"
  },
  {
    text: "Knowing yourself is the beginning of all wisdom.",
    author: "Aristotle"
  },
  {
    text: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates"
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle"
  },
  {
    text: "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does.",
    author: "Jean-Paul Sartre"
  },
  {
    text: "Happiness is not something ready-made. It comes from your own actions.",
    author: "Dalai Lama"
  },
  {
    text: "The function of education is to teach one to think intensively and to think critically. Intelligence plus character – that is the goal of true education.",
    author: "Martin Luther King Jr."
  },
  {
    text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela"
  },
  {
    text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.",
    author: "Albert Camus"
  },
  {
    text: "Two things awe me most, the starry sky above me and the moral law within me.",
    author: "Immanuel Kant"
  }
];

export default function PhilosopherQuotes() {
  const [currentQuote, setCurrentQuote] = useState(0);
  
  useEffect(() => {
    // Change quote every 8 seconds
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-600 to-blue-800 overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center p-12 w-full h-full">
        {/* Logo */}
        <div className="mb-8">
          <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
            <Snowflake className="h-10 w-10" />
          </div>
        </div>
        
        {/* Brand */}
        <h1 className="text-3xl font-bold text-white mb-2">Frozen Goods</h1>
        <p className="text-blue-100 mb-16">Inventory Management System</p>
        
        {/* Quote */}
        <div className="max-w-sm mx-auto transition-opacity duration-700">
          <blockquote className="text-xl font-medium text-white mb-6 text-center leading-relaxed">
            "{quotes[currentQuote].text}"
          </blockquote>
          <cite className="text-blue-200 block text-right">
            — {quotes[currentQuote].author}
          </cite>
        </div>
      </div>
    </div>
  );
} 