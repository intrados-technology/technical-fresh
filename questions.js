// ============================================================
// INTRADOS DESIGN STUDIO – Technical Assessment Test
// questions.js
//
// Section A (Part A1): Isometric → Orthographic  Q1–Q5   1 mark each
// Section A (Part A2): Orthographic → Isometric  Q6–Q10  1 mark each
// Section B: Projection & Scale                  Q11–Q20 1 mark each
// Section C: Dimensioning & Line Types           Q21–Q25 1 mark each
// Section D: Section & Hidden Features           Q26–Q30 1 mark each
// Total: 30 Questions × 1 Mark = 30 Marks
//
// Answer key: Q1=B  Q2=D  Q3=B  Q4=C  Q5=D
//             Q6=B  Q7=C  Q8=B  Q9=B  Q10=C
//             Q11=B Q12=A Q13=A Q14=C Q15=B
//             Q16=C Q17=B Q18=C Q19=B Q20=C
//             Q21=B Q22=A Q23=C Q24=B Q25=B
//             Q26=B Q27=C Q28=C Q29=C Q30=A
//
// NOTE: Q1–Q10 are image-based. Their options ["A","B","C","D"]
//       are NEVER shuffled — the letters must stay in fixed order
//       to match the visual labels printed on the image.
//       Q11–Q30 text options ARE shuffled per session.
// ============================================================

const QUESTIONS = [

  // ==========================================================
  // SECTION A – PART A1: ISOMETRIC → ORTHOGRAPHIC (Q1–Q5)
  // 1 mark each | Image-based | NO shuffle
  // ==========================================================

  {
    id: 1, section: "A",
    sectionLabel: "Part A1: Isometric \u2192 Orthographic",
    text: "Which of the following is the correct FRONT VIEW?",
    image: "images/q1.png",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
    marks: 1,
    shuffle: false
  },
  {
    id: 2, section: "A",
    sectionLabel: "Part A1: Isometric \u2192 Orthographic",
    text: "Which of the following is the correct TOP VIEW?",
    image: "images/q2.png",
    options: ["A", "B", "C", "D"],
    correctIndex: 3,
    marks: 1,
    shuffle: false
  },
  {
    id: 3, section: "A",
    sectionLabel: "Part A1: Isometric \u2192 Orthographic",
    text: "Which of the following is the correct RIGHT SIDE VIEW?",
    image: "images/q3.png",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
    marks: 1,
    shuffle: false
  },
  {
    id: 4, section: "A",
    sectionLabel: "Part A1: Isometric \u2192 Orthographic",
    text: "Which of the following FRONT VIEW correctly shows the hidden lines?",
    image: "images/q4.png",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
    marks: 1,
    shuffle: false
  },
  {
    id: 5, section: "A",
    sectionLabel: "Part A1: Isometric \u2192 Orthographic",
    text: "FRONT VIEW and TOP VIEW are given. Which is the correct RIGHT SIDE VIEW?",
    image: "images/q5.png",
    options: ["A", "B", "C", "D"],
    correctIndex: 2,
    marks: 1,
    shuffle: false
  },

  // ==========================================================
  // SECTION A – PART A2: ORTHOGRAPHIC → ISOMETRIC (Q6–Q10)
  // 1 mark each | Image-based | NO shuffle
  // ==========================================================

  {
    id: 6, section: "A",
    sectionLabel: "Part A2: Orthographic \u2192 Isometric",
    text: "Front, Top and Right Side views are given. Which is the correct ISOMETRIC VIEW?",
    image: "images/q6.png",
    options: ["A", "B", "C", "D"],
    correctIndex: 3,
    marks: 1,
    shuffle: false
  },
  {
    id: 7, section: "A",
    sectionLabel: "Part A2: Orthographic \u2192 Isometric",
    text: "Front, Top and Right Side views are given. Choose the matching ISOMETRIC VIEW.",
    image: "images/q7.png",
    options: ["A", "B", "C", "D"],
    correctIndex: 2,
    marks: 1,
    shuffle: false
  },
  {
    id: 8, section: "A",
    sectionLabel: "Part A2: Orthographic \u2192 Isometric",
    text: "Front, Top and Right Side views are given. Select the correct ISOMETRIC VIEW.",
    image: "images/q8.png",
    options: ["A", "B", "C", "D"],
    correctIndex: 2,
    marks: 1,
    shuffle: false
  },
  {
    id: 9, section: "A",
    sectionLabel: "Part A2: Orthographic \u2192 Isometric",
    text: "Front, Top and Right Side views are given. Which is the correct ISOMETRIC VIEW?",
    image: "images/q9.png",
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
    marks: 1,
    shuffle: false
  },
  {
    id: 10, section: "A",
    sectionLabel: "Part A2: Orthographic \u2192 Isometric",
    text: "Front, Top and Right Side views are given. Select the corresponding ISOMETRIC VIEW.",
    image: "images/q10.png",
    options: ["A", "B", "C", "D"],
    correctIndex: 2,
    marks: 1,
    shuffle: false
  },

  // ==========================================================
  // SECTION B – PROJECTION & SCALE (Q11–Q20)
  // 1 mark each | Text MCQ | shuffled
  // ==========================================================

  {
    id: 11, section: "B",
    sectionLabel: "Projection & Scale",
    text: "In First Angle Projection, the object is placed:",
    options: [
      "Between observer and plane",
      "Behind projection plane",
      "Above observer",
      "Below observer"
    ],
    correctIndex: 1,
    marks: 1,
    shuffle: true
  },
  {
    id: 12, section: "B",
    sectionLabel: "Projection & Scale",
    text: "Which projection method is predominantly used in India?",
    options: [
      "First Angle Projection",
      "Third Angle Projection",
      "Oblique Projection",
      "Perspective Projection"
    ],
    correctIndex: 0,
    marks: 1,
    shuffle: true
  },
  {
    id: 13, section: "B",
    sectionLabel: "Projection & Scale",
    text: "In Third Angle Projection, Top View is placed:",
    options: [
      "Above Front View",
      "Below Front View",
      "Left of Front View",
      "Right of Front View"
    ],
    correctIndex: 0,
    marks: 1,
    shuffle: true
  },
  {
    id: 14, section: "B",
    sectionLabel: "Projection & Scale",
    text: "A scale of 1:1 represents:",
    options: [
      "Reduced Scale",
      "Enlarged Scale",
      "Full Scale",
      "Comparative Scale"
    ],
    correctIndex: 2,
    marks: 1,
    shuffle: true
  },
  {
    id: 15, section: "B",
    sectionLabel: "Projection & Scale",
    text: "A scale of 1:50 means:",
    options: [
      "Drawing is enlarged",
      "Drawing is actual size",
      "Drawing is reduced",
      "Drawing is half size"
    ],
    correctIndex: 2,
    marks: 1,
    shuffle: true
  },
  {
    id: 16, section: "B",
    sectionLabel: "Projection & Scale",
    text: "Which scale is commonly used for building floor plans?",
    options: [
      "1:1",
      "1:10",
      "1:50",
      "10:1"
    ],
    correctIndex: 2,
    marks: 1,
    shuffle: true
  },
  {
    id: 17, section: "B",
    sectionLabel: "Projection & Scale",
    text: "Which projection plane is used for Top View?",
    options: [
      "Vertical Plane",
      "Horizontal Plane",
      "Profile Plane",
      "Auxiliary Plane"
    ],
    correctIndex: 1,
    marks: 1,
    shuffle: true
  },
  {
    id: 18, section: "B",
    sectionLabel: "Projection & Scale",
    text: "Which projection plane is used for Front View?",
    options: [
      "Horizontal Plane",
      "Profile Plane",
      "Vertical Plane",
      "Auxiliary Plane"
    ],
    correctIndex: 2,
    marks: 1,
    shuffle: true
  },
  {
    id: 19, section: "B",
    sectionLabel: "Projection & Scale",
    text: "The ratio of drawing size to actual size is called:",
    options: [
      "Dimension",
      "Scale",
      "Tolerance",
      "Projection"
    ],
    correctIndex: 1,
    marks: 1,
    shuffle: true
  },
  {
    id: 20, section: "B",
    sectionLabel: "Projection & Scale",
    text: "Third Angle Projection is commonly used in:",
    options: [
      "India",
      "UK",
      "USA",
      "Germany"
    ],
    correctIndex: 2,
    marks: 1,
    shuffle: true
  },

  // ==========================================================
  // SECTION C – DIMENSIONING & LINE TYPES (Q21–Q25)
  // 1 mark each | Text MCQ | shuffled
  // ==========================================================

  {
    id: 21, section: "C",
    sectionLabel: "Dimensioning & Line Types",
    text: "Which line represents visible edges?",
    options: [
      "Thin continuous line",
      "Thick continuous line",
      "Dashed thin line",
      "Chain dotted line"
    ],
    correctIndex: 1,
    marks: 1,
    shuffle: true
  },
  {
    id: 22, section: "C",
    sectionLabel: "Dimensioning & Line Types",
    text: "Hidden edges are represented by:",
    options: [
      "Dashed thin line",
      "Thick continuous line",
      "Chain dotted line",
      "Wavy line"
    ],
    correctIndex: 0,
    marks: 1,
    shuffle: true
  },
  {
    id: 23, section: "C",
    sectionLabel: "Dimensioning & Line Types",
    text: "Centre lines are drawn using:",
    options: [
      "Thick continuous line",
      "Dashed thin line",
      "Long chain thin line",
      "Wavy line"
    ],
    correctIndex: 2,
    marks: 1,
    shuffle: true
  },
  {
    id: 24, section: "C",
    sectionLabel: "Dimensioning & Line Types",
    text: "Dimension lines are generally terminated by:",
    options: [
      "Dots",
      "Arrowheads",
      "Filled triangles",
      "Open squares"
    ],
    correctIndex: 1,
    marks: 1,
    shuffle: true
  },
  {
    id: 25, section: "C",
    sectionLabel: "Dimensioning & Line Types",
    text: "Extension lines are drawn:",
    options: [
      "Thick",
      "Thin",
      "Dashed",
      "Zigzag"
    ],
    correctIndex: 1,
    marks: 1,
    shuffle: true
  },

  // ==========================================================
  // SECTION D – SECTION & HIDDEN FEATURES (Q26–Q30)
  // 1 mark each | Text MCQ | shuffled
  // ==========================================================

  {
    id: 26, section: "D",
    sectionLabel: "Section & Hidden Features",
    text: "A section view is used to:",
    options: [
      "Increase scale",
      "Show hidden internal details",
      "Reduce dimensions",
      "Create perspective"
    ],
    correctIndex: 1,
    marks: 1,
    shuffle: true
  },
  {
    id: 27, section: "D",
    sectionLabel: "Section & Hidden Features",
    text: "The line indicating where the object is cut is called:",
    options: [
      "Center Line",
      "Projection Line",
      "Cutting Plane Line",
      "Hidden Line"
    ],
    correctIndex: 2,
    marks: 1,
    shuffle: true
  },
  {
    id: 28, section: "D",
    sectionLabel: "Section & Hidden Features",
    text: "A full section cuts:",
    options: [
      "Half the object",
      "Quarter of object",
      "Entire object",
      "Surface only"
    ],
    correctIndex: 2,
    marks: 1,
    shuffle: true
  },
  {
    id: 29, section: "D",
    sectionLabel: "Section & Hidden Features",
    text: "Hatching lines indicate:",
    options: [
      "Center",
      "Hidden Features",
      "Cut Material",
      "Dimensions"
    ],
    correctIndex: 2,
    marks: 1,
    shuffle: true
  },
  {
    id: 30, section: "D",
    sectionLabel: "Section & Hidden Features",
    text: "A half-section is typically used for:",
    options: [
      "Symmetrical Objects",
      "Irregular Objects",
      "Flat Plates",
      "Circles Only"
    ],
    correctIndex: 0,
    marks: 1,
    shuffle: true
  }

]; // end QUESTIONS


// ============================================================
// SHUFFLE ENGINE
// Q1–Q10  (shuffle: false) — options stay in fixed A/B/C/D order
// Q11–Q30 (shuffle: true)  — options are Fisher-Yates shuffled
// Correct answer tracking is done via the { text, correct } pair
// so scoring is never broken regardless of display order.
// ============================================================

function shuffleQuestionOptions(question) {
  const q = JSON.parse(JSON.stringify(question));

  // Skip shuffle for image-based questions
  if (!q.shuffle) return q;

  const paired = q.options.map(function(text, i) {
    return { text: text, correct: (i === q.correctIndex) };
  });

  // Fisher-Yates
  for (let i = paired.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = paired[i]; paired[i] = paired[j]; paired[j] = tmp;
  }

  q.options      = paired.map(function(p) { return p.text; });
  q.correctIndex = paired.findIndex(function(p) { return p.correct; });

  return q;
}

const SHUFFLED_QUESTIONS = QUESTIONS.map(shuffleQuestionOptions);
