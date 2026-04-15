import { Facebook, Instagram, Linkedin, Phone } from "lucide-react";

const WHATSAPP_NUMBER = "5541997925357";

const Footer = () => {
  return (
    <footer className="py-16 px-4 bg-foreground text-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Info */}
          <div className="space-y-4 col-span-1 lg:col-span-1">
            <h3 className="text-2xl font-black tracking-tight text-primary">CONTEMPLAR</h3>
            <p className="text-sm text-background/60 leading-relaxed max-w-xs">
              Sua consultoria inteligente para conquistar imóveis, veículos e investimentos sem juros abusivos. Planejamento estratégico para o seu patrimônio.
            </p>
          </div>

          {/* Useful Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Links Úteis</h3>
            <ul className="space-y-3 text-sm text-background/50">
              <li>
                <a href="https://www.abac.org.br/para-voce" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  ABAC — Para Você
                </a>
              </li>
              <li>
                <a href="https://www.abac.org.br/perguntas-frequentes" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  ABAC — Perguntas Frequentes
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Acesso Administrativo</a>
              </li>
            </ul>
          </div>

          {/* Social Social */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Acompanhe nas Redes</h3>
            <div className="flex gap-3">
              <a href="#" aria-label="Facebook" className="w-11 h-11 rounded-full bg-background/5 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Instagram" className="w-11 h-11 rounded-full bg-background/5 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="LinkedIn" className="w-11 h-11 rounded-full bg-background/5 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Fale Agora</h3>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white/5 hover:bg-green-600/20 px-4 py-2 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-background/40">Atendimento via WhatsApp</p>
                <p className="text-sm font-bold text-background/80 group-hover:text-green-500">(41) 99792-5357</p>
              </div>
            </a>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 text-center sm:flex sm:justify-between items-center text-sm text-background/40">
          <p>© {new Date().getFullYear()} Fabrício Rodrigues Honório — Especialista em Consórcio Inteligente.</p>
          <p className="mt-2 sm:mt-0 font-medium">Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
