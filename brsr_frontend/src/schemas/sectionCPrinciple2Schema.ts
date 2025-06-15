import { z } from 'zod';

// LCA Assessment schema for complex nested objects
const lcaAssessmentSchema = z.object({
  nic_code: z.string().optional(),
  product_service_name: z.string().min(1, 'Product/Service name is required'),
  turnover_percentage: z.number().min(0).max(100).nullable(),
  lca_boundary: z.string().optional(),
  conducted_by_external_agency: z.boolean().nullable(),
  results_communicated_publicly: z.boolean().nullable(),
  lca_summary_weblink: z.string().url().optional().or(z.literal(''))
});

// Product risk schema
const productRiskSchema = z.object({
  product_service_name: z.string().min(1, 'Product/Service name is required'),
  risk_description: z.string().min(1, 'Risk description is required'),
  action_taken: z.string().optional()
});

// Recycled input material schema
const recycledInputSchema = z.object({
  input_material_category: z.string().min(1, 'Material category is required'),
  percentage_by_value_current_fy: z.number().min(0).max(100).nullable()
});

// Reclaimed product schema
const reclaimedProductSchema = z.object({
  product_category: z.string().min(1, 'Product category is required'),
  reclaimed_as_percentage_of_sold: z.number().min(0).max(100).nullable()
});

// Waste quantities schema for reclaimed items
const wasteQuantitiesSchema = z.object({
  current_fy_reused_mt: z.number().min(0).nullable(),
  current_fy_recycled_mt: z.number().min(0).nullable(),
  current_fy_safely_disposed_mt: z.number().min(0).nullable()
});

export const sectionCPrinciple2Schema = z.object({
  // Essential Indicators
  p2_essential_rd_capex_percentages: z.object({
    rd_percentage_current_fy: z.number().min(0).max(100).nullable(),
    capex_percentage_current_fy: z.number().min(0).max(100).nullable(),
    rd_improvements_details: z.string().optional(),
    capex_improvements_details: z.string().optional()
  }),

  p2_essential_sustainable_sourcing: z.object({
    has_procedures: z.boolean().nullable(),
    percentage_inputs_sourced_sustainably: z.number().min(0).max(100).nullable()
  }),

  p2_essential_reclaim_processes_description: z.object({
    plastics: z.string().optional(),
    e_waste: z.string().optional(),
    hazardous_waste: z.string().optional(),
    other_waste: z.string().optional()
  }),

  p2_essential_epr_status: z.object({
    is_epr_applicable: z.boolean().nullable(),
    is_collection_plan_in_line_with_epr: z.boolean().nullable(),
    steps_to_address_epr_gap: z.string().optional()
  }),

  // Leadership Indicators
  p2_leadership_lca_details: z.object({
    conducted: z.boolean().nullable(),
    assessments: z.array(lcaAssessmentSchema)
  }),

  p2_leadership_product_risks: z.array(productRiskSchema),

  p2_leadership_recycled_input_value_percentage: z.array(recycledInputSchema),

  p2_leadership_reclaimed_waste_quantities: z.object({
    plastics: wasteQuantitiesSchema,
    e_waste: wasteQuantitiesSchema,
    hazardous_waste: wasteQuantitiesSchema,
    other_waste: wasteQuantitiesSchema
  }),

  p2_leadership_reclaimed_products_as_percentage_sold: z.array(reclaimedProductSchema)
});

export type SectionCPrinciple2FormData = z.infer<typeof sectionCPrinciple2Schema>;
