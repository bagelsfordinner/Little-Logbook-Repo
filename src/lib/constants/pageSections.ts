/**
 * Default section definitions for all pages in the logbook application.
 * This defines the structure and default content for each page's editable sections.
 */

export const DEFAULT_SECTIONS = {
  home: {
    hero: {
      visible: true,
      imageUrl: null,
      title: "Welcome to Our Journey",
      subtitle: "Following our adventure",
      showDueDate: true
    },
    navigation: {
      visible: true,
      cards: ["gallery", "help", "vault", "faq", "admin"]
    },
    stats: {
      visible: false,
      showPhotoCount: true,
      showCommentCount: true,
      showMemberCount: true
    }
  },
  
  help: {
    registry: {
      visible: true,
      title: "Our Registry",
      links: []
    },
    plan529: {
      visible: false,
      title: "529 College Savings Plan",
      description: "",
      accountInfo: ""
    },
    counters: {
      visible: true,
      title: "What We're Collecting",
      items: []
    },
    giftIdeas: {
      visible: true,
      title: "Gift Ideas",
      description: "Things we'd love help with"
    },
    giftsForParents: {
      visible: false,
      title: "For the Parents",
      description: "Ways to support us directly"
    },
    whatWeNeed: {
      visible: true,
      items: []
    },
    whatWeDontNeed: {
      visible: true,
      items: []
    }
  },
  
  gallery: {
    header: {
      visible: true,
      title: "Our Gallery",
      subtitle: "Capturing every moment"
    },
    layout: {
      style: "grid",
      columns: 3
    },
    filters: {
      visible: true,
      showDateFilter: true,
      showTypeFilter: true
    }
  },
  
  vault: {
    header: {
      visible: true,
      title: "Memory Vault",
      description: "Letters and memories for the future"
    },
    letters: {
      visible: true,
      allowAnonymous: false
    },
    photos: {
      visible: true
    },
    recommendations: {
      visible: true,
      categories: ["restaurants", "books", "movies", "places"]
    }
  },
  
  faq: {
    hospital: {
      visible: true,
      title: "Hospital Information",
      items: []
    },
    visitation: {
      visible: true,
      title: "Visitation Guidelines",
      items: []
    },
    parenting: {
      visible: true,
      title: "Our Parenting Choices",
      items: []
    },
    general: {
      visible: false,
      title: "General Questions",
      items: []
    }
  }
} as const;

/**
 * Valid page types in the logbook application
 */
export type PageType = 'home' | 'help' | 'gallery' | 'vault' | 'faq';

/**
 * Type representing the complete page sections structure
 */
export type PageSections = typeof DEFAULT_SECTIONS;

/**
 * Base type for any section data - all sections must have a visible property
 */
export type SectionData = {
  visible: boolean;
  [key: string]: unknown; // Flexible data for each section
};

/**
 * Type for a specific page's sections
 */
export type PageTypeSections<T extends PageType> = PageSections[T];

/**
 * Type for section keys within a specific page
 */
export type SectionKey<T extends PageType> = keyof PageSections[T];

/**
 * Helper type to get the data type for a specific section
 */
export type SectionDataType<
  TPage extends PageType,
  TSection extends SectionKey<TPage>
> = PageSections[TPage][TSection];