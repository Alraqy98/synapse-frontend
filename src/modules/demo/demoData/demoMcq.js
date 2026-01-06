// src/modules/demo/demoData/demoMcq.js
// Static demo MCQ deck, questions, and progress states for Demo Mode.

export const DEMO_MCQ_DECK_ID = "demo-mcq-ct";

export const demoMcqDeck = {
  id: DEMO_MCQ_DECK_ID,
  title: "Abdominal CT — Core Findings",
  generating: false,
  status: "ready",
  question_count: 3,
  question_count_target: 3,
};

// Minimal question shape compatible with MCQDeckView expectations.
// options_full includes letter + explanation and correctness metadata.

export const demoMcqQuestions = [
  {
    id: "demo-q1",
    question: "On this axial CT slice, which structure is labeled as the low-attenuation area in segment VIII?",
    options: [
      "Simple hepatic cyst",
      "Hemangioma",
      "Hepatocellular carcinoma",
      "Portal vein thrombosis",
    ],
    correct_option_letter: "A",
    options_full: [
      {
        letter: "A",
        text: "Simple hepatic cyst",
        is_correct: true,
        explanation: "The lesion is well-defined, homogenous, and fluid-density without enhancement, consistent with a simple cyst.",
      },
      {
        letter: "B",
        text: "Hemangioma",
        is_correct: false,
        explanation: "Typical hemangiomas show peripheral nodular enhancement with centripetal fill-in, not a purely low-attenuation lesion.",
      },
      {
        letter: "C",
        text: "Hepatocellular carcinoma",
        is_correct: false,
        explanation: "HCC lesions are usually heterogeneous with arterial enhancement and washout, not simple fluid density.",
      },
      {
        letter: "D",
        text: "Portal vein thrombosis",
        is_correct: false,
        explanation: "Portal vein thrombosis appears as intraluminal filling defect in the portal vein, not a parenchymal cystic lesion.",
      },
    ],
  },
  {
    id: "demo-q2",
    question: "Which window setting is most appropriate to evaluate solid organ detail on this abdominal CT?",
    options: [
      "Lung window",
      "Soft tissue window",
      "Bone window",
      "Brain window",
    ],
    correct_option_letter: "B",
    options_full: [
      {
        letter: "A",
        text: "Lung window",
        is_correct: false,
        explanation: "Lung windows are optimized for air-filled structures and would obscure soft tissue contrast in the abdomen.",
      },
      {
        letter: "B",
        text: "Soft tissue window",
        is_correct: true,
        explanation: "Soft tissue windows are used to assess parenchymal organs, vessels, and abdominal masses.",
      },
      {
        letter: "C",
        text: "Bone window",
        is_correct: false,
        explanation: "Bone windows exaggerate cortical detail but reduce soft tissue contrast.",
      },
      {
        letter: "D",
        text: "Brain window",
        is_correct: false,
        explanation: "Brain windows are tailored to intracranial structures, not abdominal organs.",
      },
    ],
  },
  {
    id: "demo-q3",
    question: "In the context of abdominal CT interpretation, which of the following best describes 'oral contrast'?",
    options: [
      "Intravenous iodine used to opacify vessels",
      "Air insufflated into the colon for CT colonography",
      "Diluted contrast agent ingested to opacify the GI lumen",
      "Gadolinium-based contrast for soft tissue enhancement",
    ],
    correct_option_letter: "C",
    options_full: [
      {
        letter: "A",
        text: "Intravenous iodine used to opacify vessels",
        is_correct: false,
        explanation: "This describes IV contrast, not oral contrast.",
      },
      {
        letter: "B",
        text: "Air insufflated into the colon for CT colonography",
        is_correct: false,
        explanation: "This is insufflated gas for distension, not an ingested contrast agent.",
      },
      {
        letter: "C",
        text: "Diluted contrast agent ingested to opacify the GI lumen",
        is_correct: true,
        explanation: "Oral contrast is ingested to outline the gastrointestinal tract on CT.",
      },
      {
        letter: "D",
        text: "Gadolinium-based contrast for soft tissue enhancement",
        is_correct: false,
        explanation: "Gadolinium is used primarily in MRI, not routine abdominal CT.",
      },
    ],
  },
];

// Demo progress states

export const demoMcqProgressInProgress = {
  status: "in_progress",
  last_question_index: 0, // user answered first question
  questions_answered: 1,
  questions_correct: 1,
  questions_incorrect: 0,
  attempt_count: 1,
  run_mode: "full",
};

export const demoMcqProgressCompleted = {
  status: "completed",
  last_question_index: 2,
  questions_answered: 3,
  questions_correct: 3,
  questions_incorrect: 0,
  attempt_count: 1,
  run_mode: "full",
};


