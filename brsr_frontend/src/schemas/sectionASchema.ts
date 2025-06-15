import { z } from 'zod';

// Validation schema for Section A form
export const sectionASchema = z.object({
  // Company Info
  company_name: z.string().min(1, 'Company name is required'),
  cin: z.string()
    .min(21, 'CIN must be exactly 21 characters')
    .max(21, 'CIN must be exactly 21 characters')
    .regex(/^[LUF]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/, 'CIN must follow the valid format'),
  year_of_incorporation: z.number()
    .min(1800, 'Year must be at least 1800')
    .max(new Date().getFullYear(), `Year cannot be more than ${new Date().getFullYear()}`),
  registered_office_address: z.string().optional(),
  corporate_address: z.string().optional(),
  email: z.string().email('Must be a valid email address').optional().or(z.literal('')),
  telephone: z.string().optional(),
  website: z.string()
    .regex(/^https?:\/\/.+/, 'Website must start with http:// or https://')
    .optional()
    .or(z.literal('')),
  paid_up_capital: z.string().optional(),
  
  // BRSR Contact
  brsr_contact_name: z.string().min(1, 'BRSR contact name is required'),
  brsr_contact_mail: z.string().email('Must be a valid email address'),
  brsr_contact_number: z.string().optional(),
  
  // Section A Data
  sa_business_activities_turnover: z.array(z.object({
    description_main: z.string().min(1, 'Description is required'),
    nic_code: z.string().optional(),
    business_activity_total_turnover: z.string().optional(),
    business_activity_percentage_turnover: z.string().optional(),
  })).min(1, 'At least one business activity is required'),
  
  sa_product_services_turnover: z.array(z.object({
    product_service: z.string().min(1, 'Product/service description is required'),
    nic_code: z.string().optional(),
    product_service_percentage_turnover: z.string().optional(),
  })).min(1, 'At least one product/service is required'),
  
  sa_locations_plants_offices: z.object({
    national_plants: z.number().min(0),
    national_offices: z.number().min(0),
    international_plants: z.number().min(0),
    international_offices: z.number().min(0),
  }).refine(
    (data) => data.national_plants > 0 || data.national_offices > 0 || 
              data.international_plants > 0 || data.international_offices > 0,
    { message: 'At least one plant or office location is required' }
  ),
  
  sa_markets_served: z.object({
    locations: z.object({
      national_states: z.number().min(0),
      international_countries: z.number().min(0),
    }),
    exports_percentage: z.string()
      .regex(/^\d+(\.\d{1,2})?%?$/, 'Export percentage must be a valid number')
      .optional()
      .or(z.literal('')),
    customer_types: z.string().optional(),
  }).optional(),
  
  sa_employee_details: z.object({
    permanent_male: z.number().min(0),
    permanent_female: z.number().min(0),
    other_than_permanent_male: z.number().min(0),
    other_than_permanent_female: z.number().min(0),
  }).optional(),
  
  sa_workers_details: z.object({
    permanent_male: z.number().min(0),
    permanent_female: z.number().min(0),
    other_than_permanent_male: z.number().min(0),
    other_than_permanent_female: z.number().min(0),
  }).optional(),
  
  sa_differently_abled_details: z.object({
    employees_male: z.number().min(0),
    employees_female: z.number().min(0),
    workers_male: z.number().min(0),
    workers_female: z.number().min(0),
  }).optional(),
  
  sa_women_representation_details: z.object({
    board_total_members: z.number().min(0),
    board_number_of_women: z.number().min(0),
    kmp_total_personnel: z.number().min(0),
    kmp_number_of_women: z.number().min(0),
  }).optional(),
  
  sa_turnover_rate: z.object({
    permanent_employees_turnover_rate: z.string().optional(),
    permanent_workers_turnover_rate: z.string().optional(),
  }).optional(),
  
  sa_holding_subsidiary_associate_companies: z.array(z.object({
    name: z.string().optional(),
    cin_or_country: z.string().optional(),
    type: z.enum(['Holding', 'Subsidiary', 'Associate', 'Joint Venture']),
    percentage_holding: z.string().optional(),
  })).optional(),
  
  sa_csr_applicable: z.boolean().optional(),
  sa_csr_turnover: z.string().optional(),
  sa_csr_net_worth: z.string().optional(),
  
  sa_transparency_complaints: z.object({
    received: z.number().min(0),
    pending: z.number().min(0),    remarks: z.string().optional(),
  }).optional(),
});
