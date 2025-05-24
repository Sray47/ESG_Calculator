// testData.js 

/**
 * Test data for BRSR reporting, extracted from NALCO BRSR reports
 * This data will be used to automatically fill forms during testing
 */
const testData = {
  // Authentication
  auth: {
    email: 'autotest1747976939143@gmail.com',
    password: 'Test123!'
  },
  
  // Company Profile Data
  company: {
    name: 'National Aluminium Company Limited',
    cin: 'L27203OR1981GOI000920',
    year_of_incorporation: '1981',
    registered_office_address: 'NALCO Bhawan, Plot No. P/1, Nayapalli, Bhubaneswar-751013, Odisha',
    corporate_address: 'NALCO Bhawan, Plot No. P/1, Nayapalli, Bhubaneswar-751013, Odisha',
    telephone: '0674-2301988',
    website: 'www.nalcoindia.com',
    stock_exchange_listed: 'BSE Limited and National Stock Exchange of India Limited',
    paid_up_capital: '918,32,71,590',
    brsr_contact_name: 'Shri B K Sahu',
    brsr_contact_mail: 'bksahu@nalcoindia.co.in',
    brsr_contact_number: '0674-2300430'
  },
  
  // Section A Data
  sectionA: {
    // Q13: Reporting Boundary
    reporting_boundary: 'Standalone',
    
    // Q14: Business Activities
    business_activities: [
      {
        description_main: 'Mining & Production',
        description_business: 'Mining of bauxite and production of alumina',
        turnover_percentage: '38'
      },
      {
        description_main: 'Manufacturing',
        description_business: 'Production of aluminium',
        turnover_percentage: '50'
      },
      {
        description_main: 'Power Generation',
        description_business: 'Captive power generation',
        turnover_percentage: '12'
      }
    ],
    
    // Q15: Products/Services
    products_services: [
      {
        product_service: 'Calcined Alumina',
        nic_code: '20119',
        turnover_contributed: '38'
      },
      {
        product_service: 'Aluminium',
        nic_code: '24202',
        turnover_contributed: '50'
      },
      {
        product_service: 'Power',
        nic_code: '35102',
        turnover_contributed: '12'
      }
    ],
    
    // Q16: Locations
    locations: {
      national_plants: 5,
      national_offices: 10,
      international_plants: 0,
      international_offices: 3
    },
    
    // Q17: Markets Served
    markets_served: {
      locations: {
        national_states: 29,
        international_countries: 15
      },
      exports_percentage: '15',
      customer_types: 'B2B manufacturing companies, government entities, power producers, and international metal traders'
    },
    
    // Q18: Employee and Worker Details
    employees_details: {
      permanent_male: 5142,
      permanent_female: 382,
      other_than_permanent_male: 420,
      other_than_permanent_female: 25
    },
    
    workers_details: {
      permanent_male: 0,
      permanent_female: 0,
      other_than_permanent_male: 9680,
      other_than_permanent_female: 420
    },
    
    differently_abled_details: {
      employees_male: 75,
      employees_female: 5,
      workers_male: 0,
      workers_female: 0
    },
    
    // Q19: Women Representation
    women_representation: {
      board_total_members: 12,
      board_number_of_women: 4,
      kmp_total_personnel: 6,
      kmp_number_of_women: 1
    },
    
    // Q20: Turnover Rate
    turnover_rates: {
      permanent_employees_turnover_rate: '3.1%',
      permanent_workers_turnover_rate: '0%'
    },
    
    // Q21: Holding/Subsidiary Companies
    holding_subsidiary_companies: [
      {
        name: 'NALCO Minerals Limited',
        cin_or_country: 'U13209OR2002PLC007347',
        type: 'Subsidiary',
        percentage_holding: '100'
      },
      {
        name: 'Utkarsha Aluminium Dhatu Nigam Limited',
        cin_or_country: 'U13203TG2019PLC134211',
        type: 'Joint Venture',
        percentage_holding: '50'
      }
    ],
    
    // Q22: CSR
    csr: {
      applicable: true,
      turnover: '8,809.86 crores',
      net_worth: '9,303.33 crores'
    },
    
    // Q23: Transparency & Complaints
    transparency_complaints: {
      received: 15,
      pending: 2,
      remarks: 'All complaints are processed through a formal grievance mechanism.'
    }
  },
  
  // Section B Data
  sectionB: {
    // Sample Section B data based on BRSR format
    policy_management: {
      p1_ethics: {
        has_policy: true,
        approved_by_board: true,
        url: 'https://nalcoindia.com/policies/ethics-policy.pdf'
      },
      p2_sustainability: {
        has_policy: true,
        approved_by_board: true,
        url: 'https://nalcoindia.com/policies/sustainability-policy.pdf'
      },
      // Additional principles would be added here
    },
    
    governance_leadership_oversight: {
      dma_statement: 'The company has established a robust governance structure overseen by the Board of Directors with specific committees for ESG matters.',
      board_statement: 'The Board regularly reviews BRSR compliance and sustainability initiatives.',
      risk_assessment_completed: true,
    },
    
    // Additional Section B data would be defined here
  },
  
  // Sample Section C Data - Principle 1 (Ethics)
  sectionCPrinciple1: {
    leadership_indicators: {
      awareness_programs_count: 12,
      conflicts_of_interest_disclosed: 5,
      anti_corruption_policy_url: 'https://nalcoindia.com/policies/anti-corruption.pdf'
    },
    
    essential_indicators: {
      ethics_training_coverage: {
        board_directors: 100,
        kmp: 100,
        employees: 95,
        workers: 85
      },
      conflicts_of_interest: {
        current_fy_complaints: 3,
        previous_fy_complaints: 5
      }
    }
    // Additional data for Principle 1
  },
  
  // Sections for remaining principles would be defined similarly
};

export default testData;
