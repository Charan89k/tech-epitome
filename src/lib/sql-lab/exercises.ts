/** Original exercises on the library dataset. A test runs every solution. */
export type SqlExercise = {
  id: string;
  group: "Basics" | "Joins" | "Aggregation" | "Challenge";
  title: string;
  prompt: string;
  hint: string;
  solution: string;
  /** Whether row order is part of the answer. */
  ordered: boolean;
};

export const SQL_EXERCISES: SqlExercise[] = [
  {
    id: "science-books",
    group: "Basics",
    title: "Science titles",
    prompt: "List the title of every Science book.",
    hint: "Filter with WHERE on the genre column.",
    solution: "SELECT title FROM books WHERE genre = 'Science';",
    ordered: false,
  },
  {
    id: "longest-books",
    group: "Basics",
    title: "The three longest books",
    prompt: "Show the title and pages of the three longest books, longest first.",
    hint: "ORDER BY pages DESC, then LIMIT.",
    solution: "SELECT title, pages FROM books ORDER BY pages DESC LIMIT 3;",
    ordered: true,
  },
  {
    id: "books-with-authors",
    group: "Joins",
    title: "Books and their authors",
    prompt: "Show each book's title beside its author's name.",
    hint: "JOIN authors ON books.author_id = authors.id.",
    solution:
      "SELECT b.title, a.name FROM books b JOIN authors a ON a.id = b.author_id;",
    ordered: false,
  },
  {
    id: "never-borrowed",
    group: "Joins",
    title: "Never borrowed",
    prompt: "List the titles of books that have never been borrowed.",
    hint: "LEFT JOIN loans and keep the rows where no loan matched.",
    solution:
      "SELECT b.title FROM books b LEFT JOIN loans l ON l.book_id = b.id WHERE l.id IS NULL;",
    ordered: false,
  },
  {
    id: "books-per-genre",
    group: "Aggregation",
    title: "Books per genre",
    prompt: "Show each genre and how many books it has.",
    hint: "GROUP BY genre and COUNT(*).",
    solution: "SELECT genre, COUNT(*) FROM books GROUP BY genre;",
    ordered: false,
  },
  {
    id: "busy-members",
    group: "Aggregation",
    title: "Frequent borrowers",
    prompt: "Show the name of each member with at least 2 loans, and their loan count.",
    hint: "Filter groups with HAVING, not WHERE.",
    solution:
      "SELECT m.name, COUNT(*) FROM members m JOIN loans l ON l.member_id = m.id GROUP BY m.id, m.name HAVING COUNT(*) >= 2;",
    ordered: false,
  },
  {
    id: "still-out",
    group: "Challenge",
    title: "Still out",
    prompt:
      "Show the book title and member name for every unreturned loan, oldest loan first.",
    hint: "Join three tables. NULL needs IS NULL, not = NULL.",
    solution:
      "SELECT b.title, m.name FROM loans l JOIN books b ON b.id = l.book_id JOIN members m ON m.id = l.member_id WHERE l.returned_on IS NULL ORDER BY l.borrowed_on;",
    ordered: true,
  },
  {
    id: "longest-per-genre",
    group: "Challenge",
    title: "Longest in each genre",
    prompt: "Show the genre, title and pages of the longest book in each genre.",
    hint: "Try a window function: RANK() OVER (PARTITION BY genre ORDER BY pages DESC).",
    solution:
      "SELECT genre, title, pages FROM (SELECT genre, title, pages, RANK() OVER (PARTITION BY genre ORDER BY pages DESC) AS place FROM books) ranked WHERE place = 1;",
    ordered: false,
  },
];
