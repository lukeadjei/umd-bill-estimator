// Hardcoded from the user-supplied list pulled off UMD's academic catalog
// (2026-09-10) -- not scraped, no staging table involved (this isn't rate
// data, see CLAUDE.md rule 6, which only governs the scraper pipeline).
// Deliberately excludes every "at Shady Grove" and "at USMSM" variant (those
// are the same major offered at a satellite campus, not a College Park
// program -- the discontinued Shady Grove Public Health Science entry is
// dropped for the same reason). Order matches the source list, which was
// already alphabetical. Display labels drop the redundant trailing " Major"
// (every entry had one) -- the parenthetical suffixes on a few entries
// (e.g. "(ENGL)"/"(SLLC)", "(BSOS)"/"(CMNS)") are kept as-is from the source
// list, since those majors share a name but are real, distinct programs in
// different departments.
export const MAJORS: string[] = [
  "Accounting",
  "Aerospace Engineering",
  "African American and Africana Studies",
  "Agricultural and Resource Economics",
  "Agricultural Science and Technology",
  "American Studies",
  "Animal Sciences",
  "Anthropology",
  "Arabic Studies",
  "Architecture",
  "Art History",
  "Artificial Intelligence: Computational Structures for AI Systems",
  "Astronomy",
  "Atmospheric and Oceanic Science",
  "Biochemistry",
  "Biocomputational Engineering",
  "Bioengineering",
  "Biological Sciences",
  "Chemical Engineering",
  "Chemistry (B.A., B.S.)",
  "Chinese",
  "Cinema and Media Studies (ENGL)",
  "Cinema and Media Studies (SLLC)",
  "Civil Engineering",
  "Classical Languages and Literatures",
  "Communication",
  "Computer Engineering",
  "Computer Science",
  "Criminology and Criminal Justice",
  "Cyber-Physical Systems Engineering",
  "Dance",
  "Early Childhood/Early Childhood Special Education",
  "Economics",
  "Electrical Engineering",
  "Elementary Education",
  "Elementary/Middle Special Education",
  "English Language and Literature",
  "Environmental Science and Policy",
  "Environmental Science and Technology",
  "Family Health",
  "Fermentation Science",
  "Finance",
  "Fire Protection Engineering",
  "French Language and Literature",
  "Geographical Sciences",
  "Geology",
  "German Studies",
  "Global and Foreign Policy",
  "Global Culture and Thought",
  "Global Health",
  "Government and Politics",
  "Hearing and Speech Sciences",
  "History",
  "Human Development",
  "Human-Centered Artificial Intelligence",
  "Immersive Media Design (ARTT)",
  "Immersive Media Design (CMSC)",
  "Individual Studies Program",
  "Information Science",
  "Information Systems",
  "International Business",
  "International Relations",
  "Italian Studies",
  "Japanese",
  "Jewish Studies",
  "Journalism",
  "Kinesiology",
  "Landscape Architecture",
  "Linguistics",
  "Management",
  "Marketing",
  "Materials Science and Engineering",
  "Mathematics",
  "Mechanical Engineering",
  "Mechatronics Engineering",
  "Middle School Education",
  "Music",
  "Neuroscience (BSOS)",
  "Neuroscience (CMNS)",
  "Nutrition and Food Science",
  "Operations Management & Business Analytics",
  "Persian Studies",
  "Philosophy",
  "Philosophy, Politics, and Economics",
  "Physics",
  "Plant Sciences",
  "Psychology",
  "Public Health Practice",
  "Public Health Science",
  "Public Policy",
  "Real Estate and the Built Environment",
  "Religions of the Ancient Middle East",
  "Romance Languages",
  "Russian Language and Literature",
  "Secondary Education - Art",
  "Secondary Education - English",
  "Secondary Education - Mathematics",
  "Secondary Education - Science",
  "Secondary Education - Social Studies",
  "Secondary Education - World Language",
  "Social Data Science (BSOS)",
  "Social Data Science (INFO)",
  "Sociology",
  "Spanish Language, Literatures, and Culture",
  "Studio Art",
  "Supply Chain Management",
  "Technology and Information Design",
  "Theatre",
  "Women, Gender, and Sexuality Studies",
];

// The existing TuitionPanel copy already asserted "Business, Engineering,
// and Computer Science" pay differential tuition -- this is that same
// existing assumption, just encoded as real data instead of only prose, so
// MajorPanel/TuitionPanel can cross-reference it. Built from which college's
// catalog section each major's source URL lived under:
//   - Business (Robert H. Smith School of Business)
//   - Engineering (A. James Clark School of Engineering)
//   - Computer Science (the CS department specifically, not all of CMNS --
//     e.g. Astronomy/Physics/Mathematics are CMNS but not flagged here)
// Worth double-checking against UMD's actual differential-tuition policy --
// this codebase never had this encoded as data before, only as a sentence.
export const DIFFERENTIAL_TUITION_MAJORS: ReadonlySet<string> = new Set([
  // Business
  "Accounting",
  "Finance",
  "Information Systems",
  "International Business",
  "Management",
  "Marketing",
  "Operations Management & Business Analytics",
  "Supply Chain Management",
  // Engineering
  "Aerospace Engineering",
  "Bioengineering",
  "Biocomputational Engineering",
  "Chemical Engineering",
  "Civil Engineering",
  "Computer Engineering",
  "Cyber-Physical Systems Engineering",
  "Electrical Engineering",
  "Fire Protection Engineering",
  "Materials Science and Engineering",
  "Mechanical Engineering",
  "Mechatronics Engineering",
  // Computer Science
  "Artificial Intelligence: Computational Structures for AI Systems",
  "Computer Science",
  "Immersive Media Design (CMSC)",
]);

export function majorHasDifferentialTuition(major: string): boolean {
  return DIFFERENTIAL_TUITION_MAJORS.has(major);
}
