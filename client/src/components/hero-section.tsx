import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface HeroSectionProps {
  onStartAnalysis: () => void;
  buttonText?: string;
}

export default function HeroSection({ onStartAnalysis, buttonText = "Start Your Analysis" }: HeroSectionProps) {
  return (
    <section className="bg-gradient-to-r from-primary to-secondary text-white py-16 overflow-hidden">
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
        .animate-slide-left { animation: slideInLeft 0.8s ease-out; }
        .animate-slide-right { animation: slideInRight 0.8s ease-out; }
        .animate-fade-up { animation: fadeInUp 0.8s ease-out 0.2s both; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <div className="absolute -bottom-6 -left-6 bg-white rounded-lg p-4 shadow-lg animate-pulse-glow">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">94% Success Rate</p>
                  <p className="text-sm text-slate-600">Students find funding</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
