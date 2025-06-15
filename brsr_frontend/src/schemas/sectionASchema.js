import { z } from 'zod';

// Helper schemas for reusable components
const businessActivitySchema = z.object({
  description_main: z.string().min(1, 'Main activity description is required'),
  description_business: z.string().min(1, 'Business description is required'),
  turnover_percentage: z.string().refine(
    (val) => {
      const num = parseFloat(val.replace('%', ''));
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    'Turnover percentage must be between 0 and 100'
  )
});

const productServiceSchema = z.object({
  product_service: z.string().min(1, 'Product/Service description is required'),
  nic_code: z.string().min(1, 'NIC code is required'),
  turnover_contributed: z.string().refine(
    (val) => {
      const num = parseFloat(val.replace('%', ''));
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    'Turnover percentage must be between 0 and 100'
  )
});

const holdingSubsidiarySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  cin_or_country: z.string().min(1, 'CIN or Country is required'),
  type: z.enum(['Holding', 'Subsidiary', 'Associate']),
  percentage_holding: z.string().refine(
    (val) => {
      const num = parseFloat(val.replace('%', ''));
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    'Holding percentage must be between 0 and 100'
  )
});

// Company info schema (goes to companies table)
export const companyInfoSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  cin: z.string()
    .min(1, 'CIN is required')
    .regex(
      /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
      'CIN must be in format L12345AB1234ABC123456'
    ),
  year_of_incorporation: z.string().refine(
    (val) => {
      const year = parseInt(val);
      const currentYear = new Date().getFullYear();
      return !isNaN(year) && year >= 1800 && year <= currentYear;
    },
    `Year must be between 1800 and ${new Date().getFullYear()}`
  ),
  registered_office_address: z.string().min(1, 'Registered office address is required'),
  corporate_address: z.string().optional(),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  telephone: z.string().optional(),
  website: z.string()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      'Website must start with http:// or https://'
    ),
  paid_up_capital: z.string().refine(
    (val) => !val || (!isNaN(val) && parseFloat(val) >= 0),
    'Paid up capital must be a valid positive number'
  ).optional(),
  stock_exchange_listed: z.array(z.string()).optional(),
  brsr_contact_name: z.string().min(1, 'BRSR contact name is required'),
  brsr_contact_mail: z.string().email('Please enter a valid email address'),
  brsr_contact_number: z.string().min(1, 'BRSR contact number is required')
});

// Section A data schema (goes to brsr_reports table)
export const sectionADataSchema = z.object({
  sa_business_activities_turnover: z.array(businessActivitySchema).min(1, 'At least one business activity is required'),
  sa_product_services_turnover: z.array(productServiceSchema).min(1, 'At least one product/service is required'),
  sa_locations_plants_offices: z.object({
    national_plants: z.number().min(0, 'Must be 0 or greater'),
    national_offices: z.number().min(0, 'Must be 0 or greater'),
    international_plants: z.number().min(0, 'Must be 0 or greater'),
    international_offices: z.number().min(0, 'Must be 0 or greater')
  }),
  sa_markets_served: z.object({
    locations: z.object({
      national_states: z.number().min(0, 'Must be 0 or greater'),
      international_countries: z.number().min(0, 'Must be 0 or greater')
    }),
    exports_percentage: z.string().refine(
      (val) => {
        const num = parseFloat(val.replace('%', ''));
        return !isNaN(num) && num >= 0 && num <= 100;
      },
      'Export percentage must be between 0 and 100'
    ),
    customer_types: z.string().optional()
  }),
  sa_employee_details: z.object({
    permanent_male: z.number().min(0, 'Must be 0 or greater'),
    permanent_female: z.number().min(0, 'Must be 0 or greater'),
    other_than_permanent_male: z.number().min(0, 'Must be 0 or greater'),
    other_than_permanent_female: z.number().min(0, 'Must be 0 or greater')
  }),
  sa_workers_details: z.object({
    permanent_male: z.number().min(0, 'Must be 0 or greater'),
    permanent_female: z.number().min(0, 'Must be 0 or greater'),
    other_than_permanent_male: z.number().min(0, 'Must be 0 or greater'),
    other_than_permanent_female: z.number().min(0, 'Must be 0 or greater')
  }),
  sa_differently_abled_details: z.object({
    employees_male: z.number().min(0, 'Must be 0 or greater'),
    employees_female: z.number().min(0, 'Must be 0 or greater'),
    workers_male: z.number().min(0, 'Must be 0 or greater'),
    workers_female: z.number().min(0, 'Must be 0 or greater')
  }),
  sa_women_representation_details: z.object({
    board_total_members: z.number().min(0, 'Must be 0 or greater'),
    board_number_of_women: z.number().min(0, 'Must be 0 or greater'),
    kmp_total_personnel: z.number().min(0, 'Must be 0 or greater'),
    kmp_number_of_women: z.number().min(0, 'Must be 0 or greater')
  }).refine(
    (data) => data.board_number_of_women <= data.board_total_members,
    'Number of women on board cannot exceed total board members'
  ).refine(
    (data) => data.kmp_number_of_women <= data.kmp_total_personnel,
    'Number of women in KMP cannot exceed total KMP personnel'
  ),
  sa_turnover_rate: z.object({
    permanent_employees_turnover_rate: z.string().refine(
      (val) => {
        if (!val) return true; // Optional field
        const num = parseFloat(val.replace('%', ''));
        return !isNaN(num) && num >= 0;
      },
      'Turnover rate must be a valid percentage'
    ).optional(),
    permanent_workers_turnover_rate: z.string().refine(
      (val) => {
        if (!val) return true; // Optional field
        const num = parseFloat(val.replace('%', ''));
        return !isNaN(num) && num >= 0;
      },
      'Turnover rate must be a valid percentage'
    ).optional()
  }),
  sa_holding_subsidiary_associate_companies: z.array(holdingSubsidiarySchema).optional(),
  sa_csr_applicable: z.boolean(),
  sa_csr_turnover: z.string().optional(),
  sa_csr_net_worth: z.string().optional(),
  sa_transparency_complaints: z.object({
    received: z.number().min(0, 'Must be 0 or greater'),
    pending: z.number().min(0, 'Must be 0 or greater'),
    remarks: z.string().optional()
  }).refine(
    (data) => data.pending <= data.received,
    'Pending complaints cannot exceed total received complaints'
  )
});

// Combined schema for the entire Section A form
export const sectionAFormSchema = z.object({
  companyInfo: companyInfoSchema,
  sectionAData: sectionADataSchema
});
