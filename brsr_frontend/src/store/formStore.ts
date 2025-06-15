import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface FormSection {
  id: string;
  name: string;
  isComplete: boolean;
  isDirty: boolean;
  lastUpdated?: Date;
  errors?: string[];
}

interface ValidationError {
  field: string;
  message: string;
  section: string;
}

interface FormStore {
  // Current state
  currentSection: string;
  reportId: string | null;
  
  // Section management
  sections: Record<string, FormSection>;
  validationErrors: ValidationError[];
  
  // Navigation state
  visitedSections: string[];
  hasUnsavedChanges: boolean;
  
  // Actions
  setCurrentSection: (section: string) => void;
  setReportId: (id: string) => void;
  updateSectionStatus: (sectionId: string, updates: Partial<FormSection>) => void;
  markSectionComplete: (sectionId: string) => void;
  markSectionDirty: (sectionId: string) => void;
  addValidationError: (error: ValidationError) => void;
  clearValidationErrors: (section?: string) => void;
  markSectionVisited: (sectionId: string) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  
  // Computed getters
  getCompletedSections: () => string[];
  getIncompleteSections: () => string[];
  getSectionProgress: () => { completed: number; total: number; percentage: number };
  
  // Reset functionality
  reset: () => void;
  resetSection: (sectionId: string) => void;
}

const initialSections: Record<string, FormSection> = {
  'section-a': {
    id: 'section-a',
    name: 'General Disclosures',
    isComplete: false,
    isDirty: false,
  },
  'section-b': {
    id: 'section-b',
    name: 'Management and Process Disclosures',
    isComplete: false,
    isDirty: false,
  },
  'section-c-p1': {
    id: 'section-c-p1',
    name: 'Principle 1: Ethical Conduct',
    isComplete: false,
    isDirty: false,
  },
  'section-c-p2': {
    id: 'section-c-p2',
    name: 'Principle 2: Sustainable Goods & Services',
    isComplete: false,
    isDirty: false,
  },
  'section-c-p3': {
    id: 'section-c-p3',
    name: 'Principle 3: Employee Wellbeing',
    isComplete: false,
    isDirty: false,
  },
  'section-c-p4': {
    id: 'section-c-p4',
    name: 'Principle 4: Stakeholder Engagement',
    isComplete: false,
    isDirty: false,
  },
  'section-c-p5': {
    id: 'section-c-p5',
    name: 'Principle 5: Governance Ethics',
    isComplete: false,
    isDirty: false,
  },
  'section-c-p6': {
    id: 'section-c-p6',
    name: 'Principle 6: Environmental Circular Economy',
    isComplete: false,
    isDirty: false,
  },
  'section-c-p7': {
    id: 'section-c-p7',
    name: 'Principle 7: Social Human Rights',
    isComplete: false,
    isDirty: false,
  },
  'section-c-p8': {
    id: 'section-c-p8',
    name: 'Principle 8: Governance Anti-Corruption',
    isComplete: false,
    isDirty: false,
  },
  'section-c-p9': {
    id: 'section-c-p9',
    name: 'Principle 9: Governance Responsible Business',
    isComplete: false,
    isDirty: false,
  },
  'review-submit': {
    id: 'review-submit',
    name: 'Review & Submit',
    isComplete: false,
    isDirty: false,
  },
};

export const useFormStore = create<FormStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSection: 'section-a',
        reportId: null,
        sections: { ...initialSections },
        validationErrors: [],
        visitedSections: [],
        hasUnsavedChanges: false,

        // Actions
        setCurrentSection: (section: string) => {
          set((state) => ({
            currentSection: section,
            visitedSections: state.visitedSections.includes(section)
              ? state.visitedSections
              : [...state.visitedSections, section],
          }));
        },

        setReportId: (id: string) => {
          set({ reportId: id });
        },

        updateSectionStatus: (sectionId: string, updates: Partial<FormSection>) => {
          set((state) => ({
            sections: {
              ...state.sections,
              [sectionId]: {
                ...state.sections[sectionId],
                ...updates,
                lastUpdated: new Date(),
              },
            },
          }));
        },

        markSectionComplete: (sectionId: string) => {
          get().updateSectionStatus(sectionId, { isComplete: true, isDirty: false });
        },

        markSectionDirty: (sectionId: string) => {
          set((state) => ({
            sections: {
              ...state.sections,
              [sectionId]: {
                ...state.sections[sectionId],
                isDirty: true,
                lastUpdated: new Date(),
              },
            },
            hasUnsavedChanges: true,
          }));
        },

        addValidationError: (error: ValidationError) => {
          set((state) => ({
            validationErrors: [...state.validationErrors, error],
          }));
        },

        clearValidationErrors: (section?: string) => {
          set((state) => ({
            validationErrors: section
              ? state.validationErrors.filter((error) => error.section !== section)
              : [],
          }));
        },

        markSectionVisited: (sectionId: string) => {
          set((state) => ({
            visitedSections: state.visitedSections.includes(sectionId)
              ? state.visitedSections
              : [...state.visitedSections, sectionId],
          }));
        },

        setUnsavedChanges: (hasChanges: boolean) => {
          set({ hasUnsavedChanges: hasChanges });
        },

        // Computed getters
        getCompletedSections: () => {
          const { sections } = get();
          return Object.keys(sections).filter((key) => sections[key].isComplete);
        },

        getIncompleteSections: () => {
          const { sections } = get();
          return Object.keys(sections).filter((key) => !sections[key].isComplete);
        },

        getSectionProgress: () => {
          const { sections } = get();
          const sectionList = Object.values(sections);
          const completed = sectionList.filter((s) => s.isComplete).length;
          const total = sectionList.length;
          return {
            completed,
            total,
            percentage: Math.round((completed / total) * 100),
          };
        },

        // Reset functionality
        reset: () => {
          set({
            currentSection: 'section-a',
            reportId: null,
            sections: { ...initialSections },
            validationErrors: [],
            visitedSections: [],
            hasUnsavedChanges: false,
          });
        },

        resetSection: (sectionId: string) => {
          set((state) => ({
            sections: {
              ...state.sections,
              [sectionId]: {
                ...initialSections[sectionId],
              },
            },
          }));
        },
      }),
      {
        name: 'brsr-form-store',
        partialize: (state) => ({
          // Only persist certain parts of the state
          reportId: state.reportId,
          visitedSections: state.visitedSections,
          sections: state.sections,
        }),
      }
    ),
    {
      name: 'BRSR Form Store',
    }  )
);

// Utility hooks for easier access to specific parts of the store
export const useCurrentSection = () => useFormStore((state) => state.currentSection);
export const useReportId = () => useFormStore((state) => state.reportId);
export const useHasUnsavedChanges = () => useFormStore((state) => state.hasUnsavedChanges);
export const useValidationErrors = (section?: string) =>
  useFormStore((state) =>
    section
      ? state.validationErrors.filter((error) => error.section === section)
      : state.validationErrors
  );
