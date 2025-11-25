import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import type { Scholarship } from "@shared/schema";

export default function Opportunities() {
  const { data: scholarships, isLoading } = useQuery<Scholarship[]>({
    queryKey: ['/api/scholarships'],
    queryFn: async () => {
      const res = await fetch('/api/scholarships');
      if (!res.ok) throw new Error('Failed to fetch scholarships');
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">Browse All Scholarships</h1>
          <p className="text-lg text-slate-600">Explore our complete collection of scholarship opportunities</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-slate-500">Loading scholarships...</div>
          </div>
        ) : !scholarships || scholarships.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No scholarships available</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scholarships.map((scholarship) => (
              <Card key={scholarship.id} className="hover:shadow-lg transition-shadow" data-testid={`card-scholarship-${scholarship.id}`}>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2" data-testid={`text-title-${scholarship.id}`}>
                      {scholarship.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-3" data-testid={`text-organization-${scholarship.id}`}>
                      {scholarship.organization}
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Amount</span>
                      <span className="font-semibold text-slate-800" data-testid={`text-amount-${scholarship.id}`}>
                        {scholarship.amount?.replace('$', '₹') || '₹0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Type</span>
                      <Badge variant="secondary" className="text-xs">{scholarship.type}</Badge>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-2" data-testid={`text-description-${scholarship.id}`}>
                    {scholarship.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {(typeof scholarship.tags === 'string' ? JSON.parse(scholarship.tags) : scholarship.tags).slice(0, 3).map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center space-x-1 text-sm text-slate-600 mb-3">
                      <Clock className="w-4 h-4" />
                      <span data-testid={`text-deadline-${scholarship.id}`}>Due: {scholarship.deadline}</span>
                    </div>
                    <Button className="w-full bg-primary text-white hover:bg-blue-700" data-testid={`button-apply-${scholarship.id}`}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
