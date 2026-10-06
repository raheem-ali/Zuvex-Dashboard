export type FieldConfig = {
  name: string;
  label: string;
  type: "text" | "textarea" | "url" | "number" | "select";
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[]; // for type "select"
};

export type ResourceConfig = {
  resource: "services" | "team" | "publications" | "projects";
  singular: string;
  plural: string;
  description: string;
  titleKey: string;
  subtitleKey: string;
  fields: FieldConfig[];
  reorderable?: boolean; // default true; set false for publications

  // Optional image upload (services, team, publication cover)
  imageField?: string;
  imageUrlKey?: string;
  imageLabel?: string;
  imageHelp?: string;
  imageAccept?: string;

  // Optional document upload (publications)
  fileField?: string;
  fileUrlKey?: string;
  fileLabel?: string;
  fileHelp?: string;
  fileAccept?: string;
};

export const servicesConfig: ResourceConfig = {
  resource: "services",
  singular: "service",
  plural: "Services",
  description: "The services shown on your website. Drag order is set with the arrows.",
  titleKey: "title",
  subtitleKey: "description",
  fields: [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Graphic Design & Branding" },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: true,
      help: "One or two sentences shown under the title.",
    },
  ],
  imageField: "icon",
  imageUrlKey: "icon_url",
  imageLabel: "Icon",
  imageHelp: "Square PNG, SVG, JPG or WebP. Max 2 MB.",
  imageAccept: "image/png,image/jpeg,image/webp,image/svg+xml",
};

export const teamConfig: ResourceConfig = {
  resource: "team",
  singular: "team member",
  plural: "Team",
  description: "The people shown in the Our Team section. Use the arrows to change the order.",
  titleKey: "name",
  subtitleKey: "role",
  fields: [
    { name: "name", label: "Full name", type: "text", required: true, placeholder: "e.g. Ahmed Raza" },
    { name: "role", label: "Role", type: "text", required: true, placeholder: "e.g. Founder & CEO" },
    { name: "bio", label: "Short bio", type: "textarea", required: true, help: "One or two sentences." },
    {
      name: "linkedin_url",
      label: "LinkedIn link (optional)",
      type: "url",
      placeholder: "https://www.linkedin.com/in/...",
      help: "Leave empty to hide the LinkedIn button.",
    },
  ],
  imageField: "photo",
  imageUrlKey: "photo_url",
  imageLabel: "Photo",
  imageHelp: "Portrait or square JPG, PNG or WebP. Max 3 MB.",
  imageAccept: "image/png,image/jpeg,image/webp",
};

export const publicationsConfig: ResourceConfig = {
  resource: "publications",
  singular: "publication",
  plural: "Publications",
  description: "Documents shown on the Publications page. Visitors download the PDF you upload. Sorted by year automatically.",
  titleKey: "title",
  subtitleKey: "type",
  reorderable: false,
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "authors", label: "Authors", type: "text", required: true },
    {
      name: "type",
      label: "Type",
      type: "select",
      required: true,
      options: ["Journal Article", "Conference Paper", "Research Report", "Working Paper", "Book Chapter"],
    },
    { name: "year", label: "Year", type: "number", required: true, placeholder: "2026" },
    { name: "summary", label: "Summary", type: "textarea", required: true },
  ],
  imageField: "cover",
  imageUrlKey: "cover_url",
  imageLabel: "Cover image (optional)",
  imageHelp: "JPG, PNG or WebP. Max 3 MB.",
  imageAccept: "image/png,image/jpeg,image/webp",
  fileField: "file",
  fileUrlKey: "file_url",
  fileLabel: "PDF file",
  fileHelp: "PDF only. Max 20 MB.",
  fileAccept: "application/pdf",
};




// 1) In frontend/lib/resources.ts, change the ResourceConfig line to:
//      resource: "services" | "team" | "publications" | "projects";
// 2) Paste everything below at the END of frontend/lib/resources.ts

/* ---------- Projects (portfolio) ---------- */

// Keep these slugs identical to ProjectController::CATEGORIES and the website's lib/projects.ts
export const PROJECT_CATEGORIES = [
  { slug: "research", label: "Research" },
  { slug: "software", label: "Software Development" },
  { slug: "web", label: "Web Development" },
  { slug: "mobile", label: "Mobile App" },
  { slug: "branding", label: "Branding" },
  { slug: "aiml", label: "AI & ML" },
  { slug: "graphic", label: "Graphic Design" },
];

// Only used by the list page. The add/edit form is its own component (ProjectForm).
export const projectsConfig: ResourceConfig = {
  resource: "projects",
  singular: "project",
  plural: "Projects",
  description: "Projects shown in the Portfolio. Use the arrows to change the order.",
  titleKey: "title",
  subtitleKey: "summary",
  fields: [],
  imageField: "cover",
  imageUrlKey: "cover_url",
  imageLabel: "Cover image",
  imageHelp: "",
  imageAccept: "image/png,image/jpeg,image/webp",
};