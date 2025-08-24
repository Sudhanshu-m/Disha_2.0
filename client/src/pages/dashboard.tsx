import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import ScholarshipCard from "@/components/scholarship-card";
import DeadlineTracker from "@/components/deadline-tracker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, DollarSign, Clock, Target } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ScholarshipMatch, Scholarship } from "@shared/schema";

export default function Dashboard() {
  const [filters, setFilters] = useState({
    type: "",
    amount: "",
    deadline: ""
  });
  const [sortBy, setSortBy] = useState("matchScore");
  const { toast } = useToast();

  // Mock profile ID - in a real app, this would come from authentication
  const profileId = "temp-profile-id";

  const { data: matches, isLoading } = useQuery<(ScholarshipMatch & { scholarship: Scholarship })[]>({
    queryKey: ['/api/matches', profileId],
    enabled: !!profileId,
  });

  const favoriteMatchMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: string; status: string }) => {
      return await apiRequest("PUT", `/api/matches/${matchId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches', profileId] });
      toast({
        title: "Updated",
        description: "Scholarship favorited successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update scholarship status",
        variant: "destructive",
      });
    },
  });

  const handleFavorite = (matchId: string) => {
    favoriteMatchMutation.mutate({ matchId, status: "favorited" });
  };

  const handleApply = (scholarship: Scholarship) => {
    toast({
      title: "Application Started",
      description: `Starting application for ${scholarship.title}`,
    });
  };

  const getStats = () => {
    if (!matches) return { totalMatches: 0, highMatch: 0, dueThisMonth: 0, totalValue: "$0" };
    
    const totalMatches = matches.length;
    const highMatch = matches.filter(m => m.matchScore >= 90).length;
    const dueThisMonth = matches.filter(m => {
      const deadline = new Date(m.scholarship.deadline);
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return deadline <= nextMonth && deadline >= now;
    }).length;

    // Calculate total value (simplified)
    const totalValue = matches.reduce((sum, match) => {
      const amount = match.scholarship.amount.replace(/[^0-9]/g, '');
      return sum + parseInt(amount || '0');
    }, 0);

    return {
      totalMatches,
      highMatch,
      dueThisMonth,
      totalValue: `$${(totalValue / 1000).toFixed(0)}K`
    };
  };

  const stats = getStats();

  const filteredAndSortedMatches = matches ? matches
    .filter(match => {
      if (filters.type && match.scholarship.type !== filters.type) return false;
      // Add more filtering logic as needed
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "matchScore":
          return b.matchScore - a.matchScore;
        case "amount":
          const aAmount = parseInt(a.scholarship.amount.replace(/[^0-9]/g, '') || '0');
          const bAmount = parseInt(b.scholarship.amount.replace(/[^0-9]/g, '') || '0');
          return bAmount - aAmount;
        case "deadline":
          return new Date(a.scholarship.deadline).getTime() - new Date(b.scholarship.deadline).getTime();
        default:
          return 0;
      }
    }) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Loading your dashboard...</h2>
            <p className="text-slate-600">Please wait while we fetch your scholarship matches.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Your Personalized Dashboard</h1>
          <p className="text-lg text-slate-600">AI-curated opportunities based on your unique profile</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="stat-total-matches">
                    {stats.totalMatches}
                  </p>
                  <p className="text-sm text-slate-600">Total Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="stat-high-match">
                    {stats.highMatch}
                  </p>
                  <p className="text-sm text-slate-600">High Match (90%+)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="stat-due-this-month">
                    {stats.dueThisMonth}
                  </p>
                  <p className="text-sm text-slate-600">Due This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="stat-total-value">
                    {stats.totalValue}
                  </p>
                  <p className="text-sm text-slate-600">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="opportunities" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="opportunities" data-testid="tab-opportunities">Scholarship Opportunities</TabsTrigger>
            <TabsTrigger value="deadlines" data-testid="tab-deadlines">Deadline Tracker</TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-6">
            {/* Filter and Sort Controls */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4">
                    <Select 
                      value={filters.type} 
                      onValueChange={(value) => setFilters({...filters, type: value === "all" ? "" : value})}
                    >
                      <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="merit-based">Merit-Based</SelectItem>
                        <SelectItem value="need-based">Need-Based</SelectItem>
                        <SelectItem value="field-specific">Field-Specific</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select 
                      value={filters.amount} 
                      onValueChange={(value) => setFilters({...filters, amount: value === "all" ? "" : value})}
                    >
                      <SelectTrigger className="w-[180px]" data-testid="select-filter-amount">
                        <SelectValue placeholder="Any Amount" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Amount</SelectItem>
                        <SelectItem value="1000">$1,000+</SelectItem>
                        <SelectItem value="5000">$5,000+</SelectItem>
                        <SelectItem value="10000">$10,000+</SelectItem>
                        <SelectItem value="25000">$25,000+</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select 
                      value={filters.deadline} 
                      onValueChange={(value) => setFilters({...filters, deadline: value === "all" ? "" : value})}
                    >
                      <SelectTrigger className="w-[180px]" data-testid="select-filter-deadline">
                        <SelectValue placeholder="All Deadlines" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Deadlines</SelectItem>
                        <SelectItem value="30">Next 30 days</SelectItem>
                        <SelectItem value="90">Next 3 months</SelectItem>
                        <SelectItem value="180">Next 6 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-slate-600">Sort by:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]" data-testid="select-sort-by">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="matchScore">Match Score</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="recent">Recently Added</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scholarship Cards */}
            {filteredAndSortedMatches.length > 0 ? (
              <div className="grid lg:grid-cols-2 gap-8">
                {filteredAndSortedMatches.map((match) => (
                  <ScholarshipCard
                    key={match.id}
                    match={match}
                    onFavorite={handleFavorite}
                    onApply={handleApply}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">No matches found</h3>
                  <p className="text-slate-600 mb-6">We couldn't find any scholarship matches for your profile yet. Try updating your profile or check back later for new opportunities.</p>
                  <div className="flex justify-center space-x-4">
                    <Button variant="outline">Update Profile</Button>
                    <Button>Seed Sample Data</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredAndSortedMatches.length > 0 && (
              <div className="text-center">
                <Button variant="outline" className="px-8 py-3" data-testid="button-load-more">
                  Load More Opportunities
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="deadlines">
            <DeadlineTracker />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
