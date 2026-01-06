// src/modules/demo/demoData/demoFile.js
// Static demo file metadata and FileViewer-compatible descriptors.

// NOTE: Image paths are local bundle assets that should be added under
// e.g. /public/demo-assets/ or imported via Vite/webpack in a future pass.
// For Phase B we only define structure; no behavior or network calls.

export const DEMO_FILE_ID = "demo-file-ct";

export const demoFileMetadata = {
  id: DEMO_FILE_ID,
  name: "Abdominal_CT_Lecture.pptx",
  title: "Abdominal_CT_Lecture.pptx",
  category: "lectures",
  uiCategory: "Lecture",
};

// FileViewer-compatible "file" object shape (subset of real library item)
// including page_contents for 3 pages.
//
// Page 2 is explicitly marked as image-only (no selectable text).

export const DEMO_IMAGE_ONLY_PAGE_INDEX = 1; // zero-based index (page 2)

export const demoFileViewerFile = {
  id: DEMO_FILE_ID,
  title: demoFileMetadata.title,
  category: demoFileMetadata.category,
  mime_type: "application/pdf",
  signed_url: null, // not used in demo mode; we rely on pre-rendered PNGs
  page_count: 3,
  total_pages: 3,
  page_contents: [
    {
      page_number: 1,
      image_url: "/demo-assets/ct-page-1.png",
      has_text: true,
      description: "CT overview slide with title and bullet points.",
    },
    {
      page_number: 2,
      image_url: "/demo-assets/ct-page-2.png",
      has_text: false,
      description: "Image-only axial abdominal CT slice (no text).",
      image_only: true,
    },
    {
      page_number: 3,
      image_url: "/demo-assets/ct-page-3.png",
      has_text: true,
      description: "Key findings and learning points.",
    },
  ],
};


