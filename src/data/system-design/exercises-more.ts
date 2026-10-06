import type { ExerciseSeed } from "./exercises";

/** Further design exercises, appended after the originals. */
export const MORE_SYSTEM_DESIGN_EXERCISES: ExerciseSeed[] = [
  {
    slug: "social-news-feed",
    title: "Social News Feed",
    tagline: "Show each person the latest posts from everyone they follow, in a blink.",
    difficulty: "MEDIUM",
    functionalRequirements: [
      "Let a user publish a post with text and optional images",
      "Let a user follow and unfollow other users",
      "Show a home feed of recent posts from the people a user follows, newest first",
      "Page through the feed with a stable cursor, not page numbers",
      "Show a user's own profile timeline of everything they have posted",
    ],
    nonFunctionalRequirements: [
      "The first page of a feed should load in under 200 ms at p99",
      "A new post may take a few seconds to appear in followers' feeds",
      "Feed reads must stay fast even when one author has millions of followers",
      "Losing a post is unacceptable; briefly missing one from a feed is tolerable",
    ],
    scaleEstimate: {
      "Daily active users": "50 million, as a planning assumption",
      "Feed loads per day": "~10 per user, so 500 million (~6,000/second average)",
      "Posts per day": "~1 per 5 users, so 10 million (~115/second average)",
      "Average followers":
        "~200, so naive fan-out is ~2 billion feed inserts/day (~23,000/second)",
      "Feed cache size":
        "500 most recent post ids × 8 bytes ≈ 4 KB per user; 50 million users ≈ 200 GB",
      "Read:write ratio": "~50 feed loads per post, so reads must be the cheap side",
    },
    apiDesign: [
      { method: "POST", path: "/v1/posts", purpose: "Publish a post; returns its id" },
      {
        method: "GET",
        path: "/v1/feed?cursor=",
        purpose: "The signed-in user's home feed, one page at a time",
      },
      {
        method: "GET",
        path: "/v1/users/{id}/posts",
        purpose: "One author's own timeline",
      },
      {
        method: "PUT",
        path: "/v1/users/{id}/follow",
        purpose: "Follow a user; DELETE on the same path unfollows",
      },
    ],
    dataModel: [
      {
        name: "Post",
        fields: "id (time-sortable), authorId, body, mediaKeys, createdAt",
        notes: "Immutable once written; partitioned by authorId",
      },
      {
        name: "Follow",
        fields: "followerId, followeeId, createdAt",
        notes: "Stored twice: indexed by follower and by followee",
      },
      {
        name: "FeedEntry",
        fields: "userId, postId, authorId",
        notes: "Bounded list per user in the feed cache, rebuildable",
      },
    ],
    bottlenecks: [
      "Fan-out on write multiplies one post into hundreds of feed inserts",
      "A very popular author turns a single post into millions of inserts at once",
      "Hydrating a page of post ids into full posts is many point reads per request",
      "Inactive users' feeds consume cache memory that is never read",
    ],
    architecture: {
      nodes: [
        { id: "client", kind: "client", label: "App" },
        { id: "lb", kind: "load_balancer", label: "Load Balancer" },
        { id: "api", kind: "api", label: "Feed API", note: "stateless" },
        { id: "posts", kind: "database", label: "Post Store", note: "by author" },
        { id: "graph", kind: "database", label: "Follow Graph" },
        { id: "q", kind: "queue", label: "New Post Events" },
        {
          id: "fanout",
          kind: "worker",
          label: "Fan-out Worker",
          note: "skips very popular authors",
        },
        {
          id: "feeds",
          kind: "cache",
          label: "Feed Cache",
          note: "recent post ids per user",
        },
        { id: "postcache", kind: "cache", label: "Post Cache", note: "id → post" },
        { id: "media", kind: "object_storage", label: "Media Store" },
        { id: "cdn", kind: "cdn", label: "Media CDN" },
      ],
      edges: [
        { id: "e1", from: "client", to: "lb", kind: "sync" },
        { id: "e2", from: "lb", to: "api", kind: "sync" },
        { id: "e3", from: "api", to: "posts", label: "write post", kind: "sync" },
        { id: "e4", from: "api", to: "q", label: "post created", kind: "async" },
        { id: "e5", from: "q", to: "fanout", kind: "async" },
        {
          id: "e6",
          from: "fanout",
          to: "graph",
          label: "list followers",
          kind: "sync",
        },
        { id: "e7", from: "fanout", to: "feeds", label: "push post id", kind: "sync" },
        { id: "e8", from: "api", to: "feeds", label: "read feed", kind: "sync" },
        { id: "e9", from: "api", to: "postcache", label: "hydrate", kind: "sync" },
        { id: "e10", from: "postcache", to: "posts", label: "on miss", kind: "sync" },
        { id: "e11", from: "client", to: "cdn", label: "images", kind: "sync" },
        { id: "e12", from: "cdn", to: "media", label: "on miss", kind: "sync" },
      ],
    },
    tradeoffs: [
      {
        decision: "When feeds are assembled",
        chose: "Fan-out on write for most authors, merge on read for very popular ones",
        over: "Pure fan-out on write, or pure merge on read",
        because:
          "Pushing every post into every follower's list makes reads a single lookup, but one author with ten million followers turns one post into ten million writes. Pulling those few authors' recent posts at read time and merging them in caps the write amplification while keeping the common read cheap.",
      },
      {
        decision: "What the feed cache holds",
        chose: "Post ids only, hydrated from a post cache",
        over: "Full post bodies copied into every feed",
        because:
          "Copying bodies multiplies storage by the follower count and makes an edit or deletion a mass update. Ids are 8 bytes, and the post cache serves the same popular posts to everyone, so hydration is mostly cache hits.",
      },
      {
        decision: "Feeds for users who rarely visit",
        chose: "Only keep cached feeds for recently active users",
        over: "Maintaining a feed for every account",
        because:
          "Writing into feeds nobody opens is pure cost. When a dormant user returns, building their feed once from the follow graph and recent posts is slower for that one request, and far cheaper than keeping millions of unread lists warm.",
      },
      {
        decision: "Pagination",
        chose: "A cursor based on the last post id seen",
        over: "Offset-based page numbers",
        because:
          'New posts arrive at the top while someone scrolls, so offsets shift and repeat or skip items. Time-sortable ids give a stable cursor: "older than this id" means the same thing no matter what has been added since.',
      },
    ],
    scalingNotes: [
      {
        stage: "Early",
        problem: "None; the follow graph is small",
        response:
          "Query followees' recent posts at read time with an index on (authorId, createdAt)",
      },
      {
        stage: "Reads climb",
        problem: "Merging many authors per request is slow",
        response: "Switch to fan-out on write into a per-user feed cache",
      },
      {
        stage: "Popular authors appear",
        problem: "Single posts trigger enormous fan-out bursts",
        response: "Mark authors above a follower threshold for merge-on-read instead",
      },
      {
        stage: "Feed cache outgrows memory",
        problem: "Hundreds of gigabytes of lists",
        response: "Shard by userId, cap each list, and evict inactive users entirely",
      },
    ],
  },
  {
    slug: "chat-messaging",
    title: "Chat Messaging",
    tagline:
      "Deliver every message in order, to every device, and say when it was read.",
    difficulty: "MEDIUM",
    functionalRequirements: [
      "Send text messages one-to-one and in groups of up to a few hundred members",
      "Deliver messages in real time to recipients who are online",
      "Store messages for offline recipients and deliver them on reconnect",
      "Show sent, delivered and read receipts for each message",
      "Show whether a contact is online or when they were last seen",
      "Sync a conversation's history to a newly signed-in device",
    ],
    nonFunctionalRequirements: [
      "Online-to-online delivery should take well under 500 ms",
      "Messages within one conversation must appear in the same order for every member",
      "An acknowledged message must never be lost, even if a server crashes",
      "Presence may be a few seconds stale; message delivery may not",
    ],
    scaleEstimate: {
      "Daily active users": "20 million, as a planning assumption",
      "Messages per day": "~40 per user, so 800 million (~9,000/second average)",
      "Peak multiplier": "~4x in evening hours, so ~37,000 messages/second",
      "Concurrent connections": "~25% online at peak, so ~5 million open sockets",
      "Sockets per gateway": "~50,000 each, so ~100 gateway instances at peak",
      "Storage per day": "800 million × ~200 bytes ≈ 160 GB/day before replication",
    },
    apiDesign: [
      {
        method: "WS",
        path: "/v1/connect",
        purpose: "Persistent socket: send, receive, receipts and presence",
      },
      {
        method: "POST",
        path: "/v1/conversations/{id}/messages",
        purpose: "Send a message with a client-generated id, for retries",
      },
      {
        method: "GET",
        path: "/v1/conversations/{id}/messages?after=",
        purpose: "Fetch history after a sequence number",
      },
      {
        method: "POST",
        path: "/v1/conversations/{id}/read",
        purpose: "Mark read up to a sequence number",
      },
    ],
    dataModel: [
      {
        name: "Message",
        fields: "conversationId, seq, messageId, senderId, body, sentAt",
        notes: "Primary key (conversationId, seq); unique on messageId",
      },
      {
        name: "Conversation",
        fields: "id, kind, memberIds, lastSeq",
        notes: "lastSeq is the per-conversation counter",
      },
      {
        name: "ReadCursor",
        fields: "conversationId, userId, deliveredSeq, readSeq",
        notes: "One row per member, not per message",
      },
      {
        name: "Presence",
        fields: "userId, gatewayId, lastSeenAt",
        notes: "In memory with a TTL; refreshed by heartbeats",
      },
    ],
    bottlenecks: [
      "Millions of long-lived sockets pin users to specific gateway machines",
      "Routing a message needs to know which gateway each recipient is on",
      "Per-conversation ordering forces writes for one conversation through one sequencer",
      "Group messages and receipts multiply by member count",
      "Presence heartbeats generate more traffic than messages themselves",
    ],
    architecture: {
      nodes: [
        { id: "client", kind: "client", label: "Chat App" },
        {
          id: "lb",
          kind: "load_balancer",
          label: "Connection Balancer",
          note: "sticky sockets",
        },
        {
          id: "gw",
          kind: "api",
          label: "Socket Gateways",
          note: "hold open connections",
        },
        {
          id: "chat",
          kind: "service",
          label: "Message Service",
          note: "assigns seq per conversation",
        },
        {
          id: "store",
          kind: "database",
          label: "Message Store",
          note: "partitioned by conversation",
        },
        {
          id: "presence",
          kind: "cache",
          label: "Presence & Routing",
          note: "user → gateway, TTL",
        },
        { id: "bus", kind: "queue", label: "Delivery Bus", note: "topic per gateway" },
        { id: "push", kind: "worker", label: "Offline Notifier" },
        { id: "provider", kind: "external", label: "Mobile Push Provider" },
      ],
      edges: [
        { id: "e1", from: "client", to: "lb", kind: "sync" },
        { id: "e2", from: "lb", to: "gw", kind: "sync" },
        { id: "e3", from: "gw", to: "chat", label: "send", kind: "sync" },
        {
          id: "e4",
          from: "chat",
          to: "store",
          label: "append, then ack",
          kind: "sync",
        },
        {
          id: "e5",
          from: "chat",
          to: "presence",
          label: "where are members?",
          kind: "sync",
        },
        { id: "e6", from: "chat", to: "bus", label: "route to gateway", kind: "async" },
        { id: "e7", from: "bus", to: "gw", label: "deliver", kind: "async" },
        { id: "e8", from: "gw", to: "presence", label: "heartbeat", kind: "async" },
        { id: "e9", from: "bus", to: "push", label: "offline members", kind: "async" },
        { id: "e10", from: "push", to: "provider", kind: "sync" },
      ],
    },
    tradeoffs: [
      {
        decision: "How order is established",
        chose: "A server-assigned sequence number per conversation",
        over: "Client timestamps",
        because:
          "Device clocks disagree, so sorting by sender time shows members different orders. A per-conversation counter gives one total order that everyone agrees on, and ordering only within a conversation means no global sequencer is needed.",
      },
      {
        decision: "When the sender gets an acknowledgement",
        chose: "After the message is durably stored, before it is delivered",
        over: "After every recipient has received it",
        because:
          'Waiting for recipients makes the sender\'s experience depend on the slowest phone in the group. Persisting first lets the server promise "this will not be lost", and delivery receipts then report the separate question of whether it arrived.',
      },
      {
        decision: "How receipts are stored",
        chose: "A delivered and read cursor per member",
        over: "A receipt row per message per member",
        because:
          'In a group of 200, per-message receipts mean 200 rows for every message sent. Messages are read in order, so "read up to seq N" captures the same information in one row per member that only ever moves forward.',
      },
      {
        decision: "Retries without duplicates",
        chose: "A client-generated message id, unique per conversation",
        over: "Server-generated ids only",
        because:
          "On a flaky network the client cannot tell a lost request from a lost acknowledgement, so it must retry. A client id lets the server recognise the second attempt and return the original seq instead of storing the message twice.",
      },
    ],
    scalingNotes: [
      {
        stage: "Single gateway",
        problem: "None; every user is on one box",
        response: "Deliver in-process; presence is a local map",
      },
      {
        stage: "Many gateways",
        problem: "Sender and recipient are on different machines",
        response: "Keep a user → gateway map in a shared cache and route through a bus",
      },
      {
        stage: "Large groups",
        problem: "One message fans out to hundreds of sockets",
        response:
          "Group recipients by gateway and send one bus message per gateway, not per member",
      },
      {
        stage: "Presence floods",
        problem: "Heartbeats outnumber messages",
        response:
          "Lengthen heartbeat intervals and only push presence changes to contacts with the chat open",
      },
    ],
  },
  {
    slug: "file-sync-storage",
    title: "File Sync and Storage",
    tagline:
      "Keep the same folder identical on every device, uploading each byte only once.",
    difficulty: "HARD",
    functionalRequirements: [
      "Upload and download files of any size, from a few bytes to tens of gigabytes",
      "Resume an interrupted upload without starting over",
      "Sync changes made on one device to the user's other devices automatically",
      "Keep previous versions of a file and allow restoring one",
      "Detect when two devices edited the same file while offline and keep both copies",
      "Share a folder with another user",
    ],
    nonFunctionalRequirements: [
      "A stored file must never be corrupted or silently lost",
      "A small edit to a large file should upload roughly the changed bytes, not the whole file",
      "Changes should reach other online devices within a few seconds",
      "Metadata operations like listing a folder must stay fast regardless of file sizes",
    ],
    scaleEstimate: {
      "Registered users": "100 million, with 10 million active daily",
      "Data per user": "~10 GB average, so ~1 EB logical before deduplication",
      "Changes per day":
        "~20 file changes per active user, so 200 million (~2,300/second)",
      "Chunk size": "~4 MB average; a 1 GB file is ~256 chunks",
      "Upload volume":
        "if a change averages 2 MB of new chunks, ~400 TB/day (~4.6 GB/second) inbound",
      "Metadata per file":
        "~500 bytes, so ~1,000 files × 100 million users ≈ 50 TB of metadata",
    },
    apiDesign: [
      {
        method: "POST",
        path: "/v1/files/{path}/commit",
        purpose:
          "Propose a new version as an ordered list of chunk hashes; returns which hashes are missing",
      },
      {
        method: "PUT",
        path: "/v1/chunks/{hash}",
        purpose: "Upload one missing chunk; the server verifies the hash",
      },
      {
        method: "GET",
        path: "/v1/changes?cursor=",
        purpose: "Long-poll for metadata changes since a cursor",
      },
      {
        method: "GET",
        path: "/v1/chunks/{hash}",
        purpose: "Download one chunk, usually through a short-lived signed URL",
      },
      {
        method: "GET",
        path: "/v1/files/{path}/versions",
        purpose: "List previous versions for restore",
      },
    ],
    dataModel: [
      {
        name: "FileVersion",
        fields:
          "namespaceId, path, version, chunkHashes[], size, parentVersion, deviceId",
        notes: "Append-only; the latest row is the current file",
      },
      {
        name: "Chunk",
        fields: "hash (PK), size, storageKey, refCount",
        notes: "Content-addressed; shared across files and users",
      },
      {
        name: "Journal",
        fields: "namespaceId, cursor, path, version, op",
        notes: "Ordered change log that devices sync from",
      },
      {
        name: "Namespace",
        fields: "id, ownerId, memberIds",
        notes: "A user's root or a shared folder",
      },
    ],
    bottlenecks: [
      "Raw upload bandwidth dwarfs every other cost in the system",
      "Hashing and chunking large files costs client CPU and battery",
      "Every device polling for changes multiplies load by devices per user",
      "Reference counts on shared chunks must be exact or data is deleted early",
      "Concurrent offline edits to one file have no single correct answer",
    ],
    architecture: {
      nodes: [
        {
          id: "client",
          kind: "client",
          label: "Sync Client",
          note: "chunks and hashes locally",
        },
        { id: "lb", kind: "load_balancer", label: "Load Balancer" },
        {
          id: "meta",
          kind: "api",
          label: "Metadata API",
          note: "commits, listings, versions",
        },
        {
          id: "blockapi",
          kind: "api",
          label: "Chunk API",
          note: "upload and download",
        },
        {
          id: "metadb",
          kind: "database",
          label: "Metadata Store",
          note: "sharded by namespace",
        },
        {
          id: "chunkidx",
          kind: "database",
          label: "Chunk Index",
          note: "hash → location, refcount",
        },
        {
          id: "blobs",
          kind: "object_storage",
          label: "Chunk Storage",
          note: "content-addressed",
        },
        {
          id: "notify",
          kind: "service",
          label: "Change Notifier",
          note: "holds long-polls",
        },
        { id: "journal", kind: "queue", label: "Change Journal" },
        {
          id: "gc",
          kind: "worker",
          label: "Garbage Collector",
          note: "deletes unreferenced chunks",
        },
      ],
      edges: [
        { id: "e1", from: "client", to: "lb", kind: "sync" },
        { id: "e2", from: "lb", to: "meta", kind: "sync" },
        { id: "e3", from: "lb", to: "blockapi", kind: "sync" },
        {
          id: "e4",
          from: "meta",
          to: "chunkidx",
          label: "which hashes are missing?",
          kind: "sync",
        },
        { id: "e5", from: "blockapi", to: "blobs", label: "store chunk", kind: "sync" },
        {
          id: "e6",
          from: "blockapi",
          to: "chunkidx",
          label: "register hash",
          kind: "sync",
        },
        { id: "e7", from: "meta", to: "metadb", label: "commit version", kind: "sync" },
        { id: "e8", from: "meta", to: "journal", label: "file changed", kind: "async" },
        { id: "e9", from: "journal", to: "notify", kind: "async" },
        { id: "e10", from: "client", to: "notify", label: "long-poll", kind: "sync" },
        {
          id: "e11",
          from: "gc",
          to: "chunkidx",
          label: "find refcount 0",
          kind: "sync",
        },
        { id: "e12", from: "gc", to: "blobs", label: "delete", kind: "sync" },
      ],
    },
    tradeoffs: [
      {
        decision: "How files are split",
        chose: "Content-defined chunking for large files",
        over: "Fixed-size chunks only",
        because:
          "With fixed boundaries, inserting one byte near the start shifts every later chunk and changes every hash, so the whole file re-uploads. Choosing boundaries from a rolling hash of the content lets boundaries move with the data, so only chunks around the edit change. The cost is variable chunk sizes and more client CPU.",
      },
      {
        decision: "Where deduplication happens",
        chose: "Across all users, keyed by content hash",
        over: "Per user only",
        because:
          'Many people store identical installers, photos and documents, and global dedup stores each once. The price is a subtle privacy leak: a fast "already have it" reply reveals that someone else holds that exact file. Requiring the client to upload anyway for small or sensitive files, or deduplicating per user, closes it at a storage cost.',
      },
      {
        decision: "Upload ordering",
        chose: "Upload missing chunks first, then commit metadata",
        over: "Commit metadata first and stream the data after",
        because:
          "If metadata lands first, other devices see a file whose bytes do not exist yet and fail to download it. Making the commit the final step means a version only becomes visible once every chunk it names is durably stored.",
      },
      {
        decision: "Handling conflicting edits",
        chose: "Keep both, renaming one as a conflicted copy",
        over: "Last writer wins",
        because:
          "A commit carries the version it was based on; if that is no longer the latest, two devices edited independently. Last writer wins silently discards someone's work. A visible conflicted copy is inelegant but never loses data, and the system cannot merge arbitrary binary formats anyway.",
      },
    ],
    scalingNotes: [
      {
        stage: "Early",
        problem: "None",
        response:
          "Whole-file uploads into object storage with a relational metadata table",
      },
      {
        stage: "Large files appear",
        problem: "Interrupted uploads restart from zero",
        response: "Split into chunks so progress is per chunk and resumable",
      },
      {
        stage: "Storage costs climb",
        problem: "The same bytes are stored many times",
        response:
          "Content-address chunks and deduplicate by hash, with reference counts",
      },
      {
        stage: "Metadata outgrows one node",
        problem: "One database holds every folder",
        response:
          "Shard by namespace; a shared folder is its own namespace so its journal stays on one shard",
      },
    ],
  },
  {
    slug: "web-crawler",
    title: "Web Crawler",
    tagline: "Fetch a billion pages politely, without fetching any of them twice.",
    difficulty: "MEDIUM",
    functionalRequirements: [
      "Start from a set of seed URLs and discover new pages by following links",
      "Fetch and store the raw content of each page for downstream indexing",
      "Obey each site's robots.txt rules",
      "Revisit pages periodically, more often for pages that change often",
      "Skip pages whose content is identical to one already stored",
    ],
    nonFunctionalRequirements: [
      "Never send a single host more than about one request per second",
      "Throughput should scale roughly linearly with the number of fetchers",
      "A crashed fetcher must not lose its share of the work",
      "Avoid crawler traps such as endless calendar or session-id URLs",
    ],
    scaleEstimate: {
      Target: "1 billion pages per month, as a planning assumption",
      "Fetch rate": "1 billion ÷ ~2.6 million seconds ≈ 400 pages/second average",
      "Page size": "~100 KB average HTML, so ~40 MB/second (~320 Mbit/second) inbound",
      "Raw storage": "1 billion × 100 KB = 100 TB/month, ~25 TB if compressed 4:1",
      "URLs seen":
        "~20 links per page, mostly repeats; assume ~10 billion distinct URLs",
      "Seen-set memory":
        "10 billion URLs in a Bloom filter at 1% false positives ≈ 12 GB",
    },
    apiDesign: [
      { method: "POST", path: "/v1/seeds", purpose: "Add seed URLs to the frontier" },
      {
        method: "internal",
        path: "frontier.next(fetcherId)",
        purpose: "Lease the next batch of URLs whose host is due",
      },
      {
        method: "internal",
        path: "frontier.complete(urls, links)",
        purpose: "Report results and newly discovered links",
      },
      {
        method: "GET",
        path: "/v1/pages/{urlHash}",
        purpose: "Fetch stored content and crawl metadata for one URL",
      },
    ],
    dataModel: [
      {
        name: "UrlRecord",
        fields:
          "urlHash (PK), url, host, lastFetchedAt, nextDueAt, contentHash, status",
        notes: "Partitioned by host so one host's URLs live together",
      },
      {
        name: "HostState",
        fields: "host, robotsRules, robotsFetchedAt, crawlDelay, nextAllowedAt",
        notes: "Read before every fetch to that host",
      },
      {
        name: "Page",
        fields: "urlHash, fetchedAt, contentHash, storageKey",
        notes: "Body lives in object storage",
      },
    ],
    bottlenecks: [
      "Politeness: work is plentiful overall but each host can only take a trickle",
      "DNS resolution adds latency to every fetch to a new host",
      "Checking whether a URL was already seen across tens of billions of entries",
      "A few slow or hanging servers tie up fetcher connections",
    ],
    architecture: {
      nodes: [
        { id: "seeds", kind: "client", label: "Seed Input" },
        {
          id: "frontier",
          kind: "service",
          label: "URL Frontier",
          note: "priority + per-host queues",
        },
        {
          id: "hostq",
          kind: "queue",
          label: "Per-host Queues",
          note: "one active fetch per host",
        },
        { id: "fetch", kind: "worker", label: "Fetchers", note: "async I/O, timeouts" },
        { id: "dns", kind: "cache", label: "DNS & Robots Cache" },
        { id: "web", kind: "external", label: "Websites" },
        { id: "raw", kind: "object_storage", label: "Page Store" },
        {
          id: "parse",
          kind: "worker",
          label: "Parser",
          note: "extract and normalise links",
        },
        {
          id: "seen",
          kind: "cache",
          label: "Seen Filter",
          note: "URL + content hashes",
        },
        { id: "urls", kind: "database", label: "URL Database" },
      ],
      edges: [
        { id: "e1", from: "seeds", to: "frontier", kind: "sync" },
        { id: "e2", from: "frontier", to: "hostq", kind: "async" },
        {
          id: "e3",
          from: "hostq",
          to: "fetch",
          label: "lease when host is due",
          kind: "async",
        },
        {
          id: "e4",
          from: "fetch",
          to: "dns",
          label: "resolve, check rules",
          kind: "sync",
        },
        { id: "e5", from: "fetch", to: "web", label: "HTTP GET", kind: "sync" },
        { id: "e6", from: "fetch", to: "raw", label: "store body", kind: "sync" },
        { id: "e7", from: "fetch", to: "parse", kind: "async" },
        { id: "e8", from: "parse", to: "seen", label: "new URL?", kind: "sync" },
        {
          id: "e9",
          from: "parse",
          to: "frontier",
          label: "unseen links",
          kind: "async",
        },
        {
          id: "e10",
          from: "frontier",
          to: "urls",
          label: "schedule, record",
          kind: "sync",
        },
      ],
    },
    tradeoffs: [
      {
        decision: "How politeness is enforced",
        chose: "Route each host to exactly one queue with a next-allowed time",
        over: "A global rate limit across all fetchers",
        because:
          "A global limit says nothing about how load spreads, so many fetchers can still land on one host at once. Assigning every host to a single queue makes per-host pacing a local decision: that queue simply does not hand out the next URL until the delay has passed.",
      },
      {
        decision: "Remembering which URLs were seen",
        chose: "A Bloom filter in front of the URL database",
        over: "An exact lookup for every discovered link",
        because:
          'Most discovered links are already known, and checking each against a database is billions of reads. A Bloom filter answers "definitely new" or "probably seen" from memory. Its false positives mean a small fraction of genuinely new pages are skipped, which is acceptable for a crawl that is never complete anyway.',
      },
      {
        decision: "Crawl order",
        chose: "Prioritised: important and fast-changing pages first",
        over: "Plain breadth-first order",
        because:
          "Breadth-first treats a site's home page and its ten-thousandth archive page alike. A priority score from signals like inbound links and observed change rate spends the fixed fetch budget where freshness matters, at the cost of a more complex frontier.",
      },
      {
        decision: "Duplicate content",
        chose: "Hash the normalised content and skip storing repeats",
        over: "Store every fetched page",
        because:
          "Mirrors, print versions and tracking parameters produce many URLs for the same page. A content hash catches exact copies cheaply. Near-duplicates need a similarity hash instead, which is worth adding once exact matching is in place.",
      },
    ],
    scalingNotes: [
      {
        stage: "One machine",
        problem: "None at small scale",
        response: "An in-memory frontier and a set of seen URLs in a single process",
      },
      {
        stage: "Several fetchers",
        problem: "Two fetchers hit the same host together",
        response: "Partition hosts across fetchers by hash so each host has one owner",
      },
      {
        stage: "Seen set outgrows memory",
        problem: "Exact sets of billions of URLs are too large",
        response:
          "Bloom filter in memory, URL database on disk for the authoritative record",
      },
      {
        stage: "Recrawl dominates",
        problem: "Revisits crowd out discovery",
        response:
          "Schedule revisits by each page's observed change rate, with separate budgets for new and known URLs",
      },
    ],
  },
  {
    slug: "ride-matching",
    title: "Ride Matching",
    tagline:
      "Pair a rider with a nearby driver in seconds, while everyone keeps moving.",
    difficulty: "HARD",
    functionalRequirements: [
      "Let drivers go online and stream their location while available",
      "Let a rider request a trip from a pickup point to a destination",
      "Offer the request to a suitable nearby driver, and to the next one if declined",
      "Show the rider the matched driver's live position until pickup",
      "Track a trip through requested, matched, in progress and completed states",
    ],
    nonFunctionalRequirements: [
      "A rider should be matched or told no one is available within about 10 seconds",
      "A driver must never be assigned two trips at once",
      "Driver positions on the rider's map may lag by a few seconds",
      "Losing a few location pings is harmless; losing a trip's state is not",
    ],
    scaleEstimate: {
      "Online drivers at peak": "500,000, as a planning assumption",
      "Location updates": "one every 4 seconds, so 125,000 writes/second",
      "Ride requests": "~20 million/day, ~230/second average, ~1,000/second at peak",
      "Nearby search":
        "each request scans a few cells holding ~50 drivers, so ~50,000 candidate checks/second at peak",
      "Live location state":
        "500,000 × ~100 bytes ≈ 50 MB — fits in memory many times over",
      "Location history":
        "125,000 × 100 bytes × 86,400 s ≈ 1 TB/day if every ping is kept",
    },
    apiDesign: [
      {
        method: "POST",
        path: "/v1/drivers/me/location",
        purpose: "Report position and availability; usually over a socket",
      },
      {
        method: "POST",
        path: "/v1/trips",
        purpose: "Request a trip with pickup and destination",
      },
      {
        method: "POST",
        path: "/v1/trips/{id}/accept",
        purpose: "A driver accepts the offer they were sent",
      },
      {
        method: "GET",
        path: "/v1/trips/{id}",
        purpose: "Trip state and the driver's latest position",
      },
      {
        method: "POST",
        path: "/v1/trips/{id}/status",
        purpose: "Advance the trip: arrived, started, completed",
      },
    ],
    dataModel: [
      {
        name: "DriverLocation",
        fields: "driverId, cellId, lat, lng, heading, status, updatedAt",
        notes: "In memory, indexed by cell; overwritten every ping",
      },
      {
        name: "Trip",
        fields: "id, riderId, driverId, pickup, dropoff, state, version, createdAt",
        notes: "Durable; state changes use a version check",
      },
      {
        name: "Offer",
        fields: "tripId, driverId, sentAt, expiresAt, outcome",
        notes: "One active offer per trip at a time",
      },
    ],
    bottlenecks: [
      "Location updates are a constant high write rate that never lets up",
      '"Drivers near this point" is a spatial query, which ordinary indexes handle badly',
      "Two simultaneous requests can pick the same nearest driver",
      "Demand is concentrated: a stadium emptying turns one cell into a hotspot",
      "Drivers on a cell boundary can be missed by a search of one cell",
    ],
    architecture: {
      nodes: [
        { id: "rider", kind: "client", label: "Rider App" },
        { id: "driver", kind: "client", label: "Driver App" },
        { id: "gw", kind: "api", label: "Gateway", note: "sockets for drivers" },
        { id: "loc", kind: "service", label: "Location Service" },
        {
          id: "geo",
          kind: "cache",
          label: "Geo Index",
          note: "cell → available drivers",
        },
        {
          id: "match",
          kind: "service",
          label: "Matching Service",
          note: "partitioned by region",
        },
        { id: "trips", kind: "database", label: "Trip Store", note: "source of truth" },
        { id: "events", kind: "queue", label: "Location Stream" },
        { id: "archive", kind: "worker", label: "History Writer" },
        { id: "history", kind: "object_storage", label: "Location History" },
        { id: "push", kind: "external", label: "Mobile Push Provider" },
      ],
      edges: [
        { id: "e1", from: "driver", to: "gw", label: "ping every few s", kind: "sync" },
        { id: "e2", from: "rider", to: "gw", label: "request trip", kind: "sync" },
        { id: "e3", from: "gw", to: "loc", kind: "sync" },
        { id: "e4", from: "loc", to: "geo", label: "move between cells", kind: "sync" },
        { id: "e5", from: "loc", to: "events", kind: "async" },
        { id: "e6", from: "events", to: "archive", kind: "async" },
        { id: "e7", from: "archive", to: "history", label: "batched", kind: "sync" },
        { id: "e8", from: "gw", to: "match", label: "find driver", kind: "sync" },
        { id: "e9", from: "match", to: "geo", label: "nearby cells", kind: "sync" },
        { id: "e10", from: "match", to: "trips", label: "claim driver", kind: "sync" },
        { id: "e11", from: "match", to: "push", label: "offer", kind: "async" },
      ],
    },
    tradeoffs: [
      {
        decision: "How nearby drivers are found",
        chose: "Divide the map into cells and index drivers by cell id",
        over: "A latitude and longitude range query on a database",
        because:
          'A two-column range query can only use one dimension of an index well and scans a strip of the map. Mapping each position to a cell id turns "near here" into a lookup of a cell and its neighbours, and moving a driver is a remove from one set and an add to another.',
      },
      {
        decision: "Where live locations live",
        chose: "In memory, overwritten in place, with history streamed elsewhere",
        over: "Writing every ping to the durable database",
        because:
          "Only the newest position matters for matching, and it is replaced every few seconds. Persisting 125,000 writes a second to the system of record buys nothing for matching; if the in-memory index is lost, it refills from the next round of pings within seconds.",
      },
      {
        decision: "Preventing double assignment",
        chose: "An atomic claim on the driver with a short expiry",
        over: "Choosing the nearest driver and hoping requests do not collide",
        because:
          "Two riders on the same corner see the same nearest driver. A conditional write that only succeeds if the driver is still available makes exactly one claim win; the other request moves to the next candidate. The expiry releases the driver if the offer is ignored.",
      },
      {
        decision: "Matching strategy",
        chose: "Greedy nearest available driver, offered one at a time",
        over: "Batching requests for a few seconds and solving an assignment",
        because:
          "Batched assignment produces better total pickup times when demand is dense, but it adds deliberate delay and much more complexity. Greedy matching is simple and fast, and is the right starting point; batching is an optimisation to add for busy regions later.",
      },
    ],
    scalingNotes: [
      {
        stage: "One city",
        problem: "None; everything fits in one process",
        response: "A single in-memory geo index and one trip database",
      },
      {
        stage: "Many cities",
        problem: "One index takes every ping on the planet",
        response:
          "Partition the location and matching services by region; trips rarely cross regions",
      },
      {
        stage: "Hotspots",
        problem: "One busy cell overloads its partition",
        response:
          "Use finer cells in dense areas and spread a hot region across more instances",
      },
      {
        stage: "Ping volume grows",
        problem: "Location writes outpace the gateways",
        response: "Send pings less often when a driver is stationary or not available",
      },
    ],
  },
];
