import { 
  users, 
  studentProfiles,
  scholarships, 
  scholarshipMatches,
  applicationGuidance,
  type User, 
  type InsertUser,
  type StudentProfile,
  type InsertStudentProfile,
  type Scholarship,
  type InsertScholarship,
  type ScholarshipMatch,
  type InsertScholarshipMatch,
  type ApplicationGuidance,
  type InsertApplicationGuidance
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Student profile methods
  getStudentProfile(userId: string): Promise<StudentProfile | undefined>;
  createStudentProfile(profile: InsertStudentProfile & { userId: string }): Promise<StudentProfile>;
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getStudentProfile(userId: string): Promise<StudentProfile | undefined> {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId));
    return profile || undefined;
  }

  async createStudentProfile(profile: InsertStudentProfile & { userId: string }): Promise<StudentProfile> {
    const [newProfile] = await db
      .insert(studentProfiles)
      .values({
        ...profile,
        updatedAt: sql`now()`
      })
      .returning();
    return newProfile;
  }

  async updateStudentProfile(id: string, profile: Partial<InsertStudentProfile>): Promise<StudentProfile> {
    const [updatedProfile] = await db
      .update(studentProfiles)
      .set({
        ...profile,
        updatedAt: sql`now()`
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

  async getScholarshipMatches(profileId: string): Promise<(ScholarshipMatch & { scholarship: Scholarship })[]> {
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
      .where(eq(scholarshipMatches.profileId, profileId))
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
}

export const storage = new DatabaseStorage();
