/**
 * Aptitude practice sets. Written for Tech Epitome. Server-side only: the page
 * passes questions to the browser without answers, and the action grades.
 */
export type AptitudeQuestion = {
  id: string;
  prompt: string;
  options: readonly string[];
  /** Index into `options`. */
  answer: number;
  explanation: string;
};

export type AptitudeTopic = {
  key: string;
  title: string;
  description: string;
  questions: readonly AptitudeQuestion[];
};

export const APTITUDE_TOPICS: readonly AptitudeTopic[] = [
  {
    key: "quantitative",
    title: "Quantitative",
    description:
      "Speed, percentages, work, averages, interest, ratios, probability and mixtures.",
    questions: [
      {
        id: "q1",
        prompt: "A 150 m train passes a pole in 10 seconds. What is its speed?",
        options: ["45 km/h", "50 km/h", "54 km/h", "60 km/h"],
        answer: 2,
        explanation: "150 / 10 = 15 m/s, and 15 × 3.6 = 54 km/h.",
      },
      {
        id: "q2",
        prompt: "A price rises 20% and then falls 20%. What is the net change?",
        options: ["No change", "4% lower", "4% higher", "2% lower"],
        answer: 1,
        explanation: "1.2 × 0.8 = 0.96, which is 4% below the start.",
      },
      {
        id: "q3",
        prompt:
          "3 workers finish a job in 12 days. At the same rate, how long do 4 workers take?",
        options: ["8 days", "9 days", "10 days", "16 days"],
        answer: 1,
        explanation: "The job is 36 worker-days, and 36 / 4 = 9.",
      },
      {
        id: "q4",
        prompt:
          "The average of 5 numbers is 18. A sixth number lifts the average to 20. What is it?",
        options: ["22", "26", "30", "38"],
        answer: 2,
        explanation: "6 × 20 − 5 × 18 = 120 − 90 = 30.",
      },
      {
        id: "q5",
        prompt: "What is the simple interest on ₹5,000 at 8% a year for 3 years?",
        options: ["₹1,000", "₹1,200", "₹1,250", "₹1,300"],
        answer: 1,
        explanation: "5000 × 0.08 × 3 = 1200.",
      },
      {
        id: "q6",
        prompt: "Two amounts are in the ratio 3:5 and total 64. What is the larger?",
        options: ["24", "32", "40", "48"],
        answer: 2,
        explanation: "One part is 64 / 8 = 8, so the larger is 5 × 8 = 40.",
      },
      {
        id: "q7",
        prompt: "Two fair dice are rolled. What is the probability that they sum to 7?",
        options: ["1/12", "1/9", "1/6", "7/36"],
        answer: 2,
        explanation: "6 of the 36 outcomes sum to 7, and 6/36 = 1/6.",
      },
      {
        id: "q8",
        prompt:
          "10 L of water is added to 40 L of a 25% acid solution. What is the new concentration?",
        options: ["15%", "20%", "22.5%", "25%"],
        answer: 1,
        explanation: "10 L of acid in 50 L is 20%.",
      },
    ],
  },
  {
    key: "logical",
    title: "Logical",
    description: "Series, syllogisms, directions, coding, ordering and counting.",
    questions: [
      {
        id: "l1",
        prompt: "What comes next: 2, 6, 12, 20, 30, ?",
        options: ["36", "40", "42", "48"],
        answer: 2,
        explanation: "These are n(n + 1): the next is 6 × 7 = 42.",
      },
      {
        id: "l2",
        prompt: "All roses are flowers. Some flowers fade quickly. What must follow?",
        options: [
          "All roses fade quickly",
          "Some roses fade quickly",
          "No rose fades quickly",
          "None of these must follow",
        ],
        answer: 3,
        explanation: "The flowers that fade quickly may include no roses at all.",
      },
      {
        id: "l3",
        prompt:
          "Facing north, you turn right, right again, then left. Which way do you face?",
        options: ["North", "East", "South", "West"],
        answer: 1,
        explanation: "North to east, to south, then left from south is east.",
      },
      {
        id: "l4",
        prompt: "If CAT is coded as DBU, how is DOG coded?",
        options: ["EPH", "EPG", "DPH", "FQI"],
        answer: 0,
        explanation: "Each letter moves forward by one: D→E, O→P, G→H.",
      },
      {
        id: "l5",
        prompt:
          "A is older than B, C is younger than B, and D is older than A. Who is oldest?",
        options: ["A", "B", "C", "D"],
        answer: 3,
        explanation: "The order is D, A, B, C.",
      },
      {
        id: "l6",
        prompt: "What is the angle between the hands of a clock at 3:00?",
        options: ["45°", "60°", "90°", "120°"],
        answer: 2,
        explanation: "Three of the twelve 30° hour marks: 3 × 30° = 90°.",
      },
      {
        id: "l7",
        prompt: "Which does not belong: 8, 27, 64, 100, 125?",
        options: ["27", "64", "100", "125"],
        answer: 2,
        explanation: "The others are perfect cubes; 100 is not.",
      },
      {
        id: "l8",
        prompt:
          "6 people each shake hands once with every other. How many handshakes are there?",
        options: ["12", "15", "30", "36"],
        answer: 1,
        explanation: "6 × 5 / 2 = 15.",
      },
    ],
  },
  {
    key: "verbal",
    title: "Verbal",
    description: "Vocabulary, grammar, analogies and sentence correction.",
    questions: [
      {
        id: "v1",
        prompt: "Choose the closest meaning of “candid”.",
        options: ["Frank", "Shy", "Sweet", "Careless"],
        answer: 0,
        explanation: "Candid means open and honest.",
      },
      {
        id: "v2",
        prompt: "Choose the opposite of “scarce”.",
        options: ["Rare", "Plentiful", "Costly", "Hidden"],
        answer: 1,
        explanation: "Scarce means in short supply, so plentiful is its opposite.",
      },
      {
        id: "v3",
        prompt: "Which is correct?",
        options: [
          "Neither of the answers are correct.",
          "Neither of the answers is correct.",
          "Neither of the answer are correct.",
          "Neither of the answer were correct.",
        ],
        answer: 1,
        explanation: "“Neither of” takes a plural noun and a singular verb.",
      },
      {
        id: "v4",
        prompt: "The results were ___ with the earlier study.",
        options: ["consistent", "agreeable", "similar", "equal"],
        answer: 0,
        explanation: "“Consistent with” is the idiom; “similar” would take “to”.",
      },
      {
        id: "v5",
        prompt: "Author is to book as composer is to:",
        options: ["Orchestra", "Piano", "Symphony", "Audience"],
        answer: 2,
        explanation: "A composer creates a symphony as an author creates a book.",
      },
      {
        id: "v6",
        prompt: "He has been working here ___ 2019.",
        options: ["for", "since", "from", "at"],
        answer: 1,
        explanation: "“Since” marks a starting point; “for” marks a duration.",
      },
      {
        id: "v7",
        prompt: "What is the word for a fear of heights?",
        options: ["Acrophobia", "Agoraphobia", "Claustrophobia", "Hydrophobia"],
        answer: 0,
        explanation: "Acrophobia is the fear of heights.",
      },
      {
        id: "v8",
        prompt: "Which is the passive of “The committee approved the plan”?",
        options: [
          "The plan approved the committee.",
          "The plan is approved by the committee.",
          "The plan was approved by the committee.",
          "The committee was approved by the plan.",
        ],
        answer: 2,
        explanation: "The past tense stays: “was approved by”.",
      },
    ],
  },
];

export function aptitudeTopic(key: string): AptitudeTopic | null {
  return APTITUDE_TOPICS.find((t) => t.key === key) ?? null;
}

export type AptitudeResult = {
  correct: number;
  total: number;
  review: { id: string; chosen: number | null; answer: number; explanation: string }[];
};

/** Unanswered questions count as wrong, and unknown ids are ignored. */
export function gradeAptitude(
  topic: AptitudeTopic,
  answers: Readonly<Record<string, number>>
): AptitudeResult {
  const review = topic.questions.map((q) => {
    const chosen = answers[q.id];
    return {
      id: q.id,
      chosen: chosen === undefined ? null : chosen,
      answer: q.answer,
      explanation: q.explanation,
    };
  });
  return {
    correct: review.filter((r) => r.chosen === r.answer).length,
    total: topic.questions.length,
    review,
  };
}
