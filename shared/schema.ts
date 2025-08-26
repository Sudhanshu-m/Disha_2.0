import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const studentProfiles = pgTable("student_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  educationLevel: text("education_level").notNull(),
  fieldOfStudy: text("field_of_study").notNull(),
  gpa: text("gpa"),
  graduationYear: text("graduation_year").notNull(),
  skills: text("skills"),
  activities: text("activities"),
  financialNeed: text("financial_need").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const scholarships = pgTable("scholarships", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  amount: text("amount").notNull(),
  deadline: text("deadline").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  tags: text("tags").notNull(), // JSON string of array
  type: text("type").notNull(), // merit-based, need-based, field-specific, etc.
  eligibilityGpa: text("eligibility_gpa"),
  eligibleFields: text("eligible_fields"), // JSON string of array
  eligibleLevels: text("eligible_levels"), // JSON string of array
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const scholarshipMatches = pgTable("scholarship_matches", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id").references(() => studentProfiles.id).notNull(),
  scholarshipId: text("scholarship_id").references(() => scholarships.id).notNull(),
  matchScore: integer("match_score").notNull(),
  aiReasoning: text("ai_reasoning"),
  status: text("status").default("new").notNull(), // new, favorited, applied, rejected
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const applicationGuidance = pgTable("application_guidance", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id").references(() => studentProfiles.id).notNull(),
  scholarshipId: text("scholarship_id").references(() => scholarships.id).notNull(),
  essayTips: text("essay_tips"),
  checklist: text("checklist"), // JSON string
  improvementSuggestions: text("improvement_suggestions"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertStudentProfileSchema = createInsertSchema(studentProfiles).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScholarshipSchema = createInsertSchema(scholarships).omit({
  id: true,
  createdAt: true,
});

export const insertScholarshipMatchSchema = createInsertSchema(scholarshipMatches).omit({
  id: true,
  createdAt: true,
});

export const insertApplicationGuidanceSchema = createInsertSchema(applicationGuidance).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type Scholarship = typeof scholarships.$inferSelect;
export type InsertScholarship = z.infer<typeof insertScholarshipSchema>;
export type ScholarshipMatch = typeof scholarshipMatches.$inferSelect;
export type InsertScholarshipMatch = z.infer<typeof insertScholarshipMatchSchema>;
export type ApplicationGuidance = typeof applicationGuidance.$inferSelect;
export type InsertApplicationGuidance = z.infer<typeof insertApplicationGuidanceSchema>;