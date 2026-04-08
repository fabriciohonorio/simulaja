import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";

const WHATSAPP_NUMBER = "5541997925357";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Simulador", href: "#simulator" },
    { label: "Benefícios", href: "#benefits" },
    { label: "Como funciona", href: "#about" },
    { label: "Sobre", href: "#social-proof" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-md py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-black tracking-tighter ${isScrolled ? "text-primary" : "text-white"}`}>
            SimulaJá
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.label} 
              href={link.href}
              className={`text-sm font-bold transition-colors hover:text-secondary ${
                isScrolled ? "text-foreground" : "text-white/90"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a 
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-5 py-2.5 rounded-full text-sm font-black shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <Phone className="w-4 h-4" />
            WhatsApp
          </a>
        </nav>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-white bg-primary p-2 rounded-lg"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-t border-border p-4 shadow-2xl md:hidden animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a 
                key={link.label} 
                href={link.href}
                className="text-lg font-bold p-2 hover:bg-muted rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-secondary text-white py-4 rounded-xl font-black"
            >
              <Phone className="w-5 h-5" />
              WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
