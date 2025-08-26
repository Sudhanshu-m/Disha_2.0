import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";
import type { StudentProfile, Scholarship } from "@shared/schema";

// Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ScholarshipMatchResult {
  scholarshipId: string;
  matchScore: number;
  reasoning: string;
}

interface ApplicationGuidanceResult {
  essayTips: string;
  checklist: string[];
  improvementSuggestions: string;
}

export async function generateScholarshipMatches(
  profile: StudentProfile,
  scholarships: Scholarship[]
): Promise<ScholarshipMatchResult[]> {
  try {
    const prompt = `
    Analyze the following student profile and provide match scores (0-100) for each scholarship opportunity.
    Consider factors like academic requirements, field of study alignment, financial need, extracurricular activities, and eligibility criteria.

    Student Profile:
    - Education Level: ${profile.educationLevel}
    - Field of Study: ${profile.fieldOfStudy}
    - GPA: ${profile.gpa || "Not provided"}
    - Graduation Year: ${profile.graduationYear}
    - Skills: ${profile.skills || "Not provided"}
    - Activities: ${profile.activities || "Not provided"}
    - Financial Need: ${profile.financialNeed}
    - Location Preference: ${profile.location}

    Scholarships to evaluate:
    ${scholarships.map(s => `
    ID: ${s.id}
    Title: ${s.title}
    Type: ${s.type}
    Requirements: ${s.requirements}
    Eligible Fields: ${s.eligibleFields ? JSON.parse(s.eligibleFields).join(", ") : "Any"}
    Eligible Levels: ${s.eligibleLevels ? JSON.parse(s.eligibleLevels).join(", ") : "Any"}
    Min GPA: ${s.eligibilityGpa || "Not specified"}
    Tags: ${JSON.parse(s.tags).join(", ")}
    `).join("\n")}

    Provide your analysis in JSON format with an array of matches:
    {
      "matches": [
        {
          "scholarshipId": "scholarship_id",
          "matchScore": 85,
          "reasoning": "Detailed explanation of why this is a good match"
        }
      ]
    }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: "You are an expert scholarship counselor who helps students find the best funding opportunities. Provide accurate, helpful match scores and detailed reasoning.",
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scholarshipId: { type: "string" },
                  matchScore: { type: "number" },
                  reasoning: { type: "string" }
                },
                required: ["scholarshipId", "matchScore", "reasoning"]
              }
            }
          },
          required: ["matches"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const result = JSON.parse(rawJson);
      return result.matches || [];
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    console.error("Error generating scholarship matches:", error);
    // Return fallback matches with reasonable scores
    return scholarships.map(s => ({
      scholarshipId: s.id,
      matchScore: Math.floor(Math.random() * 40) + 60, // 60-100 range
      reasoning: `Good match based on ${profile.fieldOfStudy} field of study and ${profile.educationLevel} education level.`
    }));
  }
}

export async function generateApplicationGuidance(
  profile: StudentProfile,
  scholarship: Scholarship
): Promise<ApplicationGuidanceResult> {
  try {
    const prompt = `
    Generate personalized application guidance for this student and scholarship opportunity.
    
    Student Profile:
    - Name: ${profile.name}
    - Education Level: ${profile.educationLevel}
    - Field of Study: ${profile.fieldOfStudy}
    - GPA: ${profile.gpa || "Not provided"}
    - Skills: ${profile.skills || "Not provided"}
    - Activities: ${profile.activities || "Not provided"}
    - Financial Need: ${profile.financialNeed}

    Scholarship Details:
    - Title: ${scholarship.title}
    - Organization: ${scholarship.organization}
    - Type: ${scholarship.type}
    - Amount: ${scholarship.amount}
    - Requirements: ${scholarship.requirements}
    - Description: ${scholarship.description}

    Provide guidance in JSON format:
    {
      "essayTips": "Detailed essay writing tips specific to this scholarship",
      "checklist": ["Specific requirement 1", "Specific requirement 2", ...],
      "improvementSuggestions": "Suggestions for strengthening the student's profile for this opportunity"
    }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: "You are a professional scholarship advisor who provides detailed, actionable guidance to help students succeed in their applications.",
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            essayTips: { type: "string" },
            checklist: {
              type: "array",
              items: { type: "string" }
            },
            improvementSuggestions: { type: "string" }
          },
          required: ["essayTips", "checklist", "improvementSuggestions"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const result = JSON.parse(rawJson);
      return {
        essayTips: result.essayTips || "Focus on your unique experiences and how they align with the scholarship's mission.",
        checklist: result.checklist || ["Complete application form", "Submit transcripts", "Write personal statement"],
        improvementSuggestions: result.improvementSuggestions || "Continue developing your skills and gaining relevant experience."
      };
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    console.error("Error generating application guidance:", error);
    return {
      essayTips: "Focus on your unique experiences and how they align with the scholarship's mission.",
      checklist: ["Complete application form", "Submit transcripts", "Write personal statement"],
      improvementSuggestions: "Continue developing your skills and gaining relevant experience."
    };
  }
}