import {
  studentProfiles,
  scholarships,
  scholarshipMatches,
  applicationGuidance,
  type StudentProfile,
  type InsertStudentProfile,
  type Scholarship,
  type InsertScholarship,
  type ScholarshipMatch,
  type InsertScholarshipMatch,
  type ApplicationGuidance,
  type InsertApplicationGuidance
} from "@shared/schema";
import { randomUUID } from 'crypto';
import { db } from "./db";
import { eq, desc, and, sql, gte, lte, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // Student profile methods
  getStudentProfile(profileId: string): Promise<StudentProfile | undefined>;
  getStudentProfileById(profileId: string): Promise<StudentProfile | undefined>;
  createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile>;
  updateStudentProfile(id: string, profile: Partial<InsertStudentProfile>): Promise<StudentProfile>;

  // Scholarship methods
  getAllScholarships(): Promise<Scholarship[]>;
  getScholarshipById(id: string): Promise<Scholarship | undefined>;
  createScholarship(scholarship: InsertScholarship): Promise<Scholarship>;
  searchScholarships(filters: {
    type?: string;
    minAmount?: number;
    tags?: string[];
    fieldOfStudy?: string;
    educationLevel?: string;
  }): Promise<Scholarship[]>;

  // Scholarship match methods
  getScholarshipMatches(profileId: string): Promise<(ScholarshipMatch & { scholarship: Scholarship })[]>;
  createScholarshipMatch(match: InsertScholarshipMatch): Promise<ScholarshipMatch>;
  updateMatchStatus(matchId: string, status: string): Promise<ScholarshipMatch>;

  // Application guidance methods
  getApplicationGuidance(profileId: string, scholarshipId: string): Promise<ApplicationGuidance | undefined>;
  createApplicationGuidance(guidance: InsertApplicationGuidance): Promise<ApplicationGuidance>;

  // Sample data seeding
  seedSampleData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getStudentProfile(profileId: string): Promise<StudentProfile | undefined> {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, profileId));
    return profile || undefined;
  }

  async getStudentProfileById(profileId: string): Promise<StudentProfile | undefined> {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, profileId));
    return profile || undefined;
  }

  async createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile> {
    const [newProfile] = await db
      .insert(studentProfiles)
      .values({
        ...profile,
        updatedAt: sql`datetime('now')`
      })
      .returning();
    return newProfile;
  }

  async updateStudentProfile(id: string, profile: Partial<InsertStudentProfile>): Promise<StudentProfile> {
    const [updatedProfile] = await db
      .update(studentProfiles)
      .set({
        ...profile,
        updatedAt: sql`datetime('now')`
      })
      .where(eq(studentProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  async getAllScholarships(): Promise<Scholarship[]> {
    return await db.select().from(scholarships)
      .where(eq(scholarships.isActive, true))
      .orderBy(desc(scholarships.createdAt));
  }

  async getScholarshipById(id: string): Promise<Scholarship | undefined> {
    const [scholarship] = await db.select().from(scholarships).where(eq(scholarships.id, id));
    return scholarship || undefined;
  }

  async createScholarship(scholarship: InsertScholarship): Promise<Scholarship> {
    const [newScholarship] = await db
      .insert(scholarships)
      .values(scholarship)
      .returning();
    return newScholarship;
  }

  async searchScholarships(filters: {
    type?: string;
    minAmount?: number;
    tags?: string[];
    fieldOfStudy?: string;
    educationLevel?: string;
  }): Promise<Scholarship[]> {
    const conditions = [eq(scholarships.isActive, true)];

    if (filters.type) {
      conditions.push(eq(scholarships.type, filters.type));
    }

    if (filters.tags && filters.tags.length > 0) {
      // This is a simplified version - in production you'd want more sophisticated tag matching
      conditions.push(sql`${scholarships.tags} && ${filters.tags}`);
    }

    if (filters.fieldOfStudy) {
      conditions.push(sql`${scholarships.eligibleFields} @> ${[filters.fieldOfStudy]} OR ${scholarships.eligibleFields} IS NULL`);
    }

    if (filters.educationLevel) {
      conditions.push(sql`${scholarships.eligibleLevels} @> ${[filters.educationLevel]} OR ${scholarships.eligibleLevels} IS NULL`);
    }

    return await db.select().from(scholarships)
      .where(and(...conditions))
      .orderBy(desc(scholarships.createdAt));
  }

  async getScholarshipMatches(profileId: string, statusFilter?: string): Promise<(ScholarshipMatch & { scholarship: Scholarship })[]> {
    const conditions = [eq(scholarshipMatches.profileId, profileId)];
    
    if (statusFilter) {
      conditions.push(eq(scholarshipMatches.status, statusFilter));
    } else {
      // Default: only show 'new' status matches
      conditions.push(eq(scholarshipMatches.status, 'new'));
    }
    
    return await db
      .select({
        id: scholarshipMatches.id,
        profileId: scholarshipMatches.profileId,
        scholarshipId: scholarshipMatches.scholarshipId,
        matchScore: scholarshipMatches.matchScore,
        aiReasoning: scholarshipMatches.aiReasoning,
        status: scholarshipMatches.status,
        createdAt: scholarshipMatches.createdAt,
        scholarship: scholarships,
      })
      .from(scholarshipMatches)
      .innerJoin(scholarships, eq(scholarshipMatches.scholarshipId, scholarships.id))
      .where(and(...conditions))
      .orderBy(desc(scholarshipMatches.matchScore));
  }

  async createScholarshipMatch(match: InsertScholarshipMatch): Promise<ScholarshipMatch> {
    const [newMatch] = await db
      .insert(scholarshipMatches)
      .values(match)
      .returning();
    return newMatch;
  }

  async updateMatchStatus(matchId: string, status: string): Promise<ScholarshipMatch> {
    const [updatedMatch] = await db
      .update(scholarshipMatches)
      .set({ status })
      .where(eq(scholarshipMatches.id, matchId))
      .returning();
    return updatedMatch;
  }

  async getApplicationGuidance(profileId: string, scholarshipId: string): Promise<ApplicationGuidance | undefined> {
    const [guidance] = await db
      .select()
      .from(applicationGuidance)
      .where(and(
        eq(applicationGuidance.profileId, profileId),
        eq(applicationGuidance.scholarshipId, scholarshipId)
      ));
    return guidance || undefined;
  }

  async createApplicationGuidance(guidance: InsertApplicationGuidance): Promise<ApplicationGuidance> {
    const [newGuidance] = await db
      .insert(applicationGuidance)
      .values(guidance)
      .returning();
    return newGuidance;
  }

  async seedSampleData(): Promise<void> {
    // Clear existing data
    await db.delete(scholarshipMatches);
    await db.delete(applicationGuidance);
    await db.delete(scholarships);

    // Insert scholarships directly using SQL for SQLite compatibility
    const scholarshipData = [
      {
        id: randomUUID(),
        title: "Google Computer Science Scholarship",
        organization: "Google Inc.",
        amount: "$10,000",
        deadline: "2025-03-15",
        description: "Supporting underrepresented students in computer science and technology fields.",
        requirements: "3.5+ GPA, demonstrated leadership, passion for computer science",
        tags: JSON.stringify(["technology", "computer-science", "diversity", "leadership"]),
        type: "merit-based",
        eligibilityGpa: "3.5",
        eligibleFields: JSON.stringify(["Computer Science", "Software Engineering", "Information Technology"]),
        eligibleLevels: JSON.stringify(["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "Microsoft LEAP Engineering Scholarship",
        organization: "Microsoft Corporation",
        amount: "$25,000",
        deadline: "2025-04-01",
        description: "Full-time internship program for students from non-traditional backgrounds in tech.",
        requirements: "Enrolled in computer science or related field, strong coding skills",
        tags: JSON.stringify(["technology", "internship", "coding", "diversity"]),
        type: "merit-based",
        eligibilityGpa: "3.0",
        eligibleFields: JSON.stringify(["Computer Science", "Software Engineering", "Electrical Engineering"]),
        eligibleLevels: JSON.stringify(["undergraduate-sophomore", "undergraduate-junior"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "Apple WWDC Student Scholarship",
        organization: "Apple Inc.",
        amount: "$5,000",
        deadline: "2025-05-20",
        description: "Supporting innovative student developers building apps for Apple platforms.",
        requirements: "App development portfolio, Swift programming skills",
        tags: JSON.stringify(["technology", "mobile-development", "innovation", "apple"]),
        type: "merit-based",
        eligibilityGpa: "3.0",
        eligibleFields: JSON.stringify(["Computer Science", "Software Engineering", "Mobile Development"]),
        eligibleLevels: JSON.stringify(["undergraduate-freshman", "undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },
      
      // Engineering Scholarships
      {
        id: randomUUID(),
        title: "Society of Women Engineers Scholarship",
        organization: "Society of Women Engineers",
        amount: "$15,000",
        deadline: "2025-02-15",
        description: "Empowering women in engineering and technology fields.",
        requirements: "Female student, 3.5+ GPA, engineering major",
        tags: JSON.stringify(["engineering", "women", "stem", "leadership"]),
        type: "merit-based",
        eligibilityGpa: "3.5",
        eligibleFields: JSON.stringify(["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Chemical Engineering"]),
        eligibleLevels: JSON.stringify(["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "IEEE Foundation Scholarship",
        organization: "Institute of Electrical and Electronics Engineers",
        amount: "$8,000",
        deadline: "2025-03-30",
        description: "Supporting students pursuing electrical engineering and computer science.",
        requirements: "IEEE student membership, strong academic performance",
        tags: JSON.stringify(["engineering", "electrical", "ieee", "technology"]),
        type: "merit-based",
        eligibilityGpa: "3.2",
        eligibleFields: JSON.stringify(["Electrical Engineering", "Computer Engineering", "Computer Science"]),
        eligibleLevels: JSON.stringify(["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },

      // Business & Finance Scholarships
      {
        id: randomUUID(),
        title: "JP Morgan Chase Scholarship",
        organization: "JP Morgan Chase & Co.",
        amount: "₹16,50,000",
        deadline: "2025-04-15",
        description: "Supporting students pursuing careers in finance and business technology.",
        requirements: "Business or finance major, 3.3+ GPA, leadership experience",
        tags: JSON.stringify(["finance", "business", "leadership", "banking"]),
        type: "merit-based",
        eligibilityGpa: "3.3",
        eligibleFields: JSON.stringify(["Business Administration", "Finance", "Economics", "Accounting"]),
        eligibleLevels: JSON.stringify(["undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "Goldman Sachs Scholarship Program",
        organization: "Goldman Sachs Group",
        amount: "₹24,75,000",
        deadline: "2025-03-01",
        description: "Comprehensive scholarship program for future finance leaders.",
        requirements: "Finance or economics major, exceptional academic record, internship experience",
        tags: JSON.stringify(["finance", "investment", "leadership", "economics"]),
        type: "merit-based",
        eligibilityGpa: "3.7",
        eligibleFields: JSON.stringify(["Finance", "Economics", "Business Administration"]),
        eligibleLevels: JSON.stringify(["undergraduate-senior", "graduate-masters"]),
        isActive: true
      },

      // Healthcare & Medical Scholarships
      {
        id: randomUUID(),
        title: "American Medical Association Scholarship",
        organization: "American Medical Association",
        amount: "$35,000",
        deadline: "2025-05-01",
        description: "Supporting future healthcare professionals and medical researchers.",
        requirements: "Pre-med or medical student, 3.8+ GPA, healthcare volunteer experience",
        tags: JSON.stringify(["medical", "healthcare", "research", "volunteer"]),
        type: "merit-based",
        eligibilityGpa: "3.8",
        eligibleFields: JSON.stringify(["Pre-Medicine", "Biology", "Chemistry", "Health Sciences"]),
        eligibleLevels: JSON.stringify(["undergraduate-junior", "undergraduate-senior", "graduate-masters"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "Johnson & Johnson Nursing Scholarship",
        organization: "Johnson & Johnson",
        amount: "$12,000",
        deadline: "2025-06-15",
        description: "Supporting the next generation of nursing professionals.",
        requirements: "Nursing major, 3.5+ GPA, clinical experience",
        tags: JSON.stringify(["nursing", "healthcare", "clinical", "patient-care"]),
        type: "merit-based",
        eligibilityGpa: "3.5",
        eligibleFields: JSON.stringify(["Nursing", "Health Sciences"]),
        eligibleLevels: JSON.stringify(["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },

      // Environmental & Science Scholarships
      {
        id: randomUUID(),
        title: "Environmental Protection Agency Scholarship",
        organization: "US Environmental Protection Agency",
        amount: "$18,000",
        deadline: "2025-04-30",
        description: "Supporting students committed to environmental protection and sustainability.",
        requirements: "Environmental science major, 3.4+ GPA, environmental project experience",
        tags: JSON.stringify(["environmental", "sustainability", "science", "climate"]),
        type: "merit-based",
        eligibilityGpa: "3.4",
        eligibleFields: JSON.stringify(["Environmental Science", "Environmental Engineering", "Biology", "Chemistry"]),
        eligibleLevels: JSON.stringify(["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "National Science Foundation STEM Scholarship",
        organization: "National Science Foundation",
        amount: "$22,000",
        deadline: "2025-02-28",
        description: "Advancing STEM education and research across all scientific disciplines.",
        requirements: "STEM major, 3.6+ GPA, research experience",
        tags: JSON.stringify(["stem", "research", "science", "mathematics"]),
        type: "merit-based",
        eligibilityGpa: "3.6",
        eligibleFields: JSON.stringify(["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science"]),
        eligibleLevels: JSON.stringify(["undergraduate-junior", "undergraduate-senior", "graduate-masters"]),
        isActive: true
      },

      // Liberal Arts & Humanities
      {
        id: randomUUID(),
        title: "Fulbright International Exchange Scholarship",
        organization: "US Department of State",
        amount: "$40,000",
        deadline: "2025-10-15",
        description: "International educational exchange program promoting cultural understanding.",
        requirements: "Bachelor's degree, strong academic record, language skills",
        tags: JSON.stringify(["international", "cultural-exchange", "languages", "research"]),
        type: "merit-based",
        eligibilityGpa: "3.5",
        eligibleFields: JSON.stringify(["International Relations", "Languages", "Cultural Studies", "Political Science"]),
        eligibleLevels: JSON.stringify(["graduate-masters", "graduate-phd"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "Humanities Research Council Grant",
        organization: "National Humanities Research Council",
        amount: "$15,000",
        deadline: "2025-03-20",
        description: "Supporting innovative research in humanities and social sciences.",
        requirements: "Humanities major, research proposal, faculty recommendation",
        tags: JSON.stringify(["humanities", "research", "social-sciences", "culture"]),
        type: "merit-based",
        eligibilityGpa: "3.4",
        eligibleFields: JSON.stringify(["History", "Philosophy", "Literature", "Art History", "Anthropology"]),
        eligibleLevels: JSON.stringify(["undergraduate-senior", "graduate-masters"]),
        isActive: true
      },

      // Need-based Scholarships
      {
        id: randomUUID(),
        title: "First Generation College Student Scholarship",
        organization: "Educational Foundation",
        amount: "$8,000",
        deadline: "2025-07-01",
        description: "Supporting first-generation college students pursuing higher education.",
        requirements: "First-generation college student, demonstrated financial need",
        tags: JSON.stringify(["first-generation", "financial-need", "education", "support"]),
        type: "need-based",
        eligibilityGpa: "2.8",
        eligibleFields: JSON.stringify([]),
        eligibleLevels: JSON.stringify(["undergraduate-freshman", "undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "Minority Student Success Fund",
        organization: "Diversity Education Alliance",
        amount: "$12,000",
        deadline: "2025-08-15",
        description: "Promoting educational equity for underrepresented minority students.",
        requirements: "Underrepresented minority status, financial need, 3.0+ GPA",
        tags: JSON.stringify(["diversity", "minority", "equity", "financial-aid"]),
        type: "need-based",
        eligibilityGpa: "3.0",
        eligibleFields: JSON.stringify([]),
        eligibleLevels: JSON.stringify(["undergraduate-freshman", "undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },

      // Internship Opportunities
      {
        id: randomUUID(),
        title: "NASA Summer Internship Program",
        organization: "National Aeronautics and Space Administration",
        amount: "$7,500",
        deadline: "2025-01-31",
        description: "Hands-on internship experience in aerospace engineering and space science.",
        requirements: "STEM major, 3.0+ GPA, US citizenship",
        tags: JSON.stringify(["internship", "aerospace", "engineering", "space"]),
        type: "internship",
        eligibilityGpa: "3.0",
        eligibleFields: JSON.stringify(["Aerospace Engineering", "Mechanical Engineering", "Physics", "Computer Science"]),
        eligibleLevels: JSON.stringify(["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "Meta Software Engineering Internship",
        organization: "Meta Platforms Inc.",
        amount: "$12,000",
        deadline: "2025-02-10",
        description: "Full-time summer internship building next-generation social technology.",
        requirements: "Computer science major, strong programming skills, previous internship experience",
        tags: JSON.stringify(["internship", "software", "social-media", "technology"]),
        type: "internship",
        eligibilityGpa: "3.2",
        eligibleFields: JSON.stringify(["Computer Science", "Software Engineering"]),
        eligibleLevels: JSON.stringify(["undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "Tesla Engineering Co-op Program",
        organization: "Tesla Inc.",
        amount: "$15,000",
        deadline: "2025-03-05",
        description: "Six-month co-op program working on sustainable transportation and energy.",
        requirements: "Engineering major, 3.3+ GPA, passion for sustainability",
        tags: JSON.stringify(["internship", "automotive", "sustainability", "engineering"]),
        type: "internship",
        eligibilityGpa: "3.3",
        eligibleFields: JSON.stringify(["Mechanical Engineering", "Electrical Engineering", "Chemical Engineering"]),
        eligibleLevels: JSON.stringify(["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "Netflix Content Strategy Internship",
        organization: "Netflix Inc.",
        amount: "$8,000",
        deadline: "2025-04-20",
        description: "Summer internship in content analysis and entertainment industry strategy.",
        requirements: "Business, communications, or media studies major, analytical skills",
        tags: JSON.stringify(["internship", "media", "entertainment", "strategy"]),
        type: "internship",
        eligibilityGpa: "3.1",
        eligibleFields: JSON.stringify(["Business Administration", "Communications", "Media Studies", "Marketing"]),
        eligibleLevels: JSON.stringify(["undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      }
    ];

    // Add more scholarships for better matching
    const additionalScholarships = [
      {
        id: randomUUID(),
        title: "Adobe Creative Scholarship",
        organization: "Adobe Inc.",
        amount: "$7,500",
        deadline: "2025-04-25",
        description: "Supporting creative students in digital arts and design.",
        requirements: "Portfolio submission, creative arts major, 3.0+ GPA",
        tags: JSON.stringify(["creative", "design", "digital-arts", "portfolio"]),
        type: "merit-based",
        eligibilityGpa: "3.0",
        eligibleFields: JSON.stringify(["Graphic Design", "Digital Arts", "Media Arts", "Computer Science"]),
        eligibleLevels: JSON.stringify(["undergraduate-freshman", "undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "Salesforce Trailblazer Scholarship",
        organization: "Salesforce Foundation",
        amount: "$10,000",
        deadline: "2025-05-10",
        description: "Empowering the next generation of business technology leaders.",
        requirements: "Business or technology major, leadership experience, 3.2+ GPA",
        tags: JSON.stringify(["business", "technology", "leadership", "salesforce"]),
        type: "merit-based",
        eligibilityGpa: "3.2",
        eligibleFields: JSON.stringify(["Business Administration", "Information Systems", "Computer Science", "Marketing"]),
        eligibleLevels: JSON.stringify(["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "General Academic Excellence Award",
        organization: "Education Foundation",
        amount: "$5,000",
        deadline: "2025-06-01",
        description: "Recognizing outstanding academic achievement across all fields.",
        requirements: "3.5+ GPA, any major, demonstrated academic excellence",
        tags: JSON.stringify(["academic", "excellence", "general", "achievement"]),
        type: "merit-based",
        eligibilityGpa: "3.5",
        eligibleFields: JSON.stringify([]),
        eligibleLevels: JSON.stringify(["undergraduate-freshman", "undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "International Student Success Fund",
        organization: "Global Education Alliance",
        amount: "$8,000",
        deadline: "2025-07-15",
        description: "Supporting international students pursuing higher education.",
        requirements: "International student status, any major, 3.0+ GPA",
        tags: JSON.stringify(["international", "diversity", "global", "education"]),
        type: "need-based",
        eligibilityGpa: "3.0",
        eligibleFields: JSON.stringify([]),
        eligibleLevels: JSON.stringify(["undergraduate-freshman", "undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"]),
        isActive: true
      },
      {
        id: randomUUID(),
        title: "STEM Innovation Challenge",
        organization: "Innovation Institute",
        amount: "$12,000",
        deadline: "2025-03-25",
        description: "Funding innovative STEM projects and research.",
        requirements: "STEM major, research project proposal, 3.3+ GPA",
        tags: JSON.stringify(["stem", "innovation", "research", "project"]),
        type: "merit-based",
        eligibilityGpa: "3.3",
        eligibleFields: ["Engineering", "Computer Science", "Mathematics", "Physics", "Chemistry", "Biology"],
        eligibleLevels: ["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"],
        isActive: true
      }
    ];

    const allScholarships = [...scholarshipData, ...additionalScholarships];

    // Insert scholarships using Drizzle ORM
    for (const scholarship of allScholarships) {
      await db.insert(scholarships).values({
        id: scholarship.id,
        title: scholarship.title,
        organization: scholarship.organization,
        amount: scholarship.amount,
        deadline: scholarship.deadline,
        description: scholarship.description,
        requirements: scholarship.requirements,
        tags: scholarship.tags,
        type: scholarship.type,
        eligibilityGpa: scholarship.eligibilityGpa,
        eligibleFields: scholarship.eligibleFields,
        eligibleLevels: scholarship.eligibleLevels,
        isActive: scholarship.isActive
      });
    }

    console.log(`Seeded ${allScholarships.length} scholarships successfully`);
  }
}

export const storage = new DatabaseStorage();