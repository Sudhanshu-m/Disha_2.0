import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface HeroSectionProps {
  onStartAnalysis: () => void;
  buttonText?: string;
}

export default function HeroSection({ onStartAnalysis, buttonText = "Start Your Analysis" }: HeroSectionProps) {
  const scholarshipEmojis = ['📚', '🎓', '🏆', '✨', '💡', '🌟', '📖', '🎯'];
  
  return (
    <section className="relative bg-gradient-to-r from-primary to-secondary text-white py-16 overflow-hidden">
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
          50% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.6); }
        }
        @keyframes gradient-shift {
          0% { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 50%, var(--color-primary) 100%); }
          50% { background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 50%, var(--color-secondary) 100%); }
          100% { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 50%, var(--color-primary) 100%); }
        }
        @keyframes float-up-seamless {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.2; }
          5% { opacity: 0.3; }
          95% { opacity: 0.3; }
          100% { transform: translateY(-450px) rotate(360deg); opacity: 0.2; }
        }
        .animate-slide-left { animation: slideInLeft 0.8s ease-out; }
        .animate-slide-right { animation: slideInRight 0.8s ease-out; }
        .animate-fade-up { animation: fadeInUp 0.8s ease-out 0.2s both; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-gradient { 
          animation: gradient-shift 8s ease infinite;
        }
        .hero-section-bg {
          position: absolute;
          inset: 0;
          animation: gradient-shift 8s ease infinite;
          z-index: 0;
        }
        .floating-emoji {
          position: absolute;
          font-size: 2.5rem;
          opacity: 0.3;
          filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.3));
          pointer-events: none;
          bottom: 0;
        }
        .emoji-1 { animation: float-up-seamless 8s linear infinite; left: 10%; }
        .emoji-2 { animation: float-up-seamless 9s linear infinite; left: 25%; animation-delay: 1s; }
        .emoji-3 { animation: float-up-seamless 10s linear infinite; left: 40%; animation-delay: 2s; }
        .emoji-4 { animation: float-up-seamless 8.5s linear infinite; left: 55%; animation-delay: 0.5s; }
        .emoji-5 { animation: float-up-seamless 9.5s linear infinite; left: 70%; animation-delay: 1.5s; }
        .emoji-6 { animation: float-up-seamless 8s linear infinite; left: 85%; animation-delay: 2.5s; }
      `}</style>
      
      {/* Animated gradient background */}
      <div className="hero-section-bg"></div>
      
      {/* Animated floating emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-5">
        <div className="floating-emoji emoji-1">📚</div>
        <div className="floating-emoji emoji-2">🎓</div>
        <div className="floating-emoji emoji-3">🏆</div>
        <div className="floating-emoji emoji-4">✨</div>
        <div className="floating-emoji emoji-5">💡</div>
        <div className="floating-emoji emoji-6">🌟</div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-left">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Discover Your Perfect
              <span className="text-yellow-300"> Scholarship Match</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed animate-fade-up">
              Our AI analyzes your academic profile, skills, and background to find personalized scholarship opportunities you never knew existed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{animationDelay: '0.4s'}}>
              <Button 
                onClick={onStartAnalysis}
                className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                data-testid="button-start-analysis"
              >
                {buttonText}
              </Button>
            </div>
            <div className="mt-8 flex items-center space-x-6 text-blue-100 animate-fade-up" style={{animationDelay: '0.6s'}}>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5" />
                <span>50,000+ Scholarships</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5" />
                <span>AI-Powered Matching</span>
              </div>
            </div>
          </div>
          <div className="relative animate-slide-right">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Diverse group of students collaborating on laptops" 
              className="rounded-xl shadow-2xl w-full h-auto hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
