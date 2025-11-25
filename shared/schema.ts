
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const studentProfiles = sqliteTable("student_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
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
});

export const scholarships = sqliteTable("scholarships", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  amount: text("amount").notNull(),
  deadline: text("deadline").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  tags: text("tags").notNull(),
  type: text("type").notNull(),
  eligibilityGpa: text("eligibility_gpa"),
  eligibleFields: text("eligible_fields"),
  eligibleLevels: text("eligible_levels"),
  isActive: integer("is_active", { mode: 'boolean' }).default(true).notNull(),
});

export const scholarshipMatches = sqliteTable("scholarship_matches", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id").references(() => studentProfiles.id).notNull(),
  scholarshipId: text("scholarship_id").references(() => scholarships.id).notNull(),
  matchScore: integer("match_score").notNull(),
  aiReasoning: text("ai_reasoning"),
  status: text("status").default("new").notNull(),
});

export const applicationGuidance = sqliteTable("application_guidance", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id").references(() => studentProfiles.id).notNull(),
  scholarshipId: text("scholarship_id").references(() => scholarships.id).notNull(),
  essayTips: text("essay_tips"),
  checklist: text("checklist"),
  improvementSuggestions: text("improvement_suggestions"),
});

export const insertStudentProfileSchema = createInsertSchema(studentProfiles).omit({
  id: true,
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

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type Scholarship = typeof scholarships.$inferSelect;
export type InsertScholarship = z.infer<typeof insertScholarshipSchema>;
export type ScholarshipMatch = typeof scholarshipMatches.$inferSelect;
export type InsertScholarshipMatch = z.infer<typeof insertScholarshipMatchSchema>;
export type ApplicationGuidance = typeof applicationGuidance.$inferSelect;
export type InsertApplicationGuidance = z.infer<typeof insertApplicationGuidanceSchema>;
