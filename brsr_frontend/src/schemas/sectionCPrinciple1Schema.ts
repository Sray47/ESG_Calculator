import { z } from 'zod';

// Essential Indicators Schema
const p1EssentialIndicatorsSchema = z.object({
  anti_corruption_policy: z.object({
    has_policy: z.boolean(),
    details: z.string().optional(),
    weblink: z.string().optional(),
  }),
  
  disciplinary_actions_by_le_agencies: z.object({
    fy_2022_23: z.object({
      directors: z.number().nullable(),
      kmps: z.number().nullable(),
      employees_executives: z.number().nullable(),
      workers_non_executives: z.number().nullable(),
    }),
  }),
  
  complaints_conflict_of_interest: z.object({
    directors_number: z.number().nullable(),
    directors_remarks: z.string().optional(),
    kmps_number: z.number().nullable(),
    kmps_remarks: z.string().optional(),
  }),
  
  corrective_actions_on_corruption_coi: z.object({
    details: z.string().optional(),
  }),
  
  p1_training_coverage: z.object({
    board_of_directors: z.object({
      programs_held: z.number().nullable(),
      topics_principles: z.string().optional(),
      percent_covered: z.number().nullable(),
    }),
    kmp: z.object({
      programs_held: z.number().nullable(),
      topics_principles: z.string().optional(),
      percent_covered: z.number().nullable(),
    }),
    employees_other_than_bod_kmp_executives: z.object({
      programs_held: z.number().nullable(),
      topics_principles: z.string().optional(),
      percent_covered: z.number().nullable(),
    }),
    workers: z.object({
      programs_held: z.number().nullable(),
      topics_principles: z.string().optional(),
      percent_covered: z.number().nullable(),
    }),
  }),
  
  p1_fines_penalties_paid: z.object({
    monetary_details: z.string().optional(),
    non_monetary_details: z.string().optional(),
  }),
  
  p1_appeal_details_for_fines_penalties: z.object({
    details: z.string().optional(),
  }),
  
  esg_training_employees: z.object({
    has_program: z.boolean().nullable(),
    employees_trained_count: z.number().nullable(),
  }),
});

// Leadership Indicators Schema
const p1LeadershipIndicatorsSchema = z.object({
  conflict_of_interest_policy_communication: z.object({
    communicated: z.boolean().nullable(),
    how_communicated: z.string().nullable(),
    reasons_if_not: z.string().nullable(),
  }),
  
  conflict_of_interest_training: z.object({
    covered_directors: z.boolean().nullable(),
    covered_kmps: z.boolean().nullable(),
    covered_employees: z.boolean().nullable(),
    fy_training_details: z.string().nullable(),
  }),
  
  anti_corruption_policy_communication: z.object({
    communicated_directors: z.boolean().nullable(),
    communicated_kmps: z.boolean().nullable(),
    communicated_employees: z.boolean().nullable(),
    communicated_value_chain: z.boolean().nullable(),
    fy_communication_details: z.string().nullable(),
  }),
  
  anti_corruption_training: z.object({
    covered_directors: z.boolean().nullable(),
    covered_kmps: z.boolean().nullable(),
    covered_employees: z.boolean().nullable(),
    covered_value_chain: z.boolean().nullable(),
    fy_training_details: z.string().nullable(),
  }),
});

// Main Section C Principle 1 schema
export const sectionCPrinciple1Schema = z.object({
  essential_indicators: p1EssentialIndicatorsSchema,
  leadership_indicators: p1LeadershipIndicatorsSchema,
});

export type SectionCPrinciple1FormData = z.infer<typeof sectionCPrinciple1Schema>;
