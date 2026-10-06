import {
  arch,
  beforeAfter,
  code,
  compare,
  concept,
  h2,
  h3,
  insight,
  note,
  ol,
  p,
  practice,
  table,
  tip,
  ul,
  warn,
  worked,
  type SectionSeed,
} from "@/data/curriculum/types";

/**
 * Storage internals, then scaling reads and writes.
 *
 * The Data section named the moves — index, replicate, partition, cache —
 * at the level of "which bottleneck does this remove". These two sections
 * open the boxes: what an index physically is and what it costs to keep,
 * what a transaction actually promises, how data is split across machines,
 * and what to do when more work arrives than the system can finish.
 *
 * Every number here is a worked, illustrative estimate chosen to make the
 * arithmetic visible. None of it describes any particular company's system.
 *
 * All prose original.
 */

const STORAGE_INTERNALS: SectionSeed = {
  slug: "storage-internals",
  title: "Storage Internals",
  summary:
    "What happens below the query: index structures, transaction isolation, inverted indexes for search, and where large files belong.",
  chapters: [
    {
      slug: "indexes-b-trees-and-lsm-trees",
      title: "Indexes: B-Trees and LSM Trees",
      summary:
        "Two ways to keep data findable, and why every index you add is a tax on every write.",
      difficulty: "MEDIUM",
      readingMinutes: 13,
      objectives: [
        "Explain how a B-tree and an LSM tree each turn a lookup into a handful of reads",
        "Compare the two on write, read and space amplification",
        "Predict when an index will be ignored by the planner or will slow the system down",
        "Order the columns of a composite index from the queries it must serve",
      ],
      keyTakeaways: [
        "An index is a second copy of some of your data, sorted for a particular question.",
        "B-trees update pages in place and favour reads; LSM trees append and merge later and favour writes.",
        "Every secondary index is maintained on every insert, update and delete that touches it.",
        "An index on a low-selectivity column is often slower than scanning the table.",
        "Column order in a composite index decides which queries it can answer.",
      ],
      content: [
        h2("What an index actually is"),
        p(
          "A table without an index is a heap of rows in roughly the order they arrived. To find the rows matching a condition, the database reads all of them. An index is a separate, sorted structure that maps a key to where the matching rows live — a second copy of some of your data, arranged for one particular question."
        ),
        p(
          "That framing explains both halves of the trade. Reads get faster because the sorted structure can be searched rather than scanned. Writes get slower because every copy has to be kept in step with the table, and the database does that work synchronously, inside your write."
        ),
        h3("The cost of not having one"),
        worked(
          "A 100-million-row orders table, about 200 bytes per row, queried by customer_id. Numbers are illustrative.",
          "Full scan: tens of seconds. Index lookup: a few page reads, typically milliseconds.",
          [
            {
              state: "Table size ≈ 100,000,000 × 200 B ≈ 20 GB",
              note: "Without an index on customer_id, every query must read all of it.",
            },
            {
              state: "Scan at an assumed 500 MB/s sequential read ≈ 40 s",
              note: "And that is the optimistic case where nothing else competes for the disk.",
            },
            {
              state: "B-tree fanout of ~400 keys per page: 400³ ≈ 64M, 400⁴ ≈ 25B",
              note: "So four levels cover 100M entries. The top two levels are small enough to stay in memory.",
            },
            {
              state: "Lookup ≈ 2 page reads from disk, plus fetching the matching rows",
              note: "The difference between a usable query and an outage is one data structure.",
            },
          ],
          "Why indexes exist"
        ),
        h2("B-trees: sorted pages, updated in place"),
        p(
          "A B-tree stores keys in fixed-size pages (commonly a few kilobytes). Internal pages hold separator keys and pointers to children; leaf pages hold the keys themselves and either the rows or a pointer to them. Because each page holds hundreds of keys, the tree is very wide and very shallow — a lookup is a walk from the root to one leaf."
        ),
        ul(
          "Read: follow one root-to-leaf path. Range scans walk neighbouring leaves in order, which is why B-trees are excellent at ORDER BY and BETWEEN.",
          "Write: find the leaf, modify the page, write it back. If the page is full, split it and push a separator key up to the parent.",
          "Crash safety: the change is first appended to a write-ahead log, so a half-written page can be repaired on restart."
        ),
        p(
          "The cost hides in the unit of I/O. Changing a 100-byte row means rewriting a whole page, plus its log record. Ten indexes on that table means eleven such page modifications per insert, each landing on a different page and usually a different spot on disk."
        ),
        h2("LSM trees: append now, sort later"),
        p(
          "A log-structured merge tree refuses to modify anything in place. Writes are appended to a log for durability and inserted into an in-memory sorted structure called the memtable. When the memtable fills, it is written out in one sequential pass as an immutable sorted file — an SSTable. Background compaction merges SSTables together, discarding overwritten values and deleted keys."
        ),
        arch(
          {
            nodes: [
              { id: "writer", kind: "api", label: "Write path" },
              {
                id: "wal",
                kind: "database",
                label: "Write-ahead log",
                note: "append-only, for recovery",
              },
              {
                id: "mem",
                kind: "cache",
                label: "Memtable",
                note: "sorted, in memory",
              },
              {
                id: "l0",
                kind: "database",
                label: "Recent SSTables",
                note: "immutable, small",
              },
              {
                id: "compact",
                kind: "worker",
                label: "Compaction",
                note: "k-way merge of sorted files",
              },
              {
                id: "l1",
                kind: "database",
                label: "Older SSTables",
                note: "fewer, larger files",
              },
            ],
            edges: [
              { id: "e1", from: "writer", to: "wal", label: "append", kind: "sync" },
              { id: "e2", from: "writer", to: "mem", label: "insert", kind: "sync" },
              {
                id: "e3",
                from: "mem",
                to: "l0",
                label: "flush when full",
                kind: "async",
              },
              { id: "e4", from: "l0", to: "compact", kind: "async" },
              {
                id: "e5",
                from: "compact",
                to: "l1",
                label: "merged output",
                kind: "async",
              },
            ],
          },
          "An LSM write touches memory and an append-only log. Everything else happens in the background."
        ),
        p(
          "Reads pay for this. A key might be in the memtable, in any recent SSTable, or in an older one, so a lookup checks them newest first. Two tricks keep that affordable: each SSTable carries a Bloom filter that can say 'definitely not here' without reading the file, and compaction keeps the number of files a read must consult small."
        ),
        note(
          "A delete in an LSM tree is itself a write: a tombstone marker that says 'this key is gone'. The space is only reclaimed when compaction merges the tombstone with the older value. Workloads that delete heavily can therefore grow before they shrink."
        ),
        h2("The three amplifications"),
        p(
          "The cleanest way to compare storage engines is to ask how many bytes they touch for each byte you asked about."
        ),
        table(
          ["", "B-tree", "LSM tree"],
          [
            [
              "Write amplification",
              "A whole page per changed row, plus the log record",
              "Each byte is rewritten once per compaction level it passes through",
            ],
            [
              "Read amplification",
              "One root-to-leaf path; upper levels usually cached",
              "May consult several files; Bloom filters skip most of them",
            ],
            [
              "Space amplification",
              "Half-empty pages after splits",
              "Stale versions and tombstones until compaction catches up",
            ],
            [
              "Write pattern",
              "Random page writes",
              "Sequential appends and sequential merges",
            ],
          ],
          "Neither wins everywhere. Each engine chooses which cost to pay."
        ),
        compare(
          [
            {
              label: "B-tree engine",
              time: "Fast reads; page rewrite per write",
              space: "Moderate fragmentation",
              when: "Read-heavy or mixed workloads, range scans, strong need for predictable read latency.",
              preferred: true,
            },
            {
              label: "LSM engine",
              time: "Fast appends; reads check several files",
              space: "Stale data until compaction",
              when: "Write-heavy ingestion — events, metrics, logs — where sequential writes are the bottleneck.",
            },
          ],
          "Choosing a storage engine shape"
        ),
        h2("When an index hurts"),
        ul(
          "Low selectivity. An index on status, where 60% of rows are 'active', turns one sequential scan into millions of random lookups. Planners know this and will ignore the index — which you then maintain for nothing.",
          "Write-heavy tables. Five secondary indexes means every insert updates six structures. On an append-heavy table that can be most of the write cost.",
          "Wrong column order. An index on (tenant_id, created_at) serves 'this tenant's recent rows' and 'this tenant's rows', but not 'all rows from yesterday'. A composite index is sorted by its first column first.",
          "Functions on the column. WHERE lower(email) = ... cannot use a plain index on email; it needs an index on the expression itself."
        ),
        insight(
          "If a query only needs columns that are in the index, the database can answer from the index alone without visiting the table — a covering index. For a hot query that reads two or three columns, adding them to the index can remove most of the I/O. It is the same trade again: a bigger index, and more to update on write.",
          "Covering indexes"
        ),
        warn(
          "The usual pattern is to add an index for every slow query and never remove one. Each index looked free when it was added, because its cost lands on writes, not on the query you were fixing. Review indexes the way you review dependencies: check which ones the planner actually uses, and drop the ones it does not.",
          "The common mistake"
        ),
        h2("Recognising which engine you need"),
        table(
          ["Signal in the requirements", "Leans towards"],
          [
            ["Writes vastly outnumber reads; data is mostly appended", "LSM"],
            ["Many range scans and ordered reads over the same data", "B-tree"],
            ["Read latency must be tight and predictable", "B-tree"],
            [
              "Large volume of time-stamped events kept for a window then dropped",
              "LSM",
            ],
            [
              "General-purpose application data with transactions",
              "B-tree (the relational default)",
            ],
          ],
          "Rules of thumb, not laws."
        ),
        practice(
          ["merge-sorted-feeds"],
          "Compaction is a k-way merge of sorted runs — practise the merge"
        ),
      ],
    },
    {
      slug: "transactions-and-isolation-levels",
      title: "Transactions and Isolation Levels",
      summary:
        "What 'isolated' really promises, the anomalies each level allows, and how MVCC lets readers and writers stop blocking each other.",
      difficulty: "HARD",
      readingMinutes: 14,
      objectives: [
        "Name the read anomalies — dirty, non-repeatable, phantom — and the write anomalies — lost update, write skew",
        "Say which anomalies each isolation level permits and what preventing them costs",
        "Explain how MVCC serves consistent snapshots without read locks",
        "Choose between atomic updates, row locks, optimistic versions and serializable retries",
      ],
      keyTakeaways: [
        "Isolation is a dial, and most databases do not default to the strictest setting.",
        "MVCC keeps several versions of a row so readers see a snapshot while writers proceed.",
        "Snapshot isolation prevents the classic read anomalies but still allows write skew.",
        "A read-modify-write in application code is a lost update waiting to happen unless something guards it.",
        "Serializable is correct by construction and pays for it in aborts that you must retry.",
      ],
      content: [
        h2("What a transaction promises"),
        p(
          "A transaction groups several reads and writes so they succeed or fail together (atomicity) and survive a crash once committed (durability). Those two are fairly absolute. The third promise, isolation — that concurrent transactions do not see each other's half-finished work — is the one with settings, and the settings are where real bugs live."
        ),
        concept(
          "Isolation, stated plainly",
          "Perfect isolation means the outcome is the same as if the transactions had run one at a time, in some order. Every weaker level is a precise list of ways in which concurrent transactions are allowed to observe each other."
        ),
        h2("The anomalies, by name"),
        table(
          ["Anomaly", "What happens", "Example"],
          [
            [
              "Dirty read",
              "You read another transaction's uncommitted write",
              "You see a balance that is later rolled back",
            ],
            [
              "Non-repeatable read",
              "The same row read twice returns different values",
              "A report's total changes between two of its own queries",
            ],
            [
              "Phantom read",
              "The same query returns a different set of rows",
              "'Count bookings for room 4' changes mid-transaction",
            ],
            [
              "Lost update",
              "Two read-modify-writes interleave and one overwrites the other",
              "Two withdrawals both read 500 and both write 400",
            ],
            [
              "Write skew",
              "Two transactions read overlapping data, then write different rows, breaking an invariant together",
              "Two on-call doctors both go off call because each saw the other still on",
            ],
          ],
          "The first three are about reads. The last two are the ones that corrupt data."
        ),
        h2("The levels and what they allow"),
        table(
          ["Level", "Dirty read", "Non-repeatable", "Phantom", "Write skew"],
          [
            ["Read uncommitted", "Possible", "Possible", "Possible", "Possible"],
            ["Read committed", "Prevented", "Possible", "Possible", "Possible"],
            [
              "Repeatable read (standard)",
              "Prevented",
              "Prevented",
              "Possible",
              "Possible",
            ],
            [
              "Snapshot isolation",
              "Prevented",
              "Prevented",
              "Prevented for reads",
              "Possible",
            ],
            ["Serializable", "Prevented", "Prevented", "Prevented", "Prevented"],
          ],
          "The standard's definitions. Real databases map their level names onto these differently, so check yours."
        ),
        warn(
          "Isolation level names are not portable. One database's 'repeatable read' is snapshot isolation; another's adds locking on ranges; and in some databases 'serializable' has at times meant snapshot isolation, which still allows write skew. Read the documentation for the database you actually run, and test the anomaly you care about rather than trusting the label.",
          "Same name, different guarantee"
        ),
        h2("MVCC: how snapshots work"),
        p(
          "Most modern relational engines implement isolation with multi-version concurrency control. An update does not overwrite a row; it writes a new version tagged with the transaction that created it, and marks the old version as superseded by that transaction. Each transaction reads with a snapshot — the set of transactions that had committed when it started — and sees only the versions that snapshot makes visible."
        ),
        ul(
          "Readers never wait for writers, and writers never wait for readers. Only two writers to the same row conflict.",
          "Read committed takes a fresh snapshot per statement; snapshot isolation keeps one snapshot for the whole transaction.",
          "Old versions must be cleaned up once no running transaction can see them. A transaction left open for hours pins every version created since it began."
        ),
        insight(
          "A forgotten open transaction — an idle session in an admin tool, a batch job that holds one across a slow loop — prevents version cleanup for the whole database. Tables grow, scans slow down, and the cause is nowhere near the symptom. Long transactions are a storage problem as much as a locking one.",
          "Why long transactions hurt everyone"
        ),
        h2("Worked example: the lost update"),
        worked(
          "Balance is 500. Two requests each withdraw 100 using read-then-write in application code, under read committed.",
          "Final balance 400. It should be 300. One withdrawal vanished without an error.",
          [
            { state: "T1: SELECT balance → 500", note: "First request reads." },
            {
              state: "T2: SELECT balance → 500",
              note: "Second request reads the same committed value.",
            },
            {
              state: "T1: UPDATE balance = 400; COMMIT",
              note: "Computed 500 − 100 in the application.",
            },
            {
              state: "T2: UPDATE balance = 400; COMMIT",
              note: "Also computed 500 − 100. Overwrites T1's result.",
            },
          ],
          "Two correct-looking transactions, one wrong answer"
        ),
        p(
          "Nothing failed, and no isolation level below serializable is guaranteed to stop this unless the code asks for protection. There are four standard ways to ask."
        ),
        code(
          "sql",
          `-- 1. Atomic update: let the database do the arithmetic.
UPDATE accounts SET balance = balance - 100
 WHERE id = 42 AND balance >= 100;

-- 2. Pessimistic: lock the row you are about to change.
SELECT balance FROM accounts WHERE id = 42 FOR UPDATE;

-- 3. Optimistic: write only if nobody else did since you read.
UPDATE accounts SET balance = 400, version = version + 1
 WHERE id = 42 AND version = 7;   -- 0 rows updated → retry

-- 4. Serializable: run the read-modify-write at SERIALIZABLE
--    and retry the whole transaction when it is aborted.`,
          "Four ways to stop a lost update"
        ),
        compare(
          [
            {
              label: "Atomic update",
              time: "One statement, no extra round trip",
              space: "None",
              when: "The change can be expressed in SQL: counters, balances, stock levels.",
              preferred: true,
            },
            {
              label: "SELECT … FOR UPDATE",
              time: "Holds a lock until commit",
              space: "Lock state",
              when: "Logic between read and write is too complex for one statement, and contention is low.",
            },
            {
              label: "Optimistic version column",
              time: "No locks; retries on conflict",
              space: "One column per row",
              when: "Conflicts are rare, or the read happens in a different request from the write (an edit form).",
            },
            {
              label: "Serializable",
              time: "Aborts under contention",
              space: "Conflict-tracking overhead",
              when: "Invariants span several rows — write skew — and you can retry whole transactions.",
            },
          ],
          "Choosing a guard"
        ),
        h2("Write skew, and why snapshots do not save you"),
        p(
          "Invariant: at least one doctor must be on call. Alice and Bob are both on call. Each opens a transaction, counts on-call doctors (2), concludes it is safe to leave, and updates their own row. Each transaction read a consistent snapshot and wrote a row the other did not touch, so snapshot isolation sees no conflict. Both commit. Nobody is on call."
        ),
        p(
          "The fix is to make the conflict visible: lock the rows the decision depended on (SELECT … FOR UPDATE on all on-call doctors), materialise the invariant into a single row both transactions must update, or run at serializable and let the database detect the dependency."
        ),
        h2("What each level costs"),
        table(
          ["Level", "What you pay"],
          [
            ["Read committed", "Almost nothing extra; you handle anomalies in code"],
            [
              "Snapshot isolation",
              "Version storage and cleanup; long transactions get expensive",
            ],
            [
              "Serializable",
              "Aborted transactions under contention, which the application must retry",
            ],
          ],
          "Stricter is not slower on every query — it is slower when transactions actually collide."
        ),
        warn(
          "Assuming the default isolation level protects a read-modify-write. Defaults are usually read committed or snapshot isolation, and both allow lost updates or write skew in code that reads a value, decides in the application, and writes it back. If correctness depends on what you read, guard the read explicitly.",
          "The common mistake"
        ),
        h2("Recognising the problem"),
        ul(
          "The code reads a value, computes in the application, and writes the result: lost-update risk.",
          "A rule spans several rows — 'at least one', 'no overlapping bookings', 'total under budget': write-skew risk.",
          "A report runs several queries that must agree with each other: needs a single snapshot.",
          "A transaction stays open across a network call or user think-time: version and lock pile-up."
        ),
      ],
    },
    {
      slug: "search-and-secondary-indexes",
      title: "Search and Secondary Indexes",
      summary:
        "Inverted indexes for full-text search, local versus global secondary indexes, and keeping a derived index in step with its source.",
      difficulty: "MEDIUM",
      readingMinutes: 12,
      objectives: [
        "Build an inverted index by hand and answer an AND query against it",
        "Explain why LIKE '%term%' does not scale and what replaces it",
        "Keep a search index in sync with the database without dual writes",
        "Compare local and global secondary indexes in a partitioned store",
      ],
      keyTakeaways: [
        "An inverted index maps each term to the documents containing it, so search cost tracks matches rather than corpus size.",
        "A search index is derived data: rebuildable from the source of truth and allowed to lag it.",
        "Dual writes from application code drift; change capture or an outbox keeps the index honest.",
        "Local secondary indexes make reads scatter; global ones make writes asynchronous.",
      ],
      content: [
        h2("Why a B-tree cannot do this"),
        p(
          "A B-tree index on a title column answers 'titles equal to X' and 'titles starting with X', because both map to one contiguous range of the sorted keys. 'Titles containing the word socks somewhere' does not — the matches are scattered across the whole sort order, so the database falls back to reading every row."
        ),
        p(
          "Full-text search also wants things exact matching never offered: 'Running' should match 'run', 'colour' might match 'color', and the results should come back ranked by relevance rather than in table order."
        ),
        h2("The inverted index"),
        concept(
          "Inverted index",
          "For every term, a sorted list of the documents that contain it — a posting list. Searching becomes looking up a few terms and combining their lists, so the cost depends on how many documents match, not on how many exist."
        ),
        p(
          "Before indexing, text goes through an analysis pipeline: split into tokens, lower-case them, optionally drop very common words, and optionally reduce words to a stem so 'running' and 'runs' share an entry. The same pipeline runs on the query, which is the whole trick — query and documents are normalised the same way, so they meet in the middle."
        ),
        worked(
          'Doc 1: "Red running shoes" · Doc 2: "Running socks" · Doc 3: "Red wool socks". Query: red AND socks.',
          "Doc 3 is the only match for the AND query; an OR query would return all three, with doc 3 ranked first.",
          [
            {
              state: "Analyse: lower-case, stem running → run",
              note: "Doc 1: red, run, shoe · Doc 2: run, sock · Doc 3: red, wool, sock",
            },
            {
              state:
                "red → [1, 3]; run → [1, 2]; shoe → [1]; sock → [2, 3]; wool → [3]",
              note: "Each posting list is kept sorted by document id.",
            },
            {
              state: "Query analysed the same way: red, sock",
              note: "'socks' in the query becomes 'sock', matching the stored term.",
            },
            {
              state: "Intersect [1, 3] with [2, 3] → [3]",
              note: "Walk both sorted lists together, as in a merge. Cost is proportional to list lengths.",
            },
          ],
          "Building and querying an inverted index"
        ),
        p(
          "Ranking then scores each match. The common family of scoring functions rewards a term that appears often in this document but rarely across the corpus — 'wool' is more informative than 'red' if most products are red — and normalises for document length so long documents do not win by volume alone."
        ),
        h2("Search is a second store"),
        p(
          "A dedicated search engine is usually a separate system from the primary database. That makes it the textbook case of the second-store problem from the Data section: two systems holding related data, which will disagree, and one of which must be declared the truth. The database is the truth. The index is derived, may lag, and must be rebuildable from scratch."
        ),
        arch(
          {
            nodes: [
              { id: "c", kind: "client", label: "Client" },
              { id: "api", kind: "api", label: "API" },
              {
                id: "db",
                kind: "database",
                label: "Primary DB",
                note: "source of truth + outbox table",
              },
              {
                id: "q",
                kind: "queue",
                label: "Change stream",
                note: "ordered per document id",
              },
              {
                id: "idx",
                kind: "worker",
                label: "Indexer",
                note: "idempotent upserts by doc id + version",
              },
              {
                id: "s",
                kind: "search",
                label: "Search index",
                note: "derived, may lag",
              },
            ],
            edges: [
              { id: "e1", from: "c", to: "api", kind: "sync" },
              {
                id: "e2",
                from: "api",
                to: "db",
                label: "write row + outbox in one txn",
                kind: "sync",
              },
              { id: "e3", from: "db", to: "q", label: "relay changes", kind: "async" },
              { id: "e4", from: "q", to: "idx", label: "consume", kind: "async" },
              {
                id: "e5",
                from: "idx",
                to: "s",
                label: "upsert / delete",
                kind: "sync",
              },
              { id: "e6", from: "api", to: "s", label: "search queries", kind: "sync" },
            ],
          },
          "Writes go only to the database. The index follows from the database's own record of what changed."
        ),
        h3("Why not just write to both?"),
        p(
          "Dual writes — the API writes the database, then writes the index — look simpler and drift forever. The second write fails after the first succeeds; two concurrent updates reach the two systems in opposite orders; a retry re-sends an old version after a newer one landed. Each case leaves the index permanently wrong with no record that it is."
        ),
        ul(
          "Outbox: in the same transaction as the business write, insert a row into an outbox table. A relay publishes outbox rows to the queue. Either both happened or neither did.",
          "Change data capture: read the database's own replication log and turn it into events. No application change, but you consume the database's internal format.",
          "Either way, make the indexer idempotent and version-aware, so a replayed or reordered event cannot overwrite newer data."
        ),
        insight(
          "Because the index is derived, the recovery plan for almost any index bug is the same: build a fresh index from the database in the background, point reads at it with an alias switch, and throw away the old one. Design for that rebuild on day one — the mapping will change, the analyser will change, and a rebuild path is what makes those changes boring.",
          "Rebuildable by design"
        ),
        h2("Secondary indexes in a partitioned store"),
        p(
          "Once data is sharded by a primary key, a secondary index has to be partitioned too, and there are two ways to do it."
        ),
        table(
          ["", "Local (per-shard) index", "Global (term-partitioned) index"],
          [
            [
              "Where index entries live",
              "With the rows they point to",
              "Partitioned by the indexed value",
            ],
            [
              "Write",
              "Same shard, same transaction",
              "Often a different partition; usually updated asynchronously",
            ],
            [
              "Query by indexed value",
              "Ask every shard and merge (scatter-gather)",
              "Ask the one partition that owns the value",
            ],
            ["Freshness", "Immediately consistent", "May lag the write"],
          ],
          "Local indexes move the cost to reads; global indexes move it to write consistency."
        ),
        p(
          "Worked illustration: with 32 shards, a local-index query for 'orders with status = refunded' becomes 32 parallel requests, and its latency is the slowest of the 32. A global index answers from one partition, but an order refunded a moment ago might not appear yet."
        ),
        warn(
          "Treating the search index as a place where data lives. If a field exists only in the index, a rebuild loses it, and any drift is unrecoverable. Every document in the index should be reproducible from the primary store.",
          "The common mistake"
        ),
        tip(
          "For small datasets and simple needs, many relational databases ship a built-in full-text index. It stays transactionally consistent with the table, which removes the whole sync problem. Reach for a separate engine when relevance tuning, faceting or query volume outgrow it — not by default."
        ),
        h2("Recognising it"),
        ul(
          "Requirements mention 'search', 'contains', typo tolerance, relevance or facets: inverted index.",
          "Queries filter by an attribute other than the shard key: secondary index, local or global.",
          "The same data must be queryable two very different ways: a derived store, fed from the source of truth."
        ),
        practice(
          ["prefix-tally", "top-search-terms"],
          "Index-shaped problems: prefix lookups and term frequencies"
        ),
      ],
    },
    {
      slug: "blob-storage-and-media",
      title: "Blob Storage and Media Uploads",
      summary:
        "Metadata in the database, bytes in object storage, uploads that bypass your servers, and a CDN in front of the reads.",
      difficulty: "MEDIUM",
      readingMinutes: 10,
      objectives: [
        "Split a file into metadata and bytes and put each in the right store",
        "Design a presigned upload flow that keeps file bytes off your API servers",
        "Serve media through a CDN without serving stale or private content by mistake",
      ],
      keyTakeaways: [
        "The database stores what a file is; object storage stores what it contains.",
        "Presigned URLs let clients upload directly to storage with a narrow, expiring permission.",
        "Immutable object keys make CDN caching safe; overwriting a key in place makes it hard.",
        "Every upload flow needs a cleanup path for uploads that never complete.",
      ],
      content: [
        h2("Two kinds of data in one file"),
        p(
          "A user's profile photo is two things: a few hundred bytes of facts — owner, size, content type, upload time, processing state — and a few megabytes of pixels. The facts are queried, joined and updated. The pixels are written once and read whole. Those are opposite access patterns, and they belong in different stores."
        ),
        table(
          ["", "Metadata", "Bytes"],
          [
            ["Size", "Hundreds of bytes", "Kilobytes to gigabytes"],
            ["Access", "Queried, filtered, joined", "Fetched whole by key"],
            [
              "Changes",
              "Often (status, title, visibility)",
              "Rarely; usually replaced by a new object",
            ],
            ["Home", "Database", "Object storage"],
          ],
          "Split the record along the access pattern."
        ),
        warn(
          "Storing large blobs inside database rows works in a demo and degrades quietly in production: backups balloon, replicas spend their bandwidth copying images, and the memory meant for hot rows and index pages fills with pixels nobody is querying. Keep a key in the row and the bytes elsewhere.",
          "Bytes in the database"
        ),
        h2("Uploads that bypass your servers"),
        p(
          "The naive upload sends the file to the API, which forwards it to storage. Every byte crosses your servers twice, and each slow mobile upload holds a connection and memory for its whole duration. The better shape is to have the API hand out permission and let the client send the bytes straight to storage."
        ),
        arch(
          {
            nodes: [
              { id: "c", kind: "client", label: "Client" },
              { id: "api", kind: "api", label: "API", note: "issues presigned URL" },
              {
                id: "db",
                kind: "database",
                label: "Metadata DB",
                note: "row: pending → ready",
              },
              {
                id: "obj",
                kind: "object_storage",
                label: "Object storage",
                note: "original + derived files",
              },
              { id: "q", kind: "queue", label: "Upload events" },
              {
                id: "w",
                kind: "worker",
                label: "Media worker",
                note: "thumbnails, transcodes, scans",
              },
              { id: "cdn", kind: "cdn", label: "CDN", note: "serves reads" },
            ],
            edges: [
              {
                id: "e1",
                from: "c",
                to: "api",
                label: "1. request upload",
                kind: "sync",
              },
              {
                id: "e2",
                from: "api",
                to: "db",
                label: "2. insert pending row",
                kind: "sync",
              },
              {
                id: "e3",
                from: "c",
                to: "obj",
                label: "3. PUT bytes via presigned URL",
                kind: "sync",
              },
              {
                id: "e4",
                from: "obj",
                to: "q",
                label: "4. object created",
                kind: "async",
              },
              { id: "e5", from: "q", to: "w", kind: "async" },
              {
                id: "e6",
                from: "w",
                to: "obj",
                label: "5. write derived files",
                kind: "sync",
              },
              { id: "e7", from: "w", to: "db", label: "6. mark ready", kind: "sync" },
              { id: "e8", from: "c", to: "cdn", label: "7. GET media", kind: "sync" },
              { id: "e9", from: "cdn", to: "obj", label: "cache miss", kind: "sync" },
            ],
          },
          "The API handles permission and metadata. File bytes go directly between the client, storage and the CDN."
        ),
        ol(
          "The client asks the API for an upload, stating size and content type.",
          "The API checks permissions and limits, creates a metadata row in a pending state, and returns a presigned URL: a storage URL carrying a signature that permits exactly one PUT to one key, for a few minutes.",
          "The client uploads directly to object storage. Large files use multipart uploads, so a dropped connection resumes from the last part instead of from zero.",
          "Storage emits an event when the object lands. A worker validates the file, produces derived versions, and marks the row ready.",
          "Reads go through a CDN, which fetches from storage on a miss and serves from the edge after that."
        ),
        worked(
          "An app receives an illustrative 1 million uploads a day, averaging 4 MB each, many from phones on slow uplinks.",
          "Direct-to-storage uploads remove terabytes a day and many long-held connections from the API tier.",
          [
            {
              state: "Ingress ≈ 1,000,000 × 4 MB = 4 TB/day",
              note: "Before any derived versions are generated.",
            },
            {
              state: "Average ≈ 4 TB / 86,400 s ≈ 46 MB/s",
              note: "Peaks could plausibly be several times this.",
            },
            {
              state: "One upload at 1 Mbps uplink: 32 Mb / 1 Mbps ≈ 32 s",
              note: "A proxied upload holds an API connection for all of that.",
            },
            {
              state: "Storage growth ≈ 4 TB × 365 ≈ 1.5 PB/year, originals only",
              note: "Lifecycle rules (cheaper tiers, expiry) matter early.",
            },
          ],
          "Why the bytes should not touch the API"
        ),
        h2("The CDN in front"),
        p(
          "Media is the ideal CDN workload: large, read many times, and rarely changed. The one thing that makes it hard is changing an object in place. If a user replaces their avatar and the new file is written under the same key, every edge that cached the old one keeps serving it until its cache entry expires or is explicitly purged."
        ),
        insight(
          "Give every version of a file a new key — a random id or a hash of its content — and update the metadata row to point at the new key. Old keys are never modified, so they can be cached for a very long time, and 'replacing' a file is just a database update. Cache invalidation becomes something you avoid rather than something you do.",
          "Immutable keys"
        ),
        ul(
          "Private media: serve through short-lived signed URLs (or signed cookies) so the CDN can cache the bytes while still checking that each request was authorised.",
          "Validate on the server, not the client: the worker should verify the real content type and size of what arrived, since the client chose what to send.",
          "Abandoned uploads: pending rows whose object never arrived, and objects whose row was never created. A periodic sweep plus a storage lifecycle rule on an uploads prefix cleans up both."
        ),
        warn(
          "Proxying file bytes through API servers 'for simplicity'. It ties your most latency-sensitive tier to your slowest clients and makes upload volume a reason to scale servers that otherwise have nothing to do. Presigned URLs are a small amount of code that removes the whole problem.",
          "The common mistake"
        ),
        h2("Recognising it"),
        ul(
          "Anything users upload — images, video, documents, exports: metadata row plus object.",
          "Large or resumable uploads: multipart, directly to storage.",
          "Heavy read fan-out on unchanging files: immutable keys behind a CDN.",
          "Processing after upload: an event from storage into a queue, not work inside the upload request."
        ),
      ],
    },
  ],
};

const SCALING_READS_AND_WRITES: SectionSeed = {
  slug: "scaling-reads-and-writes",
  title: "Scaling Reads and Writes",
  summary:
    "Splitting data across machines, caching it without serving lies, and staying upright when more work arrives than you can do.",
  chapters: [
    {
      slug: "sharding-and-consistent-hashing",
      title: "Sharding Strategies and Consistent Hashing",
      summary:
        "Hash versus range sharding, why hash-mod-N is a trap, and how to survive hot keys and resharding.",
      difficulty: "HARD",
      readingMinutes: 14,
      objectives: [
        "Choose between hash, range and directory-based sharding from the query patterns",
        "Calculate how many keys move when a shard is added under modulo and consistent hashing",
        "Mitigate a hot key without resharding the whole system",
        "Outline a live resharding plan that never stops serving",
      ],
      keyTakeaways: [
        "Hash sharding spreads load evenly and breaks range queries; range sharding keeps ranges and invites hot spots.",
        "Hash mod N reshuffles most keys when N changes; consistent hashing moves roughly 1/N of them.",
        "Many small logical partitions mapped onto fewer machines make rebalancing a matter of moving whole partitions.",
        "A single hot key defeats any sharding scheme and needs its own answer.",
        "Resharding is a migration: double-write, backfill, verify, cut over.",
      ],
      content: [
        h2("Picking up where partitioning left off"),
        p(
          "The Data section made the case for partitioning — it is the only technique that raises write throughput — and warned that the key is nearly irreversible. This chapter is about the mechanics: given a key, which machine owns it, and what happens to that answer when the number of machines changes."
        ),
        h2("Three ways to assign a key to a shard"),
        table(
          ["Strategy", "How a key is placed", "Good at", "Bad at"],
          [
            [
              "Range",
              "Each shard owns a contiguous key range",
              "Range scans, ordered reads",
              "Hot spots when new keys cluster (timestamps, sequential ids)",
            ],
            [
              "Hash",
              "Shard chosen from a hash of the key",
              "Even spread of keys and load",
              "Range queries, which must ask every shard",
            ],
            [
              "Directory",
              "A lookup table maps key (or tenant) to shard",
              "Moving individual tenants; uneven tenant sizes",
              "The directory is now a critical, hot dependency",
            ],
          ],
          "The choice is made by the queries, not by the data."
        ),
        insight(
          "A compound key gets some of both: hash the first part to choose the shard, keep the second part sorted within it. Sharding on hash(user_id) with rows ordered by (user_id, created_at) spreads users evenly and still makes 'this user's latest 50 items' a single-shard range scan.",
          "Hash to place, sort to read"
        ),
        h2("Why hash mod N is a trap"),
        p(
          "The obvious hash scheme is shard = hash(key) mod N. It spreads keys perfectly — until N changes. Going from 4 shards to 5 changes the answer for almost every key, so adding one machine means moving most of the data."
        ),
        beforeAfter(
          {
            label: "hash mod 4 (keys 10–21)",
            values: [
              "10→2",
              "11→3",
              "12→0",
              "13→1",
              "14→2",
              "15→3",
              "16→0",
              "17→1",
              "18→2",
              "19→3",
              "20→0",
              "21→1",
            ],
          },
          {
            label: "hash mod 5 (same keys)",
            values: [
              "10→0",
              "11→1",
              "12→2",
              "13→3",
              "14→4",
              "15→0",
              "16→1",
              "17→2",
              "18→3",
              "19→4",
              "20→0",
              "21→1",
            ],
          },
          {
            title: "Adding one shard under modulo hashing",
            note: "Only keys 20 and 21 stay on the same shard. Across all keys, a key stays only when hash mod 4 equals hash mod 5, which is 4 values in every 20, so about 80% of the data moves.",
          }
        ),
        h2("Consistent hashing"),
        p(
          "Consistent hashing places both keys and shards on the same circular hash space. Each key belongs to the first shard found by walking clockwise from the key's position. Adding a shard inserts one new point on the ring; it takes over only the keys between itself and its predecessor. Every other key keeps its owner."
        ),
        worked(
          "A cluster grows from 4 shards to 5. Compare data movement. Fractions assume an even spread.",
          "Modulo: ~80% of keys move. Consistent hashing: ~20% move, all of them onto the new shard.",
          [
            {
              state: "Modulo: key stays iff h mod 4 = h mod 5",
              note: "True for 4 of every 20 hash values → ~20% stay, ~80% move.",
            },
            {
              state: "Consistent hashing: new shard's fair share = 1/5",
              note: "It takes ~20% of keys from its ring neighbours. Nothing else moves.",
            },
            {
              state: "With 2 TB of data: ~1.6 TB moved vs ~0.4 TB",
              note: "The difference between a weekend migration and a background task.",
            },
          ],
          "Keys moved when one shard is added"
        ),
        p(
          "A plain ring has a flaw: with only a few points, the arcs between them are uneven, so one shard can own far more of the ring than another. The fix is virtual nodes — each physical machine appears at many points on the ring, often a hundred or more. The arcs average out, and when a machine leaves, its load spreads across many others instead of landing on one neighbour."
        ),
        h3("The pragmatic alternative: many fixed partitions"),
        p(
          "Many systems avoid the ring entirely: split the key space into a fixed, generous number of logical partitions — say 1,024 — when the system is created, and map partitions to machines in a small table. Adding a machine means reassigning some partitions to it and copying them whole. The key-to-partition function never changes, so nothing ever needs rehashing; only the partition-to-machine table does."
        ),
        arch(
          {
            nodes: [
              { id: "api", kind: "api", label: "API" },
              {
                id: "router",
                kind: "service",
                label: "Shard router",
                note: "key → partition → node",
              },
              {
                id: "map",
                kind: "cache",
                label: "Partition map",
                note: "1,024 partitions, cached locally",
              },
              {
                id: "s1",
                kind: "database",
                label: "Node A",
                note: "partitions 0–340",
                group: "Shards",
              },
              {
                id: "s2",
                kind: "database",
                label: "Node B",
                note: "partitions 341–681",
                group: "Shards",
              },
              {
                id: "s3",
                kind: "database",
                label: "Node C",
                note: "partitions 682–1023",
                group: "Shards",
              },
            ],
            edges: [
              { id: "e1", from: "api", to: "router", kind: "sync" },
              { id: "e2", from: "router", to: "map", label: "lookup", kind: "sync" },
              { id: "e3", from: "router", to: "s1", kind: "sync" },
              { id: "e4", from: "router", to: "s2", kind: "sync" },
              { id: "e5", from: "router", to: "s3", kind: "sync" },
            ],
          },
          "Keys hash to a fixed partition; a small, cached table maps partitions to nodes."
        ),
        h2("Hot keys"),
        p(
          "Even sharding spreads keys, not traffic. If one account receives 50,000 reads a second and a shard comfortably serves 10,000, no placement scheme helps — the key lives on one shard by definition."
        ),
        ul(
          "Hot reads: cache the key in front of the shard, or serve it from several replicas of that shard.",
          "Hot writes to a counter: split it into sub-keys (likes:post42:0 … likes:post42:9), increment a random one, and sum all ten on read. Write load spreads tenfold for a slightly more expensive read.",
          "Detect before guessing: track request counts per key at the router so you know which key is hot rather than which shard is busy."
        ),
        h2("Resharding without downtime"),
        ol(
          "Create the new layout alongside the old one.",
          "Start writing every change to both layouts (double-write), with the old layout still the source of truth.",
          "Backfill historic data into the new layout in batches, without overwriting newer double-written values.",
          "Verify: compare counts and sample checksums between layouts until they agree.",
          "Move reads to the new layout, a small percentage at a time, watching error rates.",
          "Make the new layout the source of truth, stop the double-writes, and retire the old layout."
        ),
        warn(
          "Choosing hash mod N because it is one line of code. It works until the first capacity change, and then the only way forward is moving almost all of the data at once. Start with consistent hashing or a fixed set of logical partitions; both cost little on day one and save the migration later.",
          "The common mistake"
        ),
        note(
          "Sharding is also not a first move. A single well-indexed database with read replicas and a cache carries more load than most products ever see. Shard when writes or data size outgrow one machine, because every cross-shard query, join and transaction becomes your problem from that point on."
        ),
        h2("Recognising it"),
        ul(
          "Write volume or data size beyond one machine, with a natural owner for each record (user, tenant, device): shard by that owner.",
          "Time-ordered writes with range-based placement: expect the newest shard to be hot.",
          "Uneven, nameable hotspots (celebrities, viral posts): hot-key handling, not more shards.",
          "Fleet size expected to change: consistent hashing or fixed logical partitions, never modulo."
        ),
      ],
    },
    {
      slug: "caching-strategies-and-invalidation",
      title: "Caching Strategies and Invalidation",
      summary:
        "Where caches sit, how each write strategy behaves under failure, why hit ratio is non-linear, and how to stop a stampede.",
      difficulty: "MEDIUM",
      readingMinutes: 13,
      objectives: [
        "Place a cache at the right layer for the data being cached",
        "Implement cache-aside with delete-on-write and explain its remaining race",
        "Compute database load from cache hit ratio and explain why small drops hurt",
        "Prevent stampedes with request coalescing, jittered TTLs and stale-while-revalidate",
      ],
      keyTakeaways: [
        "The database sees the misses, so a hit ratio falling from 99% to 95% means five times the database load.",
        "On write, delete the cache entry rather than updating it — and still keep a TTL as a safety net.",
        "Write-through keeps caches warm; write-back trades durability for write speed.",
        "A stampede is many misses for one key at once; coalescing turns them into a single load.",
      ],
      content: [
        h2("Where a cache can live"),
        p(
          "The Data section introduced the four write strategies and the thundering herd. This chapter goes underneath them, starting with the question that comes before strategy: where in the request path the cache sits, because that decides who can invalidate it."
        ),
        table(
          ["Layer", "Example contents", "Who can invalidate it"],
          [
            [
              "Client / browser",
              "Static assets, API responses with cache headers",
              "Nobody — only expiry or a new URL",
            ],
            [
              "CDN",
              "Images, scripts, public pages",
              "You, via purge APIs, slowly and coarsely",
            ],
            ["In-process", "Config, small lookup tables", "Each instance separately"],
            [
              "Shared cache cluster",
              "Sessions, rendered fragments, query results",
              "You, per key, immediately",
            ],
          ],
          "The further out the cache, the faster it is and the less control you keep."
        ),
        h2("Hit ratio is non-linear"),
        p(
          "A cache's value is measured in what it keeps off the database, and the database only sees misses. That makes small changes in hit ratio look harmless in percentage terms and dramatic in load."
        ),
        worked(
          "An illustrative read path serving 40,000 requests a second, with the cache in front of the database.",
          "Dropping from 99% to 95% hit ratio multiplies database read load by five.",
          [
            {
              state: "99% hits → 1% misses → 400 DB reads/s",
              note: "Comfortable for one primary and a replica.",
            },
            {
              state: "95% hits → 5% misses → 2,000 DB reads/s",
              note: "A 4-point drop, five times the load.",
            },
            {
              state: "90% hits → 10% misses → 4,000 DB reads/s",
              note: "Ten times the load of the healthy state.",
            },
            {
              state: "Cold cache after a restart → up to 40,000 DB reads/s",
              note: "Why warm-up and gradual rollouts of cache nodes matter.",
            },
          ],
          "Database load is driven by the miss rate"
        ),
        insight(
          "If the database cannot survive the cache being empty, the cache is no longer an optimisation — it is load-bearing infrastructure, and its restarts, evictions and failures are now database incidents. Know your cold-cache load, and plan warm-up or admission control for it.",
          "When the cache becomes critical"
        ),
        h2("Cache-aside, done carefully"),
        p(
          "Cache-aside is the default: read from the cache, fall back to the database on a miss, and populate the cache with what you read. The interesting part is the write path."
        ),
        code(
          "ts",
          `async function getProduct(id: string) {
  const cached = await cache.get(\`product:\${id}\`);
  if (cached) return cached;

  const row = await db.products.find(id);
  // TTL is the safety net if an invalidation is ever missed.
  await cache.set(\`product:\${id}\`, row, { ttlSeconds: 300 });
  return row;
}

async function updateProduct(id: string, patch: Partial<Product>) {
  await db.products.update(id, patch);
  // Delete, do not set: the next reader loads the committed truth.
  await cache.delete(\`product:\${id}\`);
}`,
          "Cache-aside with delete-on-write",
          [13, 14]
        ),
        p(
          "Deleting is safer than writing the new value into the cache. Two concurrent updates can write their cache values in the opposite order from their database commits, leaving the cache holding the loser. A delete has no order to get wrong; the next read loads whatever actually committed."
        ),
        worked(
          "Cache-aside with delete-on-write still has one narrow race. Value starts as v1.",
          "The cache holds stale v1 until its TTL expires — which is exactly why the TTL is not optional.",
          [
            {
              state: "Reader A: cache miss, reads v1 from the database",
              note: "A is slow, perhaps paused by garbage collection.",
            },
            {
              state: "Writer B: updates the database to v2, deletes the cache key",
              note: "The key was already absent; the delete does nothing.",
            },
            {
              state: "Reader A: sets cache = v1",
              note: "A writes the value it read before B's update.",
            },
            {
              state: "Cache serves v1 while the database holds v2",
              note: "Bounded by the TTL, or fixed with versioned sets that refuse older data.",
            },
          ],
          "The stale-set race"
        ),
        h2("The write strategies under failure"),
        compare(
          [
            {
              label: "Cache-aside + delete on write",
              time: "First read after a write misses",
              space: "Only what was read",
              when: "The default for read-heavy data where brief staleness is tolerable.",
              preferred: true,
            },
            {
              label: "Write-through",
              time: "Every write pays cache + database",
              space: "Caches data that may never be read",
              when: "Data is read soon after it is written and a miss right after a write is unacceptable.",
            },
            {
              label: "Write-back (write-behind)",
              time: "Writes complete at cache speed",
              space: "Dirty entries held until flushed",
              when: "High write rates where losing the last few seconds on a crash is acceptable — counters, telemetry.",
            },
          ],
          "Same cache, three contracts"
        ),
        warn(
          "Write-back makes the cache the only holder of recent writes until they are flushed. If the node is lost before then, those writes are gone, and the client was already told they succeeded. Use it only for data where that loss is an explicitly accepted outcome.",
          "Write-back is a durability decision"
        ),
        h2("TTLs, eviction and negative caching"),
        ul(
          "TTL is a promise about staleness: 'this may be up to five minutes old'. Choose it from what the product can tolerate, not from what makes the hit ratio look good.",
          "Add jitter: a TTL of 300 s ± 10% stops keys loaded together from expiring together.",
          "Eviction decides what goes when memory is full. Least-recently-used suits most workloads; frequency-based policies protect steady favourites from being flushed out by one-off scans.",
          "Cache misses too: if lookups for nonexistent ids are common, store a short-lived 'not found' entry, or every such request goes to the database."
        ),
        h2("Stopping a stampede"),
        p(
          "A stampede happens when a hot key expires or is deleted and hundreds of concurrent requests miss at the same moment, each running the same expensive query. The database sees a spike exactly when the cache is least able to help."
        ),
        table(
          ["Technique", "How it works", "Cost"],
          [
            [
              "Request coalescing",
              "One request loads the key; others wait for its result",
              "Waiters pay the load latency",
            ],
            [
              "Lock or lease on miss",
              "Only the lease holder may repopulate; others retry briefly",
              "A short retry loop in clients",
            ],
            [
              "Stale-while-revalidate",
              "Serve the expired value while one request refreshes it",
              "Readers briefly see old data",
            ],
            [
              "Early refresh",
              "Refresh probabilistically shortly before expiry",
              "A few extra loads per key",
            ],
          ],
          "All four turn many loads of one key into one."
        ),
        warn(
          "Adding a cache with no owner for invalidation. Someone writes to the database through a path that was never wired to delete the cache key — an admin tool, a batch job, a migration — and the cache serves the old value until it expires, or forever if it has no TTL. Every write path must invalidate, and every key must have a TTL in case one does not.",
          "The common mistake"
        ),
        h2("Recognising which strategy you need"),
        ul(
          "Read-heavy, tolerant of seconds of staleness: cache-aside with a TTL.",
          "Read immediately after write, staleness unacceptable: write-through, or skip the cache for that read.",
          "Very high write rate on approximate values: write-back with accepted loss.",
          "A few extremely hot keys: coalescing or stale-while-revalidate before anything else."
        ),
      ],
    },
    {
      slug: "rate-limiting-and-backpressure",
      title: "Rate Limiting and Backpressure",
      summary:
        "Token buckets, leaky buckets and sliding windows; bounded queues; and shedding load before overload turns into collapse.",
      difficulty: "MEDIUM",
      readingMinutes: 13,
      objectives: [
        "Implement a token bucket and explain how its two parameters shape traffic",
        "Compare fixed window, sliding window and bucket algorithms on accuracy, memory and burst behaviour",
        "Explain why an unbounded queue under sustained overload makes every request fail",
        "Choose between rejecting, queuing and shedding when demand exceeds capacity",
      ],
      keyTakeaways: [
        "A rate limit protects capacity and fairness; it is a promise about what one client may consume.",
        "Token bucket allows bounded bursts with a steady average; leaky bucket smooths output to a fixed rate.",
        "Fixed windows allow double bursts at window boundaries; sliding windows fix that at some cost.",
        "Bounded queues and early rejection keep latency sane; unbounded queues turn overload into universal timeouts.",
        "Retries without backoff and jitter amplify the overload they are reacting to.",
      ],
      content: [
        h2("Two problems, one family of tools"),
        p(
          "Rate limiting answers 'how much may this client use?' — protection against abuse, runaway scripts and one tenant starving the rest. Backpressure answers 'what happens when everyone together asks for more than we can do?'. Both come down to the same move: decide early, and cheaply, which work will not be done."
        ),
        h2("The algorithms"),
        h3("Fixed window"),
        p(
          "Count requests per client per calendar minute; reject once the count passes the limit. One counter per client, trivially cheap. The flaw is at the boundary: with a limit of 100 per minute, a client can send 100 requests at 0:59 and 100 more at 1:00 — 200 requests in about a second, all allowed."
        ),
        h3("Sliding window"),
        p(
          "A sliding window log stores each request's timestamp and counts those within the last 60 seconds. It is exact, and costs memory per request. A sliding window counter approximates it with two fixed-window counts: current count plus the previous window's count weighted by how much of it still overlaps."
        ),
        worked(
          "Limit 100 per minute. The previous minute had 80 requests; the current minute has 30 so far, and we are 15 seconds (25%) into it.",
          "Estimated 90 in the last 60 seconds, so the request is allowed. Two counters per client, no timestamp log.",
          [
            {
              state: "Overlap of previous window = 1 − 0.25 = 0.75",
              note: "75% of the last 60 s still falls in the previous minute.",
            },
            {
              state: "Estimate = 30 + 80 × 0.75 = 90",
              note: "Assumes the previous minute's requests were evenly spread.",
            },
            {
              state: "90 < 100 → allow, and increment the current count",
              note: "Accurate enough for most limits, at fixed-window cost.",
            },
          ],
          "Sliding window counter"
        ),
        h3("Token bucket"),
        p(
          "A bucket holds up to b tokens and refills at r tokens per second. Each request takes a token; an empty bucket means reject. The average rate is capped at r, and a client that has been idle may burst up to b at once — usually exactly the behaviour you want, because real clients are bursty."
        ),
        code(
          "ts",
          `type Bucket = { tokens: number; updatedAt: number };

function allow(bucket: Bucket, now: number, rate: number, capacity: number) {
  // Refill lazily: no timer, just account for the time that passed.
  const elapsedSeconds = (now - bucket.updatedAt) / 1000;
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSeconds * rate);
  bucket.updatedAt = now;

  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}`,
          "A token bucket needs two numbers per client and no background timer"
        ),
        worked(
          "Capacity 10, refill 2 tokens per second. The client has been idle, so the bucket is full.",
          "Bursts are absorbed up to the capacity; sustained traffic is held to the refill rate.",
          [
            {
              state: "t = 0 s: 12 requests arrive at once",
              note: "10 take tokens and pass; 2 are rejected. Bucket: 0.",
            },
            {
              state: "t = 1.5 s: bucket has refilled 3 tokens",
              note: "Up to 3 more requests can pass immediately.",
            },
            {
              state: "Steady 5 requests/s from then on",
              note: "Only ~2/s pass; the bucket enforces the average.",
            },
          ],
          "Token bucket in action"
        ),
        h3("Leaky bucket"),
        p(
          "Requests join a bounded queue that drains at a fixed rate; when the queue is full, new arrivals are dropped. Where the token bucket lets bursts through, the leaky bucket flattens them into a steady stream — useful in front of a downstream that cannot absorb bursts at all."
        ),
        table(
          ["Algorithm", "Cost per request", "State per client", "Bursts", "Right for"],
          [
            [
              "Fixed window",
              "O(1)",
              "1 counter",
              "Up to 2× the limit at a boundary",
              "Coarse quotas, such as daily limits",
            ],
            [
              "Sliding window log",
              "O(requests in window) to trim",
              "1 timestamp per request",
              "Exact; none beyond the limit",
              "Low limits that must be exact, like login attempts",
            ],
            [
              "Sliding window counter",
              "O(1)",
              "2 counters",
              "Approximately smoothed",
              "General API limits where close is good enough",
            ],
            [
              "Token bucket",
              "O(1)",
              "2 numbers",
              "Up to the bucket capacity, then the refill rate",
              "Most API rate limits: allow bursts, cap the average",
            ],
            [
              "Leaky bucket",
              "O(1) to enqueue",
              "A bounded queue",
              "Absorbed, then released at a fixed rate",
              "Smoothing traffic for a fragile downstream",
            ],
          ],
          "Rate-limiting algorithms compared. Token bucket is the usual default."
        ),
        h2("Limiting across many servers"),
        p(
          "With twenty API instances, a per-instance limit lets a client get twenty times the intended rate by spreading requests. The usual fix is a shared counter store, updated with an atomic operation per request (increment-and-check, or a small server-side script for the token bucket), so every instance sees the same count."
        ),
        arch(
          {
            nodes: [
              { id: "c", kind: "client", label: "Clients" },
              { id: "lb", kind: "load_balancer", label: "Load balancer" },
              {
                id: "api",
                kind: "api",
                label: "API instances",
                note: "check limit before any work",
              },
              {
                id: "rl",
                kind: "cache",
                label: "Limit counters",
                note: "atomic per-client update",
              },
              {
                id: "q",
                kind: "queue",
                label: "Bounded work queue",
                note: "rejects when full",
              },
              { id: "w", kind: "worker", label: "Workers", note: "fixed capacity" },
              { id: "db", kind: "database", label: "Database" },
            ],
            edges: [
              { id: "e1", from: "c", to: "lb", kind: "sync" },
              { id: "e2", from: "lb", to: "api", kind: "sync" },
              { id: "e3", from: "api", to: "rl", label: "take token", kind: "sync" },
              {
                id: "e4",
                from: "api",
                to: "q",
                label: "enqueue or 429/503",
                kind: "async",
              },
              { id: "e5", from: "q", to: "w", kind: "async" },
              { id: "e6", from: "w", to: "db", kind: "sync" },
            ],
          },
          "Limits are checked first and cheaply; the queue behind them has a hard bound."
        ),
        tip(
          "Tell clients what happened. A 429 response with a Retry-After header lets well-behaved clients slow down precisely instead of guessing, and remaining-quota headers let them pace themselves before they hit the limit at all."
        ),
        note(
          "The shared counter store is now on every request's path. Decide what happens if it is unreachable: failing open (allow everything) keeps the product up and drops protection; failing closed (reject everything) protects the backend and takes the product down. Most public APIs fail open with a conservative local limit as a fallback."
        ),
        h2("Backpressure: when everyone together is too much"),
        p(
          "Rate limits cap individuals. Overload can still arrive from many well-behaved clients at once, and then the question is what the system does with work it cannot finish in time."
        ),
        worked(
          "Workers can complete 200 requests/s. Traffic arrives at 300 requests/s and stays there. The queue is unbounded; clients time out after 10 s.",
          "After a minute every new request waits ~30 s and times out — the system does full work on requests nobody is still waiting for.",
          [
            {
              state: "Queue grows at 300 − 200 = 100 requests/s",
              note: "Arrivals exceed completions, so the backlog only grows.",
            },
            {
              state: "After 60 s: 6,000 requests queued",
              note: "Each new arrival joins the back of the line.",
            },
            {
              state: "Wait ≈ 6,000 / 200 per s = 30 s",
              note: "Three times the client timeout.",
            },
            {
              state: "Useful throughput → close to zero",
              note: "Workers spend their capacity on requests whose clients already gave up.",
            },
          ],
          "How an unbounded queue turns overload into collapse"
        ),
        p(
          "With a bound of, say, 1,000 queued requests, the system instead rejects about 100 requests a second immediately and serves the other 200 within about 5 seconds. Fewer requests succeed than arrive — that is unavoidable at 150% load — but the ones that do succeed are useful."
        ),
        ul(
          "Bound every queue and buffer, and reject when it is full.",
          "Drop work that has already waited past its deadline instead of processing it.",
          "Shed by priority: keep checkout and login working, delay recommendations and analytics.",
          "Propagate slowness upstream — a full queue should become a fast error or a slower producer, not a hidden backlog."
        ),
        warn(
          "Retrying immediately on every failure. When a service is overloaded, each failure triggers a retry that adds load, which causes more failures and more retries. Use exponential backoff with random jitter, cap the number of attempts, and consider a retry budget — for example, retries may add at most a small percentage on top of normal traffic.",
          "The common mistake"
        ),
        h2("Recognising it"),
        ul(
          "A public API, per-user quotas or abuse protection: token bucket per client key.",
          "A fragile downstream that cannot take bursts: leaky bucket or a fixed-rate worker pool.",
          "Latency climbing while throughput stays flat: a hidden queue is filling; bound it.",
          "Failures spreading from one service to its callers: missing backoff, missing load shedding."
        ),
        practice(
          ["recent-request-counter"],
          "Sliding-window counting, the core of a window-based limiter"
        ),
      ],
    },
  ],
};

export const SD_STORAGE_SCALING_SECTIONS: SectionSeed[] = [
  STORAGE_INTERNALS,
  SCALING_READS_AND_WRITES,
];
