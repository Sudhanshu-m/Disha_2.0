import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertStudentProfileSchema } from "@shared/schema";
import { useLocation } from "wouter";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string()
    .email("enter a valid email")
    .refine(
      (email) => 
        email.endsWith('@gmail.com') || 
        email.endsWith('@yahoo.com') || 
        email.endsWith('@rediffmail.com'),
      "enter a valid email"
    ),
  educationLevel: z.string().min(1, "Education level is required"),
  fieldOfStudy: z.string().min(1, "Field of study is required"),
  gpa: z.string()
    .optional()
    .refine(
      (gpa) => !gpa || /^[0-9]+(\.[0-9]{1,2})?$/.test(gpa),
      "GPA must be a number (e.g., 3.75)"
    ),
  graduationYear: z.string().min(1, "Graduation year is required"),
  skills: z.string()
    .optional()
    .refine(
      (skills) => !skills || skills.length > 10,
      "Skills must be more than 10 characters"
    ),
  activities: z.string()
    .optional()
    .refine(
      (activities) => !activities || activities.length > 10,
      "Activities must be more than 10 characters"
    ),
  financialNeed: z.string().min(1, "Financial need is required"),
  location: z.string().min(1, "Location is required"),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  onComplete?: () => void;
}

export default function ProfileForm({ onComplete }: ProfileFormProps) {
  const [step, setStep] = useState(1);
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Load draft from localStorage on mount
  const getDraftData = () => {
    const draft = localStorage.getItem('profileDraft');
    if (draft) {
      try {
        return JSON.parse(draft);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const draftData = getDraftData();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: draftData || {
      name: "",
      email: "",
      educationLevel: "",
      fieldOfStudy: "",
      gpa: "",
      graduationYear: "",
      skills: "",
      activities: "",
      financialNeed: "",
      location: "",
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const userId = `user-${Date.now()}`; // Generate a unique user ID
      console.log("Sending profile data:", { profile: data, userId });
      const response = await apiRequest("POST", "/api/profile", {
        profile: data,
        userId: userId
      });
      console.log("Profile creation response:", response);
      return response;
    },
    onSuccess: (response: any) => {
      console.log("Profile created successfully:", response);
      
      if (!response || typeof response !== 'object' || !response.id) {
        console.error("Invalid profile response:", response);
        toast({
          title: "Error",
          description: "Profile creation failed - invalid server response format",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Profile Created Successfully", 
        description: "Your profile has been saved. Generating scholarship matches...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      // Store profile ID and user ID in localStorage for demo purposes
      localStorage.setItem('currentProfileId', response.id);
      localStorage.setItem('currentUserId', response.userId);
      
      // Clear draft after successful profile creation
      localStorage.removeItem('profileDraft');
      
      // Generate matches after profile creation with the correct profile ID
      console.log("Generating matches for profile:", response.id);
      generateMatchesMutation.mutate(response.id);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
      console.error("Profile creation error:", error);
    },
  });

  const generateMatchesMutation = useMutation({
    mutationFn: async (profileId: string) => {
      console.log("Generating matches for profile ID:", profileId);
      if (!profileId || profileId === 'null' || profileId === 'undefined') {
        throw new Error("Valid Profile ID is required for match generation");
      }
      return await apiRequest("POST", "/api/matches/generate", {
        profileId: profileId
      });
    },
    onSuccess: (response) => {
      console.log("Matches generated successfully:", response);
      toast({
        title: "Matches Generated",
        description: "Your personalized scholarship matches are ready!",
      });
      if (onComplete) {
        onComplete();
      } else {
        navigate("/profile");
      }
    },
    onError: (error) => {
      console.error("Match generation error:", error);
      toast({
        title: "Warning",
        description: "Profile created but match generation failed. You can generate matches from the dashboard.",
        variant: "destructive",
      });
      // Still navigate even if match generation fails
      if (onComplete) {
        onComplete();
      } else {
        navigate("/profile");
      }
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    // Check for form errors
    if (Object.keys(form.formState.errors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix all errors before submitting. Check the red error messages.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!data.name || !data.email || !data.educationLevel || !data.fieldOfStudy || 
        !data.graduationYear || !data.financialNeed || !data.location) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Extra validation for email
    if (!data.email.endsWith('@gmail.com') && !data.email.endsWith('@yahoo.com') && !data.email.endsWith('@rediffmail.com')) {
      toast({
        title: "Invalid Email",
        description: "Email must be from @gmail.com, @yahoo.com, or @rediffmail.com",
        variant: "destructive",
      });
      return;
    }
    
    // Skills and activities are optional
    console.log("Submitting form data:", data);
    createProfileMutation.mutate(data);
  };

  const saveDraft = () => {
    const currentData = form.getValues();
    localStorage.setItem('profileDraft', JSON.stringify(currentData));
    toast({
      title: "Draft Saved",
      description: "Your profile draft has been saved. You can continue later.",
    });
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Academic Information";
      case 2: return "Background & Activities";
      case 3: return "Preferences & Goals";
      default: return "Profile Setup";
    }
  };

  return (
    <div className="bg-slate-50 rounded-xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{getStepTitle()}</h2>
        <p className="text-slate-600">Help our AI understand your unique background</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= stepNum 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-300 text-slate-600'
              }`}
            >
              {stepNum}
            </div>
            {stepNum < 3 && (
              <div className="flex-1 h-1 bg-slate-200 mx-4 rounded">
                <div 
                  className={`h-full rounded transition-all duration-300 ${
                    step > stepNum ? 'bg-primary' : 'bg-slate-200'
                  }`}
                  style={{ width: step > stepNum ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your full name" 
                        {...field} 
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="your.email@example.com" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          form.trigger("email");
                        }}
                        onBlur={(e) => {
                          field.onBlur();
                          form.trigger("email");
                        }}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="educationLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Education Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-education-level">
                          <SelectValue placeholder="Select your level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high-school-senior">High School Senior</SelectItem>
                        <SelectItem value="undergraduate-freshman">Undergraduate - Freshman</SelectItem>
                        <SelectItem value="undergraduate-sophomore">Undergraduate - Sophomore</SelectItem>
                        <SelectItem value="undergraduate-junior">Undergraduate - Junior</SelectItem>
                        <SelectItem value="undergraduate-senior">Undergraduate - Senior</SelectItem>
                        <SelectItem value="graduate-student">Graduate Student</SelectItem>
                        <SelectItem value="doctoral-student">Doctoral Student</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fieldOfStudy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field of Study</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Computer Science, Biology" 
                        {...field} 
                        data-testid="input-field-of-study"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gpa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current GPA (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="3.75"
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        {...field} 
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                            field.onChange(value);
                            form.trigger("gpa");
                          }
                        }}
                        onBlur={(e) => {
                          field.onBlur();
                          form.trigger("gpa");
                        }}
                        data-testid="input-gpa"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="graduationYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Graduation Year</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-graduation-year">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2027">2027</SelectItem>
                        <SelectItem value="2028">2028</SelectItem>
                        <SelectItem value="2029">2029</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills & Interests (Optional - minimum 10 characters)</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={4}
                        placeholder="List your key skills, programming languages, research interests, hobbies, etc." 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e);
                          form.trigger("skills");
                        }}
                        onBlur={(e) => {
                          field.onBlur();
                          form.trigger("skills");
                        }}
                        data-testid="textarea-skills"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extracurricular Activities (Optional - minimum 10 characters)</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={4}
                        placeholder="Clubs, volunteer work, internships, leadership roles, etc." 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e);
                          form.trigger("activities");
                        }}
                        onBlur={(e) => {
                          field.onBlur();
                          form.trigger("activities");
                        }}
                        data-testid="textarea-activities"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {step === 3 && (
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="financialNeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financial Need Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-financial-need">
                          <SelectValue placeholder="Select need level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low - Can afford most costs</SelectItem>
                        <SelectItem value="moderate">Moderate - Need some assistance</SelectItem>
                        <SelectItem value="high">High - Significant financial need</SelectItem>
                        <SelectItem value="critical">Critical - Cannot afford without aid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geographic Preference</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-location">
                          <SelectValue placeholder="Select preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="local">Local/State only</SelectItem>
                        <SelectItem value="national">National</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                        <SelectItem value="no-preference">No preference</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <div className="flex justify-between mt-8">
            <div className="flex space-x-4">
              {step > 1 && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={prevStep}
                  data-testid="button-previous"
                >
                  Previous
                </Button>
              )}
              <Button 
                type="button" 
                variant="outline"
                onClick={saveDraft}
                data-testid="button-save-draft"
              >
                Save Draft
              </Button>
            </div>
            
            {step < 3 ? (
              <Button 
                type="button" 
                onClick={nextStep}
                data-testid="button-next"
              >
                Next Step
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={createProfileMutation.isPending || generateMatchesMutation.isPending}
                data-testid="button-analyze-profile"
              >
                {createProfileMutation.isPending || generateMatchesMutation.isPending 
                  ? "Creating Profile..." 
                  : "Go to Profile"
                }
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
