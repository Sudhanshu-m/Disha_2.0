import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { Scholarship } from "@shared/schema";

const SCHOLARSHIPS_PER_PAGE = 12;

export default function Opportunities() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: scholarships, isLoading } = useQuery<Scholarship[]>({
    queryKey: ['/api/scholarships'],
    queryFn: async () => {
      const res = await fetch('/api/scholarships');
      if (!res.ok) throw new Error('Failed to fetch scholarships');
      return res.json();
    },
  });

  const totalPages = scholarships ? Math.ceil(scholarships.length / SCHOLARSHIPS_PER_PAGE) : 0;
  const startIndex = (currentPage - 1) * SCHOLARSHIPS_PER_PAGE;
  const endIndex = startIndex + SCHOLARSHIPS_PER_PAGE;
  const paginatedScholarships = scholarships?.slice(startIndex, endIndex) || [];

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">Browse All Scholarships</h1>
          <p className="text-lg">Explore our complete collection of scholarship opportunities</p>
          {!isLoading && scholarships && (
            <p className="text-sm mt-2">Showing {startIndex + 1} to {Math.min(endIndex, scholarships.length)} of {scholarships.length} scholarships</p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div>Loading scholarships...</div>
          </div>
        ) : !scholarships || scholarships.length === 0 ? (
          <div className="text-center py-12">
            <p>No scholarships available</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedScholarships.map((scholarship) => (
                <Card key={scholarship.id} className="hover:shadow-lg transition-shadow" data-testid={`card-scholarship-${scholarship.id}`}>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2" data-testid={`text-title-${scholarship.id}`}>
                        {scholarship.title}
                      </h3>
                      <p className="text-sm mb-3" data-testid={`text-organization-${scholarship.id}`}>
                        {scholarship.organization}
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Amount</span>
                        <span className="font-semibold" data-testid={`text-amount-${scholarship.id}`}>
                          {scholarship.amount?.replace('$', '₹') || '₹0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Type</span>
                        <Badge variant="secondary" className="text-xs">{scholarship.type}</Badge>
                      </div>
                    </div>

                    <p className="text-sm mb-4 line-clamp-2" data-testid={`text-description-${scholarship.id}`}>
                      {scholarship.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {(typeof scholarship.tags === 'string' ? JSON.parse(scholarship.tags) : scholarship.tags).slice(0, 3).map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center space-x-1 text-sm mb-3">
                        <Clock className="w-4 h-4" />
                        <span data-testid={`text-deadline-${scholarship.id}`}>Due: {scholarship.deadline}</span>
                      </div>
                      <Button className="w-full" data-testid={`button-apply-${scholarship.id}`}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-4 mt-12">
              <Button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
              </div>

              <Button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2"
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
