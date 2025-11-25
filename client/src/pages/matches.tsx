import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Star, Clock, MapPin, Building2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ScholarshipMatch, Scholarship } from "@shared/schema";

export default function Matches() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  const profileId = localStorage.getItem('currentProfileId') || null;
  
  // Redirect to home if not authenticated
  if (!profileId) {
    setTimeout(() => navigate('/'), 0);
    return null;
  }

  const { data: matches, isLoading } = useQuery<(ScholarshipMatch & { scholarship: Scholarship })[]>({
    queryKey: ['/api/matches', profileId, 'new'],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${profileId}?status=new`);
      if (!res.ok) throw new Error('Failed to fetch matches');
      return res.json();
    },
    enabled: !!profileId,
  });

  const updateMatchMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: string; status: string }) => {
      return await apiRequest("PUT", `/api/matches/${matchId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches', profileId, 'new'] });
    },
  });

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!matches || currentIndex >= matches.length || isAnimating) return;

    setIsAnimating(true);
    const currentMatch = matches[currentIndex];

    // Update match status based on swipe direction
    const status = direction === 'right' ? 'favorited' : 'passed';
    updateMatchMutation.mutate({ matchId: currentMatch.id, status });

    // Show feedback toast
    if (direction === 'right') {
      toast({
        title: "Great Choice! 💚",
        description: `You liked ${currentMatch.scholarship.title}`,
      });
    } else {
      toast({
        title: "Passed",
        description: "We'll find you better matches!",
      });
    }

    // Move to next card after animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      handleSwipe('left');
    } else if (event.key === 'ArrowRight') {
      handleSwipe('right');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    cardRef.current?.setAttribute('data-start-x', touch.clientX.toString());
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !cardRef.current) return;

    const touch = e.touches[0];
    const startX = parseFloat(cardRef.current.getAttribute('data-start-x') || '0');
    const currentX = touch.clientX;
    const offset = currentX - startX;

    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // Determine swipe direction based on offset
    if (Math.abs(dragOffset) > 100) {
      if (dragOffset > 0) {
        handleSwipe('right');
      } else {
        handleSwipe('left');
      }
    }

    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    cardRef.current?.setAttribute('data-start-x', e.clientX.toString());
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !cardRef.current) return;

    const startX = parseFloat(cardRef.current.getAttribute('data-start-x') || '0');
    const currentX = e.clientX;
    const offset = currentX - startX;

    setDragOffset(offset);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // Determine swipe direction based on offset
    if (Math.abs(dragOffset) > 100) {
      if (dragOffset > 0) {
        handleSwipe('right');
      } else {
        handleSwipe('left');
      }
    }

    setDragOffset(0);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, matches, isAnimating]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cardRef.current) return;

      const startX = parseFloat(cardRef.current.getAttribute('data-start-x') || '0');
      const currentX = e.clientX;
      const offset = currentX - startX;

      setDragOffset(offset);
    };

    const handleGlobalMouseUp = () => {
      if (!isDragging) return;

      setIsDragging(false);

      // Determine swipe direction based on offset
      if (Math.abs(dragOffset) > 100) {
        if (dragOffset > 0) {
          handleSwipe('right');
        } else {
          handleSwipe('left');
        }
      }

      setDragOffset(0);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Loading your matches...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">No Matches Yet</h2>
            <p className="text-slate-600 mb-8">Create a profile and generate matches to start swiping!</p>
            <Button onClick={() => window.location.href = '/profile'}>
              Create Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentIndex >= matches.length) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">🎉 You've Reviewed All Matches!</h2>
            <p className="text-slate-600 mb-8">Check your dashboard to see your favorited scholarships and start applying.</p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              View Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentMatch = matches[currentIndex];
  const scholarship = currentMatch.scholarship;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Disha Ai Scholarship Matches</h1>
          <p className="text-slate-600">
            Swipe right to save, left to pass • {currentIndex + 1} of {matches.length}
          </p>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / matches.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Swipe Card */}
        <div className="relative h-[600px] mb-8">
          <Card 
            ref={cardRef}
            className={`absolute inset-0 shadow-xl border-2 cursor-grab active:cursor-grabbing select-none ${
              isAnimating 
                ? 'transition-all duration-300 ease-out scale-95 opacity-0' 
                : 'transition-transform duration-100 ease-out scale-100 opacity-100'
            }`}
            style={{
              transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`,
              opacity: isDragging ? Math.max(0.8, 1 - Math.abs(dragOffset) / 400) : 1,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out, opacity 0.2s ease-out',
            }}
            data-testid={`card-scholarship-${scholarship.id}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{scholarship.title}</CardTitle>
                  <div className="flex items-center text-slate-600 mb-2">
                    <Building2 className="w-4 h-4 mr-2" />
                    <span>{scholarship.organization}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-600 font-semibold text-lg mb-1">
                    {scholarship.amount?.replace('$', '₹') || '₹0'}
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {currentMatch.matchScore}% Match
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">About</h3>
                <p className="text-slate-600 leading-relaxed">{scholarship.description}</p>
              </div>

              {/* Requirements */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Requirements</h3>
                <p className="text-slate-600">{scholarship.requirements}</p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-slate-500" />
                  <span className="text-sm text-slate-600">Deadline: {scholarship.deadline}</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-slate-500" />
                  <span className="text-sm text-slate-600 capitalize">{scholarship.type}</span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="flex flex-wrap gap-2">
                  {scholarship.tags && (typeof scholarship.tags === 'string' ? JSON.parse(scholarship.tags) : scholarship.tags).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* AI Reasoning */}
              {currentMatch.aiReasoning && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">🤖 Why This Matches You</h3>
                  <p className="text-blue-700 text-sm">{currentMatch.aiReasoning}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-8">
          <Button
            size="lg"
            variant="outline"
            className="w-16 h-16 rounded-full border-red-300 hover:bg-red-50 hover:border-red-400 transition-all duration-200 hover:scale-110 active:scale-95"
            onClick={() => handleSwipe('left')}
            disabled={isAnimating}
            data-testid="button-pass"
          >
            <X className="w-8 h-8 text-red-500" />
          </Button>

          <Button
            size="lg"
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 transition-all duration-200 hover:scale-110 active:scale-95"
            onClick={() => handleSwipe('right')}
            disabled={isAnimating}
            data-testid="button-like"
          >
            <Heart className="w-8 h-8 text-white fill-white" />
          </Button>
        </div>

        {/* Swipe Indicators */}
        {isDragging && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-between px-8 z-10">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
              dragOffset < -50 ? 'bg-red-100 scale-110 shadow-lg' : 'bg-gray-100 scale-100'
            }`}>
              <X className={`w-8 h-8 transition-colors duration-200 ${dragOffset < -50 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
              dragOffset > 50 ? 'bg-green-100 scale-110 shadow-lg' : 'bg-gray-100 scale-100'
            }`}>
              <Heart className={`w-8 h-8 transition-colors duration-200 ${dragOffset > 50 ? 'text-green-500 fill-green-500' : 'text-gray-400'}`} />
            </div>
          </div>
        )}

        {/* Interaction Hints */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            Swipe or drag left to pass, right to save • Use keyboard: ← →
          </p>
        </div>
      </div>
    </div>
  );
}