import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertStudentProfileSchema, 
  insertScholarshipSchema,
  type StudentProfile,
  type Scholarship 
} from "@shared/schema";
import { generateScholarshipMatches, generateApplicationGuidance } from "./services/gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get student profile by user ID
  app.get("/api/profile/:userId", async (req, res) => {
    try {
      const profile = await storage.getStudentProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Get student profile by profile ID
  app.get("/api/profile/id/:profileId", async (req, res) => {
    try {
      const profile = await storage.getStudentProfileById(req.params.profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Create student profile
  app.post("/api/profile", async (req, res) => {
    try {
      console.log("Creating profile with data:", req.body);
      
      // Validate email on backend
      const email = req.body.profile?.email;
      if (!email || (!email.endsWith('@gmail.com') && !email.endsWith('@yahoo.com') && !email.endsWith('@rediffmail.com'))) {
        return res.status(400).json({ message: "Email must be from @gmail.com, @yahoo.com, or @rediffmail.com" });
      }

      // Validate GPA if provided
      if (req.body.profile?.gpa && !/^[0-9]+(\.[0-9]{1,2})?$/.test(req.body.profile.gpa)) {
        return res.status(400).json({ message: "GPA must be a valid number" });
      }
      
      const profileData = insertStudentProfileSchema.parse(req.body.profile);
      const userId = req.body.userId;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Check if user exists, create if not
      let user = await storage.getUserByUsername(userId);
      if (!user) {
        user = await storage.createUser({
          username: userId,
          password: "temp-password" // In a real app, this would be properly handled
        });
      }

      const profile = await storage.createStudentProfile({
        ...profileData,
        userId: user.id
      });

      console.log("Profile created successfully:", profile);
      res.json(profile);
    } catch (error: any) {
      console.error("Error creating profile:", error);
      res.status(400).json({ message: "Failed to create profile", error: error.message });
    }
  });

  // Update student profile
  app.put("/api/profile/:id", async (req, res) => {
    try {
      const profileData = insertStudentProfileSchema.partial().parse(req.body);
      const profile = await storage.updateStudentProfile(req.params.id, profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Seed sample data endpoint
  app.post("/api/seed-data", async (req, res) => {
    try {
      await storage.seedSampleData();
      res.json({ message: "Sample data seeded successfully" });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ message: "Failed to seed sample data" });
    }
  });

  // Get all scholarships
  app.get("/api/scholarships", async (req, res) => {
    try {
      const scholarships = await storage.getAllScholarships();
      res.json(scholarships);
    } catch (error) {
      console.error("Error fetching scholarships:", error);
      res.status(500).json({ message: "Failed to fetch scholarships" });
    }
  });

  // Search scholarships with filters
  app.get("/api/scholarships/search", async (req, res) => {
    try {
      const filters = {
        type: req.query.type as string,
        tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
        fieldOfStudy: req.query.fieldOfStudy as string,
        educationLevel: req.query.educationLevel as string,
      };

      const scholarships = await storage.searchScholarships(filters);
      res.json(scholarships);
    } catch (error) {
      console.error("Error searching scholarships:", error);
      res.status(500).json({ message: "Failed to search scholarships" });
    }
  });

  // Generate AI-powered scholarship matches
  app.post("/api/matches/generate", async (req, res) => {
    try {
      const { profileId } = req.body;
      
      if (!profileId) {
        return res.status(400).json({ message: "Profile ID is required" });
      }

      const profile = await storage.getStudentProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const scholarships = await storage.getAllScholarships();
      const matches = await generateScholarshipMatches(profile, scholarships);

      // Save matches to database
      const savedMatches = [];
      for (const match of matches) {
        if (match.matchScore >= 30) { // Only save matches above 30%
          const savedMatch = await storage.createScholarshipMatch({
            profileId,
            scholarshipId: match.scholarshipId,
            matchScore: match.matchScore,
            aiReasoning: match.reasoning
          });
          savedMatches.push(savedMatch);
        }
      }

      res.json({ matches: savedMatches });
    } catch (error) {
      console.error("Error generating matches:", error);
      res.status(500).json({ message: "Failed to generate matches" });
    }
  });

  // Get scholarship matches for a profile
  app.get("/api/matches/:profileId", async (req, res) => {
    try {
      const statusFilter = req.query.status as string;
      const matches = await storage.getScholarshipMatches(req.params.profileId, statusFilter);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Update match status (favorite, applied, etc.)
  app.put("/api/matches/:matchId/status", async (req, res) => {
    try {
      const { status } = req.body;
      const updatedMatch = await storage.updateMatchStatus(req.params.matchId, status);
      res.json(updatedMatch);
    } catch (error) {
      console.error("Error updating match status:", error);
      res.status(500).json({ message: "Failed to update match status" });
    }
  });

  // Generate application guidance
  app.post("/api/guidance", async (req, res) => {
    try {
      const { profileId, scholarshipId } = req.body;

      if (!profileId || !scholarshipId) {
        return res.status(400).json({ message: "Profile ID and Scholarship ID are required" });
      }

      // Check if guidance already exists
      const existingGuidance = await storage.getApplicationGuidance(profileId, scholarshipId);
      if (existingGuidance) {
        return res.json(existingGuidance);
      }

      const profile = await storage.getStudentProfile(profileId);
      const scholarship = await storage.getScholarshipById(scholarshipId);

      if (!profile || !scholarship) {
        return res.status(404).json({ message: "Profile or scholarship not found" });
      }

      const guidance = await generateApplicationGuidance(profile, scholarship);
      
      const savedGuidance = await storage.createApplicationGuidance({
        profileId,
        scholarshipId,
        essayTips: guidance.essayTips,
        checklist: typeof guidance.checklist === 'string' ? guidance.checklist : JSON.stringify(guidance.checklist),
        improvementSuggestions: guidance.improvementSuggestions
      });

      res.json(savedGuidance);
    } catch (error) {
      console.error("Error generating guidance:", error);
      res.status(500).json({ message: "Failed to generate guidance" });
    }
  });

  // Get application guidance
  app.get("/api/guidance/:profileId/:scholarshipId", async (req, res) => {
    try {
      const guidance = await storage.getApplicationGuidance(
        req.params.profileId,
        req.params.scholarshipId
      );
      
      if (!guidance) {
        return res.status(404).json({ message: "Guidance not found" });
      }

      res.json(guidance);
    } catch (error) {
      console.error("Error fetching guidance:", error);
      res.status(500).json({ message: "Failed to fetch guidance" });
    }
  });

  // Seed initial scholarship data (for development)
  app.post("/api/seed/scholarships", async (req, res) => {
    try {
      const seedScholarships = [
        {
          title: "National Merit STEM Scholarship",
          organization: "Future Scientists Foundation",
          amount: "$15,000",
          deadline: "2024-03-15",
          description: "Supporting outstanding students pursuing STEM degrees with demonstrated academic excellence and research potential.",
          requirements: "Minimum 3.7 GPA, STEM major, research experience preferred, US citizen or permanent resident",
          tags: ["STEM", "Merit-Based", "Undergraduate", "Research"],
          type: "merit-based",
          eligibilityGpa: "3.7",
          eligibleFields: ["Computer Science", "Engineering", "Mathematics", "Physics", "Chemistry", "Biology"],
          eligibleLevels: ["undergraduate"]
        },
        {
          title: "Tech Diversity Excellence Award",
          organization: "TechForward Initiative",
          amount: "$8,500",
          deadline: "2024-04-01",
          description: "Promoting diversity in technology fields by supporting underrepresented students with financial aid and mentorship.",
          requirements: "Technology-related major, demonstrate financial need, underrepresented minority status, minimum 3.0 GPA",
          tags: ["Technology", "Diversity", "Need-Based", "Mentorship"],
          type: "need-based",
          eligibilityGpa: "3.0",
          eligibleFields: ["Computer Science", "Information Technology", "Software Engineering"],
          eligibleLevels: ["undergraduate", "graduate"]
        },
        {
          title: "Community Leadership Grant",
          organization: "Local Community Foundation",
          amount: "$3,000",
          deadline: "2024-05-15",
          description: "Recognizing students who demonstrate exceptional leadership and community service commitment.",
          requirements: "Minimum 100 hours community service, leadership role in organization, any major, 3.2+ GPA",
          tags: ["Leadership", "Community Service", "Local"],
          type: "merit-based",
          eligibilityGpa: "3.2",
          eligibleFields: [],
          eligibleLevels: ["undergraduate"]
        },
        {
          title: "Environmental Innovation Award",
          organization: "Green Future Initiative",
          amount: "$12,000",
          deadline: "2024-06-30",
          description: "Supporting students developing innovative solutions for environmental challenges and sustainability.",
          requirements: "Environmental science or related field, research project focused on sustainability, minimum 3.5 GPA",
          tags: ["Environmental Science", "Innovation", "Research-Based", "Sustainability"],
          type: "merit-based",
          eligibilityGpa: "3.5",
          eligibleFields: ["Environmental Science", "Environmental Engineering", "Renewable Energy", "Biology"],
          eligibleLevels: ["undergraduate", "graduate"]
        },
        {
          title: "First Generation College Student Support",
          organization: "Educational Equity Foundation",
          amount: "$5,000",
          deadline: "2024-04-30",
          description: "Supporting first-generation college students with financial aid and academic support services.",
          requirements: "First-generation college student status, demonstrate financial need, minimum 2.8 GPA",
          tags: ["First-Generation", "Need-Based", "Academic Support"],
          type: "need-based",
          eligibilityGpa: "2.8",
          eligibleFields: [],
          eligibleLevels: ["undergraduate"]
        }
      ];

      for (const scholarshipData of seedScholarships) {
        await storage.createScholarship({
          ...scholarshipData,
          tags: JSON.stringify(scholarshipData.tags),
          eligibleFields: JSON.stringify(scholarshipData.eligibleFields),
          eligibleLevels: JSON.stringify(scholarshipData.eligibleLevels)
        });
      }

      res.json({ message: "Scholarships seeded successfully", count: seedScholarships.length });
    } catch (error) {
      console.error("Error seeding scholarships:", error);
      res.status(500).json({ message: "Failed to seed scholarships" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
