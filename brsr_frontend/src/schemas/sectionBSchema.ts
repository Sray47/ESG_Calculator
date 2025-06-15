import { z } from 'zod';

// Zod schema for a single principle policy
const principlesPolicySchema = z.object({
  principle: z.number().min(1).max(9),
  has_policy: z.boolean(),
  is_board_approved: z.boolean(),
  policy_text_or_url: z.string().optional(),
  translated_to_procedures: z.boolean(),
  extends_to_value_chain: z.boolean(),
  adopted_standards: z.string().optional(),
  specific_commitments_goals_targets: z.string().optional(),
  performance_against_targets: z.string().optional(),
  reason_q12_not_material: z.boolean(),
  reason_q12_not_at_stage: z.boolean(),
  reason_q12_no_resources: z.boolean(),
  reason_q12_planned_next_year: z.boolean(),
  reason_q12_other_text: z.string().optional(),
});

// Main Section B schema
export const sectionBSchema = z.object({
  sb_director_statement: z.string().min(1, "Director statement is required"),
  
  sb_esg_responsible_individual: z.object({
    name: z.string().min(1, "Name is required"),
    designation: z.string().min(1, "Designation is required"),
    din_if_director: z.string().optional(),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
  }),
  
  sb_principle_policies: z.array(principlesPolicySchema).length(9, "Must have exactly 9 principle policies"),
  
  sb_sustainability_committee: z.object({
    has_committee: z.boolean(),
    details: z.string().optional(),
  }),
  
  sb_ngrbc_company_review: z.object({
    performance_review_yn: z.boolean(),
    compliance_review_yn: z.boolean(),
    review_undertaken_by: z.string().optional(),
    frequency: z.string().optional(),
  }),
  
  sb_external_policy_assessment: z.object({
    conducted: z.boolean(),
    agency_name: z.string().optional(),
  }),
});

export type SectionBFormData = z.infer<typeof sectionBSchema>;
