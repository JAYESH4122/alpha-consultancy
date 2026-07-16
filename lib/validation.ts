import { z } from "zod";

export const jobSchema = z
  .object({
    title: z.string().trim().min(3, "Enter a job title"),
    category: z.string().trim().min(2),
    city: z.string().trim().min(2),
    workArea: z.string().trim().min(2),
    employmentType: z.string().min(2),
    workMode: z.enum(["On-site", "Remote", "Hybrid"]),
    shift: z.string().min(2),
    openings: z.coerce.number().int().min(1).max(500),
    salaryMin: z.coerce.number().min(0),
    salaryMax: z.coerce.number().min(0),
    experienceMin: z.coerce.number().min(0).max(50),
    description: z.string().trim().min(30, "Add at least 30 characters"),
    requiredSkills: z.string().trim().min(2),
    preferredSkills: z.string().trim().optional().default(""),
    education: z.string().trim().min(2),
    requiredDocuments: z.string().trim().optional().default(""),
    screeningQuestions: z.string().trim().optional().default(""),
    interviewAvailability: z.string().trim().min(4),
  })
  .refine((value) => value.salaryMax >= value.salaryMin, {
    message: "Maximum salary must be greater than minimum salary",
    path: ["salaryMax"],
  });

export type JobInput = z.infer<typeof jobSchema>;
