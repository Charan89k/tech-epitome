/**
 * The behavioural question bank.
 *
 * Written for CodeForge, not collected from anywhere. Each question is
 * phrased the way a competent interviewer actually asks it — open, about
 * something that happened, and impossible to answer well in the abstract.
 *
 * `lookingFor` is the rubric. It is REFERENCE MATERIAL: the service layer
 * withholds it from the interviewer and from the candidate during the
 * session, and releases it only to the feedback pass once the interview has
 * ended. Handing it over earlier would turn the interview into a checklist
 * the candidate could read off.
 *
 * `followUps` is the opposite: it is the interviewer's own script — the
 * questions a human would have in front of them — so it is safe to pass
 * into the interview, and is.
 */

export type BehavioralCategorySeed = {
  slug: string;
  name: string;
  description: string;
  order: number;
  questions: BehavioralQuestionSeed[];
};

export type BehavioralQuestionSeed = {
  slug: string;
  prompt: string;
  /** REFERENCE MATERIAL. Feedback only, never during the interview. */
  lookingFor: string[];
  followUps: string[];
  order: number;
};

export const BEHAVIORAL_CATEGORIES: BehavioralCategorySeed[] = [
  {
    slug: "teamwork",
    name: "Teamwork",
    description:
      "How you work with people who are not you: what you do when a colleague is blocked, and what you do when you disagree with how they are doing it.",
    order: 10,
    questions: [
      {
        slug: "teamwork-carried-weight",
        prompt:
          "Tell me about a time you had to work closely with someone whose way of working was very different from yours. What did you do?",
        lookingFor: [
          "Describes the difference concretely — pace, communication style, appetite for risk — rather than calling the other person difficult",
          "Something they changed about their own behaviour, not only about the other person's",
          "Evidence they kept the working relationship intact afterwards",
        ],
        followUps: [
          "What did you try first, and did it work?",
          "What would the other person say about that period?",
          "Is there anything you would do earlier next time?",
        ],
        order: 10,
      },
      {
        slug: "teamwork-unblocked-someone",
        prompt:
          "Describe a time you helped someone else on your team get unstuck. What was the situation, and what did you actually do?",
        lookingFor: [
          "Helped them get there rather than taking the work over",
          "Noticed the block themselves rather than waiting to be asked",
          "Can say what the other person was stuck on, specifically",
        ],
        followUps: [
          "How did you notice they were stuck?",
          "Did you fix it yourself or help them fix it — and why that way?",
          "What happened to that piece of work in the end?",
        ],
        order: 20,
      },
    ],
  },

  {
    slug: "leadership",
    name: "Leadership",
    description:
      "Taking a group somewhere, with or without the title. Influence, direction and the unglamorous work of keeping people aligned.",
    order: 20,
    questions: [
      {
        slug: "leadership-without-authority",
        prompt:
          "Tell me about a time you got a group to do something you thought was right, without having any authority over them.",
        lookingFor: [
          "A real disagreement or inertia to overcome, not simply an idea that everyone liked",
          "The specific argument or evidence they used to move people",
          "An honest account of who was not convinced and what happened to them",
        ],
        followUps: [
          "Who was hardest to convince, and what changed their mind?",
          "What was your argument, in one sentence?",
          "Looking back, were you right?",
        ],
        order: 10,
      },
      {
        slug: "leadership-unpopular-call",
        prompt:
          "Describe a decision you made that was unpopular with the people it affected. How did you handle it?",
        lookingFor: [
          "Owns the decision rather than attributing it upwards",
          "Explains the reasoning they gave at the time, not only the reasoning in hindsight",
          "Says how they handled the people who disagreed",
        ],
        followUps: [
          "What did you tell the people who disagreed?",
          "Did anything change your mind partway?",
          "How did it turn out?",
        ],
        order: 20,
      },
    ],
  },

  {
    slug: "conflict",
    name: "Conflict",
    description:
      "Disagreement handled well is a sign of a healthy team. This is about whether you can have one without either caving or escalating.",
    order: 30,
    questions: [
      {
        slug: "conflict-technical-disagreement",
        prompt:
          "Tell me about a technical disagreement you had with a colleague where you did not get your way. What happened?",
        lookingFor: [
          "Can state the other position fairly, as its holder would state it",
          "Separates disagreeing from being overruled, and describes committing afterwards",
          "Willing to say whether the outcome turned out well — including when it did",
        ],
        followUps: [
          "What was their argument, in their words?",
          "How did the decision actually get made?",
          "With hindsight, who was right?",
        ],
        order: 10,
      },
      {
        slug: "conflict-difficult-feedback",
        prompt:
          "Describe a time you had to give someone feedback they did not want to hear.",
        lookingFor: [
          "Gave it directly and reasonably soon, rather than letting it accumulate",
          "Feedback was about specific behaviour rather than character",
          "Says how the other person reacted, honestly, including if it went badly",
        ],
        followUps: [
          "How did you open the conversation?",
          "How did they take it?",
          "Did anything change afterwards?",
        ],
        order: 20,
      },
    ],
  },

  {
    slug: "failure",
    name: "Failure",
    description:
      "Everyone has broken something. The question is whether you noticed, what you did in the next hour, and what you changed afterwards.",
    order: 40,
    questions: [
      {
        slug: "failure-broke-production",
        prompt:
          "Tell me about a time something you built failed in a way that mattered. What did you do?",
        lookingFor: [
          "A real failure with real consequences, not a near-miss dressed up as one",
          "What they did in the moment, in order",
          "A change that outlived the incident — a test, a check, a process — rather than 'I was more careful afterwards'",
        ],
        followUps: [
          "How did you find out?",
          "What did you do first?",
          "What is different now because of it?",
        ],
        order: 10,
      },
      {
        slug: "failure-wrong-call",
        prompt:
          "Describe a decision you got wrong. What made you decide the way you did at the time?",
        lookingFor: [
          "Reconstructs what they knew then rather than judging themselves with hindsight",
          "Names the specific signal they missed or discounted",
          "No blaming of circumstances for the whole of it",
        ],
        followUps: [
          "What information did you have at the time?",
          "When did you realise?",
          "What would make you catch it earlier now?",
        ],
        order: 20,
      },
    ],
  },

  {
    slug: "ownership",
    name: "Ownership",
    description:
      "Doing the thing nobody assigned you, and staying with a problem past the point where it stopped being your job.",
    order: 50,
    questions: [
      {
        slug: "ownership-not-your-job",
        prompt:
          "Tell me about something you fixed or improved that was not assigned to you and that nobody asked for.",
        lookingFor: [
          "Chose something that mattered, and can say why it mattered",
          "Did not simply start rewriting things unilaterally — brought people along where it affected them",
          "Saw it through to something that shipped or stuck",
        ],
        followUps: [
          "Why that, rather than something else?",
          "Did anyone push back?",
          "Is it still in place?",
        ],
        order: 10,
      },
      {
        slug: "ownership-saw-it-through",
        prompt:
          "Describe a time you stayed with a problem long after it would have been reasonable to hand it off.",
        lookingFor: [
          "Judgement about when persistence was right rather than stubbornness dressed as grit",
          "Says what it cost — their time, other work — rather than presenting it as free",
          "A concrete resolution",
        ],
        followUps: [
          "What made you keep going?",
          "What did you drop in order to do it?",
          "Would you do the same again?",
        ],
        order: 20,
      },
    ],
  },

  {
    slug: "communication",
    name: "Communication",
    description:
      "Explaining something hard to someone who needs to act on it, and noticing when you have not been understood.",
    order: 60,
    questions: [
      {
        slug: "communication-explained-to-non-engineer",
        prompt:
          "Tell me about a time you had to explain something technical to someone who needed to make a decision about it but did not have the background.",
        lookingFor: [
          "Started from what the listener needed to decide, not from the architecture",
          "Names the specific thing they chose to leave out and why",
          "Checked whether it landed",
        ],
        followUps: [
          "What did you leave out?",
          "How did you know they had understood?",
          "What decision did they make?",
        ],
        order: 10,
      },
      {
        slug: "communication-bad-news",
        prompt:
          "Describe a time you had to tell someone that something was going to be late, or was not going to work.",
        lookingFor: [
          "Told them as soon as they knew, rather than when it became undeniable",
          "Brought options or a revised plan, not only the problem",
          "Honest about how it was received",
        ],
        followUps: [
          "When did you know, and when did you tell them?",
          "What did you propose?",
          "How did they respond?",
        ],
        order: 20,
      },
    ],
  },

  {
    slug: "problem-solving",
    name: "Problem solving",
    description:
      "How you approach something with no obvious answer: what you try first, and how you decide you are on the wrong track.",
    order: 70,
    questions: [
      {
        slug: "problem-solving-ambiguous",
        prompt:
          "Tell me about the most ambiguous problem you have been given. How did you start?",
        lookingFor: [
          "A first step that reduced uncertainty rather than one that looked productive",
          "Names what they deliberately decided not to do",
          "Can say how they knew they were making progress",
        ],
        followUps: [
          "What was the first thing you did?",
          "How did you know you were getting somewhere?",
          "What did you decide was out of scope?",
        ],
        order: 10,
      },
      {
        slug: "problem-solving-hard-bug",
        prompt:
          "Describe the hardest bug you have tracked down. What made it hard?",
        lookingFor: [
          "A method — narrowing, bisecting, instrumenting — rather than a story of trying things",
          "Can say what the wrong hypothesis was and what killed it",
          "The actual root cause, stated precisely",
        ],
        followUps: [
          "What was your first hypothesis, and what ruled it out?",
          "What finally gave it away?",
          "Could it happen again?",
        ],
        order: 20,
      },
    ],
  },

  {
    slug: "adaptability",
    name: "Adaptability",
    description:
      "What you do when the plan changes underneath you, and how you handle work you did not choose.",
    order: 80,
    questions: [
      {
        slug: "adaptability-priorities-changed",
        prompt:
          "Tell me about a time your priorities changed suddenly and significantly. How did you handle it?",
        lookingFor: [
          "Says what they did with the half-finished work rather than skipping over it",
          "Understood or asked about the reason for the change",
          "No resentment presented as objectivity",
        ],
        followUps: [
          "What happened to what you were already working on?",
          "Did you push back at all?",
          "How did you decide what to pick up first?",
        ],
        order: 10,
      },
      {
        slug: "adaptability-learned-fast",
        prompt:
          "Describe a time you had to become useful in something unfamiliar, quickly.",
        lookingFor: [
          "A specific learning strategy rather than 'I read the docs'",
          "Honest about the point at which they were still guessing",
          "Something concrete they shipped or decided with the new knowledge",
        ],
        followUps: [
          "How did you go about learning it?",
          "What did you get wrong early on?",
          "How long until you were actually useful?",
        ],
        order: 20,
      },
    ],
  },
];

export const BEHAVIORAL_QUESTION_COUNT = BEHAVIORAL_CATEGORIES.reduce(
  (total, category) => total + category.questions.length,
  0
);
