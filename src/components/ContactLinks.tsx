import { MessageCircle, Mail, Instagram } from "lucide-react";

const WHATSAPP_NUMBER = "5541997925357";

const ContactLinks = () => {
  return (
    <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="container max-w-4xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Fale Diretamente Comigo</h2>
        <p className="text-primary-foreground/80 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
          Tire suas dúvidas agora e receba um atendimento personalizado para o seu perfil de investimento.
        </p>
        
        <div className="flex flex-wrap justify-center gap-6">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá Fabrício! Vi seu site e quero saber mais sobre consórcio inteligente.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-4 rounded-full font-black text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            Atendimento via WhatsApp
          </a>
          
          <div className="flex gap-4">
            <a
              href="mailto:fabricio@consorciointeligente.com"
              className="flex items-center justify-center w-14 h-14 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-full transition-all hover:-translate-y-1 shadow-lg"
              title="Enviar E-mail"
            >
              <Mail className="w-6 h-6" />
            </a>
            <a
              href="https://instagram.com/fabriciohonorio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-14 h-14 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-full transition-all hover:-translate-y-1 shadow-lg"
              title="Siga no Instagram"
            >
              <Instagram className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactLinks;
