// src/modules/demo/demoData/demoSummary.js
// Static demo summary data for Demo Mode.

import { DEMO_FILE_ID } from "./demoFile";

export const DEMO_SUMMARY_ID = "demo-summary-ct";

// Demo summary with realistic medical content suitable for highlighting
export const demoSummary = {
  id: DEMO_SUMMARY_ID,
  title: "Abdominal CT Lecture - Key Findings",
  file_name: "Abdominal_CT_Lecture.pptx",
  file_id: DEMO_FILE_ID,
  academic_stage: "Medical Student",
  specialty: "Radiology",
  goal: "Exam Preparation",
  created_at: new Date().toISOString(),
  sections: [
    {
      heading: "Overview",
      content: "This lecture covers fundamental principles of abdominal CT interpretation, focusing on contrast-enhanced imaging techniques and common pathological findings.",
    },
    {
      heading: "Key Anatomical Structures",
      content: "The abdominal CT demonstrates normal liver architecture with homogeneous enhancement. The portal vein and hepatic veins are clearly visualized. The spleen shows uniform enhancement without focal lesions. The kidneys demonstrate normal corticomedullary differentiation with prompt contrast excretion.",
    },
    {
      heading: "Pathological Findings",
      content: "A well-defined, low-attenuation lesion is identified in hepatic segment VIII, measuring approximately 2.5 cm. The lesion demonstrates no internal enhancement and smooth margins, consistent with a simple hepatic cyst. No evidence of biliary ductal dilatation or portal venous thrombosis. The pancreas appears normal in size and enhancement pattern.",
    },
    {
      heading: "Clinical Significance",
      content: "Simple hepatic cysts are benign and typically require no intervention unless symptomatic. The absence of enhancement helps differentiate from solid lesions. Follow-up imaging may be recommended if the patient develops symptoms or if the lesion increases in size.",
    },
  ],
};

