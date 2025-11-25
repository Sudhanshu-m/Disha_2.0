import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Globe, Star } from "lucide-react";

const counselors = [
  {
    id: 1,
    name: "Dr. Priya Sharma",
    title: "Senior Scholarship Advisor",
    specialization: "STEM & Engineering",
    experience: "10+ years",
    rating: 4.9,
    reviews: 245,
    email: "priya.sharma@dishiai.com",
    phone: "+91-9876-543-210",
    bio: "Expert in matching students with technology and engineering scholarships. Has helped 500+ students secure funding.",
    certifications: ["NACAC Certified", "Financial Aid Specialist"],
    color: "from-blue-500 to-blue-600"
  },
  {
    id: 2,
    name: "Rajesh Kumar",
    title: "Scholarship Coach",
    specialization: "Merit-Based Scholarships",
    experience: "8+ years",
    rating: 4.8,
    reviews: 189,
    email: "rajesh.kumar@dishiai.com",
    phone: "+91-8765-432-109",
    bio: "Specializes in merit-based scholarships and competitive fellowships. Known for personalized essay guidance.",
    certifications: ["MBA", "College Counselor"],
    color: "from-purple-500 to-purple-600"
  },
  {
    id: 3,
    name: "Anjali Patel",
    title: "Financial Aid Specialist",
    specialization: "Need-Based Funding",
    experience: "12+ years",
    rating: 4.95,
    reviews: 312,
    email: "anjali.patel@dishiai.com",
    phone: "+91-7654-321-098",
    bio: "Expert in need-based scholarships and government funding programs. Helped students secure over ₹50 crores.",
    certifications: ["Financial Planning", "Education Counselor"],
    color: "from-green-500 to-green-600"
  },
  {
    id: 4,
    name: "Vikram Singh",
    title: "Application Strategy Expert",
    specialization: "Application Essays & Portfolio",
    experience: "7+ years",
    rating: 4.7,
    reviews: 156,
    email: "vikram.singh@dishiai.com",
    phone: "+91-6543-210-987",
    bio: "Focuses on crafting compelling applications and building strong portfolios. Specializes in international scholarships.",
    certifications: ["Creative Writing", "International Education"],
    color: "from-orange-500 to-orange-600"
  },
  {
    id: 5,
    name: "Neha Verma",
    title: "Career Guidance Counselor",
    specialization: "Career Planning & Scholarships",
    experience: "9+ years",
    rating: 4.85,
    reviews: 201,
    email: "neha.verma@dishiai.com",
    phone: "+91-5432-109-876",
    bio: "Connects scholarship opportunities with career goals. Helps students plan their educational path strategically.",
    certifications: ["Career Coach", "Education Specialist"],
    color: "from-pink-500 to-pink-600"
  },
  {
    id: 6,
    name: "Arjun Desai",
    title: "Interview Preparation Coach",
    specialization: "Scholarship Interview Prep",
    experience: "6+ years",
    rating: 4.75,
    reviews: 128,
    email: "arjun.desai@dishiai.com",
    phone: "+91-4321-098-765",
    bio: "Prepares students for scholarship interviews with mock sessions and confidence building techniques.",
    certifications: ["Interview Coach", "Communication Expert"],
    color: "from-indigo-500 to-indigo-600"
  }
];

export default function Guidance() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">Expert Counselors</h1>
          <p className="text-lg text-slate-600">Connect with our team of experienced scholarship advisors to maximize your funding opportunities</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counselors.map((counselor) => (
            <Card key={counselor.id} className="hover:shadow-lg transition-shadow overflow-hidden" data-testid={`card-counselor-${counselor.id}`}>
              <div className={`h-24 bg-gradient-to-r ${counselor.color}`} />
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 mb-1" data-testid={`text-name-${counselor.id}`}>
                    {counselor.name}
                  </h3>
                  <p className="text-sm text-primary font-medium mb-2">{counselor.title}</p>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(counselor.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-slate-600">{counselor.rating} ({counselor.reviews} reviews)</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">{counselor.specialization}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{counselor.experience} experience</p>
                </div>

                <p className="text-sm text-slate-600 mb-4" data-testid={`text-bio-${counselor.id}`}>
                  {counselor.bio}
                </p>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Certifications:</p>
                  <div className="flex flex-wrap gap-1">
                    {counselor.certifications.map((cert, idx) => (
                      <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="space-y-2 mb-4">
                    <a href={`mailto:${counselor.email}`} className="flex items-center space-x-2 text-sm text-slate-600 hover:text-primary transition-colors" data-testid={`link-email-${counselor.id}`}>
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{counselor.email}</span>
                    </a>
                    <a href={`tel:${counselor.phone}`} className="flex items-center space-x-2 text-sm text-slate-600 hover:text-primary transition-colors" data-testid={`link-phone-${counselor.id}`}>
                      <Phone className="w-4 h-4" />
                      <span>{counselor.phone}</span>
                    </a>
                  </div>
                  <Button className="w-full bg-primary text-white hover:bg-blue-700" data-testid={`button-book-${counselor.id}`}>
                    Book Consultation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
