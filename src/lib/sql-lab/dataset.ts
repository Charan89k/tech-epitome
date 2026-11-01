/** A small invented lending library, written for this playground. */
export const LIBRARY_SCHEMA = `
CREATE TABLE authors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL
);
CREATE TABLE books (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES authors (id),
  genre TEXT NOT NULL,
  published_year INTEGER NOT NULL,
  pages INTEGER NOT NULL
);
CREATE TABLE members (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  joined_on DATE NOT NULL
);
CREATE TABLE loans (
  id INTEGER PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books (id),
  member_id INTEGER NOT NULL REFERENCES members (id),
  borrowed_on DATE NOT NULL,
  returned_on DATE
);

INSERT INTO authors VALUES
  (1, 'Asha Rao', 'India'),
  (2, 'Tomas Lind', 'Sweden'),
  (3, 'Mei Tan', 'Singapore'),
  (4, 'Ravi Menon', 'India'),
  (5, 'Lena Fischer', 'Germany');

INSERT INTO books VALUES
  (1, 'The Salt Road', 1, 'History', 2011, 320),
  (2, 'Quiet Engines', 2, 'Science', 2018, 244),
  (3, 'Harbour Lights', 3, 'Fiction', 2015, 288),
  (4, 'Numbers at Dawn', 2, 'Science', 2021, 198),
  (5, 'The Monsoon Ledger', 1, 'Fiction', 2019, 412),
  (6, 'Paper Bridges', 3, 'Fiction', 2009, 176),
  (7, 'Tides and Tables', 4, 'Science', 2014, 356),
  (8, 'A Short Walk North', 2, 'History', 2023, 150);

INSERT INTO members VALUES
  (1, 'Nila', '2024-01-15'),
  (2, 'Arjun', '2024-03-02'),
  (3, 'Sofia', '2024-06-20'),
  (4, 'Kiran', '2025-02-11'),
  (5, 'Omar', '2025-08-30');

INSERT INTO loans VALUES
  (1, 1, 1, '2025-01-05', '2025-01-20'),
  (2, 2, 1, '2025-02-01', '2025-02-18'),
  (3, 3, 2, '2025-02-10', NULL),
  (4, 2, 3, '2025-03-03', '2025-03-15'),
  (5, 5, 1, '2025-03-20', NULL),
  (6, 4, 2, '2025-04-01', '2025-04-09'),
  (7, 2, 4, '2025-04-12', NULL),
  (8, 7, 3, '2025-05-02', '2025-05-30'),
  (9, 3, 1, '2025-05-10', '2025-05-25');
`;

export const STARTER_QUERY = `SELECT title, genre, published_year
FROM books
ORDER BY published_year DESC;`;

/** Lists every table and column, for the schema viewer. */
export const SCHEMA_QUERY = `
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;`;
