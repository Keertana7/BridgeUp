import { useParams, useNavigate } from "react-router-dom";

// ─── Full mock details keyed by experience id ────────────────────────────────
// ids must match those in Experiences.jsx
const DETAILS = {

  // ════════════════════════════════════════════════════
  // HSBC
  // ════════════════════════════════════════════════════

  "hsbc-1": {
    company: "HSBC",
    companyId: "1",
    role: "Software Engineer",
    batch: "2024",
    package: "8 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "September 2024",
    preparationDuration: "3 months",
    rounds: [
      {
        title: "Round 1 — Online Aptitude Test",
        content: `The test had three sections: quantitative aptitude, logical reasoning, and verbal ability — about 20 questions in 40 minutes.

Topics covered: time and work, profit and loss, number series, and reading comprehension. Difficulty was moderate — standard campus placement level.

Tip: IndiaBix and previous year papers are enough to clear this round.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `The interviewer started with SQL.

Classic question: write a query to find the second highest salary from a table. They then asked about different types of joins — inner, left, right, full outer — with examples.

After SQL, we moved to Data Structures:
- Reverse a linked list
- Find duplicates in an array using hashing
- Binary search on a sorted array

They asked about time and space complexity after every answer.

I made a small mistake in the linked list reversal but corrected it when the interviewer gave a hint. The session was collaborative, not adversarial.`,
      },
      {
        title: "Round 3 — HR Round",
        content: `Relaxed and conversational. Standard questions:

- Tell me about yourself
- Why HSBC?
- Where do you see yourself in five years?
- Describe a situation where you handled conflict in a team

The interviewer seemed to be assessing communication skills and cultural fit more than technical depth.`,
      },
    ],
    result_note: "Received the offer letter within two weeks of the final round.",
  },

  "hsbc-2": {
    company: "HSBC",
    companyId: "1",
    role: "Technology Analyst",
    batch: "2024",
    package: "7.5 LPA",
    difficulty: "Easy",
    result: "Selected",
    interviewDate: "October 2024",
    preparationDuration: "6 weeks",
    rounds: [
      {
        title: "Round 1 — Online Assessment",
        content: `Two sections: aptitude (basic maths and reasoning) and a coding section with one easy string manipulation problem.

I finished the entire test in about 25 minutes. If you know Python or Java basics, the coding part is very manageable.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `Single technical interview, approximately 45 minutes.

Topics covered:
- OOP concepts: inheritance, polymorphism, encapsulation, abstraction — the interviewer asked for real-world examples, not just textbook definitions
- Coding problem: find all pairs in an array that sum to a given target value
- Basic HTTP methods and what REST APIs are

The interviewer was friendly and genuinely interested in how I approached problems. They helped when I got stuck rather than just waiting in silence.`,
      },
    ],
    result_note: "One of the smoother campus processes I attended. Offer confirmed within 10 days.",
  },

  "hsbc-3": {
    company: "HSBC",
    companyId: "1",
    role: "Graduate Trainee",
    batch: "2023",
    package: "6.5 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "October 2023",
    preparationDuration: "2 months",
    rounds: [
      {
        title: "Round 1 — Group Discussion",
        content: `Topic: "Is digital banking replacing traditional banking?"

About 8 candidates in the group, 15 minutes, with a moderator observing silently.

I made two clear points and acknowledged what others had said before responding to them. The key is to be assertive but not aggressive — avoid interrupting, but do not stay silent either.

Quality of contribution matters more than frequency.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `Started with two classic puzzles:
- Find the missing number in a sequence from 1 to 100
- You have 8 balls, one is heavier — how many weighings on a balance scale do you need?

Then a detailed discussion about my final year project. The interviewer tested whether I actually understood what I had built or had just copied it. Be ready to explain every design decision.

Basic networking questions:
- What happens step by step when you type a URL in the browser?
- OSI model layers — just the names and one-line description of each

Nothing very deep, but you need to be confident.`,
      },
      {
        title: "Round 3 — HR",
        content: `Discussed my internship experience and what I learned from it.

Also asked: tell me about a time you failed and what you did about it. Be honest here — a real story works better than a rehearsed one.

They asked about motivation for joining a banking company as a CS student, which I had prepared for.`,
      },
    ],
    result_note: "Selected for the Graduate Trainee Program. Joining date given as March 2024.",
  },

  // ════════════════════════════════════════════════════
  // IBM
  // ════════════════════════════════════════════════════

  "ibm-1": {
    company: "IBM",
    companyId: "2",
    role: "Associate Software Engineer",
    batch: "2024",
    package: "6.5 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "August 2024",
    preparationDuration: "2.5 months",
    rounds: [
      {
        title: "Round 1 — IBM Cognito Online Test",
        content: `Three sections:

1. Quantitative Aptitude — percentages, ratios, number series
2. English — reading comprehension and fill in the blanks
3. Coding — two problems (easy to medium difficulty)

My coding problems: one string manipulation problem and one basic DP problem (counting paths in a grid).

The time per section is strict. Manage it carefully — do not spend more than 5 minutes on any single question.`,
      },
      {
        title: "Round 2 — Technical Interview 1",
        content: `The interviewer started from my resume and spent about 10 minutes on my internship project. Be prepared to explain your project in depth.

DSA questions:
- Detect a cycle in a linked list (expected: Floyd's algorithm)
- Print a matrix in spiral order
- Explain quicksort with best, average, and worst-case complexities

DBMS:
- What is normalization? Difference between 1NF, 2NF, and 3NF with examples

The normalization question caught a few people off guard. Make sure you know it with examples.`,
      },
      {
        title: "Round 3 — Technical Interview 2",
        content: `More system-level thinking this time.

Basic system design: how would you design a URL shortener? They did not expect a production-grade answer. They just wanted to see if I could identify the main components — a database, a hash function, a redirect mechanism.

OS concepts:
- Process vs thread — what is the actual difference?
- What are the four necessary conditions for deadlock (Coffman conditions)?

This round was shorter, about 30 minutes.`,
      },
    ],
    result_note: "Offer received. IBM sends the offer letter directly to your college placement cell.",
  },

  "ibm-2": {
    company: "IBM",
    companyId: "2",
    role: "Application Developer",
    batch: "2024",
    package: "9 LPA",
    difficulty: "Hard",
    result: "Selected",
    interviewDate: "August 2024",
    preparationDuration: "4 months",
    rounds: [
      {
        title: "Round 1 — Online Test",
        content: `Same Cognito platform as the ASE track but harder.

Coding problems:
- Graph BFS traversal (find shortest path between two nodes)
- Longest Common Subsequence (classic DP problem)

If you are not comfortable with graphs, practice before applying to this track.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `Heavy DSA focus:

- Implement a stack using two queues (full working code)
- Find the kth largest element in an unsorted array (expected: min-heap approach)
- Merge two sorted linked lists

After each solution the interviewer asked about time complexity, space complexity, and whether there was a more optimal approach. They pushed me to optimise even after I gave a correct answer.`,
      },
      {
        title: "Round 3 — Case Study Presentation",
        content: `This round was unexpected and nobody in our batch had prepared for it.

The scenario: a mid-sized retail company is losing customers to online competitors. Propose a software solution.

20 minutes to prepare. 10 minutes to present.

What I did:
- Identified root problems: no online presence, no loyalty program, poor inventory visibility
- Proposed a web app with a customer-facing storefront, an inventory management dashboard, and an automated reorder alert system
- Drew a simple database schema: customers, products, orders, inventory tables

They asked about scalability ("what if 10,000 users are on at the same time?") and cost ("roughly how much would this cost to build?").

I did not have perfect answers but reasoned through both questions clearly. They did not expect a perfect answer — they wanted structured thinking under pressure.`,
      },
      {
        title: "Round 4 — HR",
        content: `Standard but thorough:

- Walk me through a time you led a team
- Describe a project failure and what you learned
- Where do you see yourself in three years?
- Why IBM specifically?

Communication skills and confidence mattered a lot in this round.`,
      },
    ],
    result_note: "Selected. The case study round filtered out roughly half the candidates.",
  },

  "ibm-3": {
    company: "IBM",
    companyId: "2",
    role: "Software Developer",
    batch: "2023",
    package: "7 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "November 2023",
    preparationDuration: "3 months",
    rounds: [
      {
        title: "Round 1 — Coding Round",
        content: `Two problems on HackerEarth:

1. Find the longest palindromic substring in a given string
2. Count the number of connected components in an undirected graph

I solved the first completely. For the second I got the BFS logic right but had an off-by-one error. I explained my approach clearly which I think helped.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `The interviewer systematically went through three core CS subjects.

OS:
- What is a deadlock? Give a real example.
- Explain the Banker's algorithm at a high level
- Difference between mutex and semaphore

DBMS:
- Types of joins with examples
- What is indexing and why is it useful?
- Explain ACID properties with a banking example

CN:
- TCP vs UDP — when would you choose each?
- What is the three-way handshake?
- What does DNS do?

Coding question at the end: check if a binary tree is symmetric.

The interview lasted about an hour. Thorough but fair — the interviewer gave you a moment to think before pushing you.`,
      },
    ],
    result_note: "Offer received. Core CS subjects were the real differentiator in this process.",
  },

  // ════════════════════════════════════════════════════
  // Cognizant
  // ════════════════════════════════════════════════════

  "cog-1": {
    company: "Cognizant",
    companyId: "3",
    role: "Programmer Analyst Trainee",
    batch: "2024",
    package: "4 LPA",
    difficulty: "Easy",
    result: "Selected",
    interviewDate: "September 2024",
    preparationDuration: "6 weeks",
    rounds: [
      {
        title: "Round 1 — Online Assessment (AMCAT)",
        content: `Four sections:
1. English comprehension
2. Logical reasoning — syllogisms, odd one out, number puzzles
3. Quantitative aptitude — percentages, ratios, time and work
4. Coding — two easy problems

My coding problems: reverse a string without using built-in functions, and find the sum of digits of a number recursively. Both were very straightforward.

The AMCAT platform is well-known. Practice their official mock tests.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `About 35 minutes.

Started with my final year project — make sure you genuinely understand what you built.

OOP in Java:
- Explain inheritance with a real-world example
- What is method overloading vs method overriding?
- Difference between ArrayList and LinkedList in Java (when to use which)

SQL:
- Write a query to find employees in department 10 with salary above 50,000 (basic WHERE clause)
- What is GROUP BY and when do you use it?

Very friendly interview overall.`,
      },
      {
        title: "Round 3 — HR Interview",
        content: `Standard HR questions:
- Tell me about yourself (have a 2-minute version ready)
- Family background
- Are you comfortable relocating? (Cognizant posts across India — say yes unless you have a genuine constraint)
- What are your career goals for the next five years?`,
      },
    ],
    result_note: "Selected. The GenC cut-off is around 70–75% on the AMCAT. Clear that and the interview is manageable.",
  },

  "cog-2": {
    company: "Cognizant",
    companyId: "3",
    role: "GenC Elevate",
    batch: "2024",
    package: "5.5 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "September 2024",
    preparationDuration: "3 months",
    rounds: [
      {
        title: "Round 1 — Online Test",
        content: `Higher difficulty than the regular GenC AMCAT test.

Coding section had two medium-level problems:
1. Maximum sum subarray of size k (sliding window)
2. Count number of islands in a 2D grid (BFS/DFS)

The cut-off is significantly higher for Elevate — around 80% overall. Weak performance in the coding section is especially penalised.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `About 50 minutes — noticeably more depth than the PAT interview.

Project discussion:
- Explained my final year project
- The interviewer asked: how would you scale this project to handle 10x more users? (I talked about database indexing and horizontal scaling)

DSA:
- Check if two strings are anagrams (expected the HashMap frequency approach for O(n) time)
- They then asked for the most space-efficient approach (sorting both strings is O(n log n) but O(1) extra space)

DBMS:
- What is an index and when does it help performance?
- What is a clustered vs non-clustered index?

System design (basic level):
- Design the database schema for a student marks management system — just entities, attributes, and relationships

The interviewer was testing depth, not breadth.`,
      },
      {
        title: "Round 3 — HR",
        content: `This one was more focused than the PAT HR round.

Key question: why do you want the Elevate track specifically and not the standard GenC track?

Have a real answer ready. I said I wanted a role where I would be solving technical problems from day one rather than spending the first year on maintenance tasks. They appreciated that I had thought about it.`,
      },
    ],
    result_note: "Selected for GenC Elevate. The package difference and role quality make it worth preparing harder for.",
  },

  "cog-3": {
    company: "Cognizant",
    companyId: "3",
    role: "Programmer Analyst",
    batch: "2023",
    package: "4.5 LPA",
    difficulty: "Easy",
    result: "Selected",
    interviewDate: "October 2023",
    preparationDuration: "2 months",
    rounds: [
      {
        title: "Round 1 — Online Test",
        content: `Standard AMCAT format — aptitude, verbal, and two easy coding problems. Nothing unusual compared to other years.`,
      },
      {
        title: "Round 2 — Group Discussion",
        content: `Topic: "Work from home vs work from office — which is better for freshers?"

Ten students, 15 minutes, observed by two panellists.

I structured my argument around the mentorship and learning opportunities that in-office work provides for someone who is just starting out, while acknowledging that WFH offers flexibility benefits. I spoke three times during the discussion.

Key learning: do not try to dominate. Make a few clear, well-reasoned points. Acknowledge others. The panellists are watching how you interact, not just what you say.`,
      },
      {
        title: "Round 3 — Technical + Managerial Round",
        content: `Combined interview — first 20 minutes technical, last 15 minutes managerial.

Technical:
- Walk me through your final year project
- OOP: difference between abstract class and interface
- Write a SQL query with a JOIN and GROUP BY

Managerial:
- How do you handle pressure or tight deadlines?
- Tell me about a time you disagreed with a teammate
- How do you adapt when requirements change suddenly?`,
      },
      {
        title: "Round 4 — HR",
        content: `Relocation comfort (required — Cognizant posts across India), expected joining date, and basic background questions.`,
      },
    ],
    result_note: "Selected. The process was well-organised. Stay calm — it is designed to be student-friendly.",
  },

  // ════════════════════════════════════════════════════
  // Rakuten
  // ════════════════════════════════════════════════════

  "rak-1": {
    company: "Rakuten",
    companyId: "4",
    role: "Software Engineer",
    batch: "2024",
    package: "20 LPA",
    difficulty: "Hard",
    result: "Selected",
    interviewDate: "January 2024",
    preparationDuration: "5 months",
    rounds: [
      {
        title: "Round 1 — HackerRank Coding Test",
        content: `3 problems in 90 minutes.

1. Minimum cost path in a grid (DP)
2. Shortest path with weighted edges — Dijkstra's algorithm required
3. Pattern matching with wildcards (? matches any single character, * matches any sequence)

I solved problems 1 and 2 fully and got partial credit on problem 3. The cut-off was roughly 2 fully solved problems.

Note: a clean partial solution with a clear explanation is better than a hacky full solution. Write readable code and add comments.`,
      },
      {
        title: "Round 2 — Technical Interview 1 (Algorithm Focus)",
        content: `Purely algorithms. About 75 minutes. No behavioural questions.

Problems:
1. Implement an LRU (Least Recently Used) cache from scratch — required both a HashMap and a doubly linked list
2. Find all subsets of a set using bit manipulation (then also using recursion)
3. Given a stream of integers, find the median after each new integer (expected: use a max-heap and min-heap together)

After every solution: "What is the time complexity? Can you do better? What is the space complexity?"

This was the hardest interview I have ever given on algorithms. Be very comfortable with heaps, linked lists, and bitwise operations before applying.`,
      },
      {
        title: "Round 3 — Technical Interview 2",
        content: `Broader technical topics.

System design:
- Design a basic e-commerce product search — identify the main components (product database, search index, API layer, caching)

OS:
- Page replacement algorithms: LRU, FIFO, Optimal — explain each and their trade-offs

DBMS:
- What is query optimisation and why does the query planner matter?

Java:
- How does garbage collection work?
- What is the difference between a strong reference and a weak reference?`,
      },
    ],
    result_note: "Selected. Rakuten is genuinely one of the harder processes. Do not apply unless you are confident in algorithms.",
  },

  "rak-2": {
    company: "Rakuten",
    companyId: "4",
    role: "Backend Engineer",
    batch: "2023",
    package: "22 LPA",
    difficulty: "Hard",
    result: "Selected",
    interviewDate: "February 2023",
    preparationDuration: "6 months",
    rounds: [
      {
        title: "Round 1 — Online Coding Test",
        content: `Three problems in 90 minutes.

One was about finding bridges in an undirected graph — this uses Tarjan's algorithm, which is very niche. Most candidates left it blank and focused on maximising partial credit on the other two problems (standard DP and string manipulation).

You do not need to know Tarjan's to get through, but knowing it is a serious advantage.`,
      },
      {
        title: "Round 2 — Live Coding Interview 1",
        content: `Live coding on a shared editor. The interviewer could see every keystroke.

Two problems:

1. Implement a thread-safe blocking queue with producer and consumer — required explicit lock and condition variable usage
2. Design and implement a simple in-memory key-value store with TTL (time to live) — keys expire after a given duration

They expected edge cases to be handled and the code to be production-quality — proper error handling, clear variable names, comments where needed.

Communicate constantly. Silence for more than 30 seconds is a red flag.`,
      },
      {
        title: "Round 3 — Live Coding Interview 2",
        content: `Advanced data structures.

Topics: segment trees and Fenwick trees (Binary Indexed Trees).

I had a solid understanding of segment trees and implemented range sum queries correctly. For Fenwick trees I had to be guided through the construction — the interviewer was fine with this and actually talked through the intuition with me.

The key learning: Rakuten wants to see how you learn and adapt, not just what you already know. If you do not know something, say so honestly and engage with their explanation.`,
      },
      {
        title: "Round 4 — System Design + HR",
        content: `System design: design a scalable push notification system.

Key components I covered: a message broker (like Kafka), a notification service, device token management, retry logic for failed deliveries, and monitoring.

HR questions:
- Why Rakuten specifically?
- How do you feel about working in a Japan-influenced company culture?
- Long-term career goals`,
      },
    ],
    result_note: "Selected. Rakuten Backend is the hardest campus process I know of at our college. Months of serious preparation are required.",
  },

  // ════════════════════════════════════════════════════
  // Amazon
  // ════════════════════════════════════════════════════

  "amz-1": {
    company: "Amazon",
    companyId: "12",
    role: "SDE Intern",
    batch: "2024",
    package: "100K INR/month",
    difficulty: "Hard",
    result: "Selected",
    interviewDate: "December 2023",
    preparationDuration: "4 months",
    rounds: [
      {
        title: "Round 1 — Online Assessment",
        content: `Two LeetCode-style coding problems on HackerRank, 90 minutes.

Problem 1: graph BFS — find the minimum number of steps to reach a target cell in a grid with obstacles.
Problem 2: tree problem — check if a binary tree is balanced (height difference at every node is at most 1).

Both were medium difficulty. I solved both.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `Live coding on a shared document. The interviewer introduced himself and then immediately started.

Two DSA problems:

1. Implement a max-heap from scratch (insert and extract-max operations)
2. Sliding window maximum — given an array and a window of size k, find the maximum in each window

For both problems, the interviewer expected me to clarify edge cases before writing code, not after. This is the Amazon style — ask clarifying questions first.

After each solution: complexity analysis.`,
      },
      {
        title: "Round 3 — Leadership Principles + Technical",
        content: `Amazon Leadership Principles (LP) questions make up a significant part of every interview round.

LP questions I was asked:
- Tell me about a time you had a significant disagreement with a teammate. How did you handle it?
- Describe a time you took initiative on something that was not your responsibility.
- Tell me about a time you delivered something under a tight deadline.

Coding problem: given a list of meeting time intervals, find the minimum number of conference rooms required.

Prepare at least 2–3 real STAR-format stories for each of the 16 Amazon Leadership Principles before your interview. This is not optional — LP rounds are as important as the coding rounds.`,
      },
    ],
    result_note: "Selected for the SDE Intern role. Internship converted to full-time offer.",
  },

  "amz-2": {
    company: "Amazon",
    companyId: "12",
    role: "SDE 1",
    batch: "2024",
    package: "32 LPA",
    difficulty: "Hard",
    result: "Selected",
    interviewDate: "January 2024",
    preparationDuration: "6 months",
    rounds: [
      {
        title: "Round 1 — Online Assessment",
        content: `Two medium-hard coding problems plus a work simulation section.

The work simulation section presents realistic workplace scenarios and asks which response aligns with Amazon's Leadership Principles. Knowing the LPs helps here.

Coding problems: one on dynamic programming (minimum cost to climb stairs variant) and one on binary trees (lowest common ancestor).`,
      },
      {
        title: "Round 2 — Technical Round 1",
        content: `Two DSA problems. Full working code required — not pseudocode.

1. Design and implement an LRU cache (get and put operations in O(1)) — required HashMap + doubly linked list
2. Sliding window maximum — find the maximum element in every contiguous subarray of size k (expected: deque-based O(n) solution)

After each solution: walk me through the code, explain every line, and give complexities.`,
      },
      {
        title: "Round 3 — Technical Round 2",
        content: `System design + LP.

System design: design a simple rate limiter (limit requests per user per minute).

I covered: token bucket algorithm, a Redis-backed implementation, what happens when a request is rejected, and how to handle distributed environments.

LP question: tell me about a time you used data to make a decision.

Additional coding problem: merge k sorted lists (expected: min-heap solution).`,
      },
      {
        title: "Round 4 — Bar Raiser",
        content: `The most intense round. A Bar Raiser is an interviewer from a different team whose job is to maintain the hiring standard.

LP questions were deeper and more probing — they pushed back on my answers to see if the story held up. Prepare real stories, not fabricated ones.

Coding problem: find the median of a data stream (two-heap approach).

The interviewer also asked general engineering questions: how do you approach debugging a production issue? What do you do when you disagree with a technical direction your team has chosen?

I did not solve the coding problem completely but explained my approach clearly and got credit for the reasoning.`,
      },
    ],
    result_note: "Selected for SDE 1. Amazon's process is demanding but transparent — you know exactly where you stand after each round.",
  },

  // ════════════════════════════════════════════════════
  // TCS
  // ════════════════════════════════════════════════════

  "tcs-1": {
    company: "TCS",
    companyId: "8",
    role: "Assistant System Engineer",
    batch: "2024",
    package: "3.36 LPA",
    difficulty: "Easy",
    result: "Selected",
    interviewDate: "August 2024",
    preparationDuration: "5 weeks",
    rounds: [
      {
        title: "Round 1 — TCS NQT",
        content: `Four sections: numerical ability, verbal ability, reasoning ability, and programming logic. Plus two coding problems at the end.

Numerical: percentages, ratios, geometry basics.
Verbal: fill in the blanks, error spotting, reading comprehension.
Reasoning: series completion, puzzles, directions.
Programming logic: pseudo-code analysis, predict the output.

Coding problems: I got one array rotation problem and one string reversal problem — both easy.

This round is the main filter. A good score here guarantees the interview call. Practice TCS NQT mock tests on their official PrepInsta page.`,
      },
      {
        title: "Round 2 — Technical + HR Interview",
        content: `Combined session, about 30 minutes total.

Technical (first 20 minutes):
- Walk me through your final year project
- What is polymorphism? Give an example in Java
- Difference between an array and a linked list
- Write a simple SQL query to find the average salary by department (GROUP BY + AVG)

HR (last 10 minutes):
- Why TCS?
- Are you comfortable with the two-year service bond?
- Preferred work location?
- Where do you see yourself in five years?

Be honest about the bond — they ask directly.`,
      },
    ],
    result_note: "Selected. The ASE process is the most straightforward of all TCS tracks.",
  },

  "tcs-2": {
    company: "TCS",
    companyId: "8",
    role: "Digital",
    batch: "2024",
    package: "7 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "August 2024",
    preparationDuration: "3 months",
    rounds: [
      {
        title: "Round 1 — Advanced NQT",
        content: `The Digital track has a harder version of the NQT with a separate coding section.

Coding problems: two medium-difficulty problems — I got one on sorting (custom comparator) and one on a basic graph problem (BFS to find shortest path).

The cut-off for Digital is significantly higher than ASE. A weak coding section score will not be compensated by a strong aptitude score.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `About 45 minutes.

Final year project — detailed discussion, same as ASE but deeper.

DSA:
- Explain merge sort. Write the merge function. What is its time complexity?
- Given an unsorted array, find the two elements that sum to a target (expected: HashMap in O(n))

OS:
- Difference between process and thread
- CPU scheduling algorithms — explain FCFS, SJF, Round Robin

DBMS:
- What is normalization? Why do we need it?
- What is a foreign key?

Coding problem at the end: merge two sorted arrays into one sorted array without extra space.`,
      },
      {
        title: "Round 3 — Managerial Interview",
        content: `Scenario-based questions:

- Your team is falling behind on a deliverable. What do you do?
- A senior team member disagrees with your technical approach. How do you handle it?
- How do you prioritise when you have multiple deadlines at the same time?

These questions test maturity and communication, not just technical skill.`,
      },
    ],
    result_note: "Selected for the Digital track. The package difference over ASE is worth the extra preparation.",
  },

  "tcs-3": {
    company: "TCS",
    companyId: "8",
    role: "Prime",
    batch: "2024",
    package: "11.5 LPA",
    difficulty: "Hard",
    result: "Selected",
    interviewDate: "August 2024",
    preparationDuration: "5 months",
    rounds: [
      {
        title: "Round 1 — Competitive Coding Test",
        content: `Significantly harder than the Digital NQT.

Two to three DSA problems at medium-hard difficulty:
- A graph problem requiring Dijkstra's algorithm
- A DP problem (0/1 knapsack variant)
- One more problem on strings or trees (varied by slot)

The cut-off is very high. If you cannot solve at least two problems fully, your chances are slim.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `Deep technical interview, about 60 minutes.

DSA: implement a trie (insert and search operations).

System design: design a parking lot management system.
- Key entities: parking lot, floor, spot, vehicle
- Spot types: compact, large, motorcycle
- Key operations: park vehicle, remove vehicle, get available spot count
- They asked about edge cases and how to handle them

OS deep dive:
- How does virtual memory work?
- Explain the page fault mechanism
- Thrashing — what causes it and how do you fix it?

After every answer: trade-offs, alternatives, complexity.`,
      },
      {
        title: "Round 3 — HR",
        content: `Why TCS Prime specifically?

Long-term technical ambitions.

Comfort with challenging and ambiguous projects.

The HR round for Prime is more focused on motivation and ambition than the standard tracks.`,
      },
    ],
    result_note: "Selected. TCS Prime is competitive. Strong algorithmic foundations and system design thinking are essential.",
  },

  // ════════════════════════════════════════════════════
  // Applied Materials
  // ════════════════════════════════════════════════════

  "apm-1": {
    company: "Applied Materials",
    companyId: "5",
    role: "Engineer I",
    batch: "2024",
    package: "12 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "September 2024",
    preparationDuration: "3 months",
    rounds: [
      {
        title: "Round 1 — Written Test",
        content: `Pen and paper test — unusual in 2024, but Applied Materials still uses it.

Two sections:
1. C/C++ programming — pointer arithmetic, memory management, output prediction from code snippets
2. Embedded systems basics — interrupt handling, memory-mapped I/O, the volatile keyword and why it matters

About 30 questions in 60 minutes. The C pointer questions can be tricky. Practice output prediction from code — it is a specific skill that requires deliberate practice.`,
      },
      {
        title: "Round 2 — Technical Interview 1",
        content: `About 45 minutes.

My internship project was embedded-related which helped establish credibility early.

C programming question: swap two numbers without using a temporary variable (XOR method and arithmetic method both accepted).

Concepts covered:
- Explain virtual memory and paging
- What is a semaphore? When would you use one in an embedded system?

DSA: find the intersection point of two linked lists.`,
      },
      {
        title: "Round 3 — Technical Interview 2 + HR",
        content: `Combined session.

Technical portion:
- Explain the boot process of a microcontroller step by step
- Difference between RTOS and a general-purpose OS
- Debugging scenario: given a C code snippet with a bug, identify and fix it (there was a dangling pointer issue)

HR portion:
- Relocation comfort (Bangalore/Hyderabad)
- Long-term career goals
- Teamwork and handling disagreements`,
      },
    ],
    result_note: "Selected. Having an embedded internship or project helps a lot in standing out for this role.",
  },

  "apm-2": {
    company: "Applied Materials",
    companyId: "5",
    role: "Process Engineer",
    batch: "2023",
    package: "10 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "October 2023",
    preparationDuration: "2 months",
    rounds: [
      {
        title: "Round 1 — Written Test",
        content: `Domain-specific questions on semiconductor fabrication:
- CVD (Chemical Vapor Deposition) process steps
- Plasma etching — reactive ion etching vs wet etching
- Thin film deposition techniques
- Lithography basics — photoresist, exposure, development

Also included a Python coding section: two problems on data processing — reading CSV-style data and computing averages, and removing outliers from a dataset.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `Very domain-heavy.

Semiconductor questions:
- Explain the CMP (Chemical Mechanical Planarization) process and why it is needed
- What causes gate oxide reliability issues?
- Walk through a simplified CMOS fabrication flow

Python question: write a function to clean a list of sensor readings — remove None values and outliers beyond 2 standard deviations. They were patient while I worked through it.`,
      },
      {
        title: "Round 3 — HR",
        content: `Why Applied Materials specifically?

They asked what I knew about their flagship products — Centura and Endura platforms came up. Mentioning these by name showed genuine interest and they appreciated it.

Relocation to Bangalore or Hyderabad.`,
      },
    ],
    result_note: "Selected. Domain knowledge of semiconductor manufacturing is essential for this role — do not apply without it.",
  },

  // ════════════════════════════════════════════════════
  // Accenture
  // ════════════════════════════════════════════════════

  "acc-1": {
    company: "Accenture",
    companyId: "6",
    role: "Associate Software Engineer",
    batch: "2024",
    package: "4.5 LPA",
    difficulty: "Easy",
    result: "Selected",
    interviewDate: "September 2024",
    preparationDuration: "5 weeks",
    rounds: [
      {
        title: "Round 1 — Online Assessment",
        content: `Three sections:
1. Cognitive ability — logical and analytical reasoning, pattern recognition
2. Technical — basic CS concepts: OOP definitions, DBMS fundamentals, networking layers
3. Coding — two easy problems

My coding problems: check whether a string is a palindrome, and find the sum of all even numbers in an array. Both solved in under 10 minutes.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `Covered my academic projects in the first 15 minutes — be prepared to explain every part of what you built.

OOP in Java:
- Explain polymorphism with a real example (not just the definition)
- What is the difference between method overloading and method overriding?

SQL:
- Write a query using GROUP BY and HAVING to find departments with more than 5 employees
- What is a primary key vs a foreign key?

One coding problem: reverse words in a sentence.`,
      },
      {
        title: "Round 3 — HR Interview",
        content: `Why Accenture?
Describe yourself in 3 words.
Tell me about a time you worked under pressure.
Are you open to relocation across India?
Where do you see yourself in 3 years?

The interviewer was very friendly. This round felt like a conversation rather than an interrogation.`,
      },
    ],
    result_note: "Selected. The Accenture ASE process is one of the most beginner-friendly campus processes.",
  },

  "acc-2": {
    company: "Accenture",
    companyId: "6",
    role: "Packaged App Development Associate",
    batch: "2024",
    package: "6.5 LPA",
    difficulty: "Easy",
    result: "Selected",
    interviewDate: "September 2024",
    preparationDuration: "6 weeks",
    rounds: [
      {
        title: "Round 1 — Online Test",
        content: `Cognitive ability and technical sections, same as the ASE track.

The technical section had some SAP and ERP basics added since the role involves packaged applications. Basic questions like: what is ERP, what is SAP used for, difference between on-premise and cloud ERP.

Nothing deep — just awareness-level knowledge.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `Projects: what did I build, what technology stack, how would I improve it?

Basic OOP and DBMS questions, same as the ASE track.

Then a discussion about enterprise software: what is middleware, why do large companies use ERP systems, what is the difference between customising and configuring a packaged application?

I had read about SAP basics the night before which helped.`,
      },
      {
        title: "Round 3 — HR",
        content: `Why are you interested in the packaged applications track over a pure development role?

Career goals in the context of enterprise software.

Relocation, joining timeline.`,
      },
    ],
    result_note: "Selected. Reading up on SAP basics before the interview makes a noticeable difference for this specific track.",
  },

  // ════════════════════════════════════════════════════
  // Infosys
  // ════════════════════════════════════════════════════

  "inf-1": {
    company: "Infosys",
    companyId: "7",
    role: "Systems Engineer",
    batch: "2024",
    package: "3.6 LPA",
    difficulty: "Easy",
    result: "Selected",
    interviewDate: "August 2024",
    preparationDuration: "5 weeks",
    rounds: [
      {
        title: "Round 1 — InfyTQ Certification",
        content: `The InfyTQ certification is a prerequisite — you must complete it to be eligible for the placement process. Do not leave it for the last minute.

The certification covers programming fundamentals (Java/Python), data structures basics, and some database concepts. It is straightforward if you have a reasonable coding foundation.

Score matters — it affects which track you are considered for.`,
      },
      {
        title: "Round 2 — Online Test",
        content: `Four sections:
1. Reasoning ability — series, analogies, puzzles
2. Mathematical ability — percentages, ratios, basic algebra
3. Verbal ability — reading comprehension, grammar, vocabulary
4. Coding — two easy problems

My coding problems: find the factorial of a number using recursion, and check if a number is prime. Both were very basic.`,
      },
      {
        title: "Round 3 — HR Interview",
        content: `Tell me about yourself (practice a 2-minute version).
What are your strengths and weaknesses?
Why Infosys?
Are you comfortable with a service agreement bond?
Preferred work location?
Where do you see yourself in five years?

Very conversational. The interviewer was patient and encouraging.`,
      },
    ],
    result_note: "Selected. Complete InfyTQ certification early — it is the entry gate and many students underestimate it.",
  },

  "inf-2": {
    company: "Infosys",
    companyId: "7",
    role: "Digital Specialist Engineer",
    batch: "2024",
    package: "9.5 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "August 2024",
    preparationDuration: "3 months",
    rounds: [
      {
        title: "Round 1 — Online Test",
        content: `Harder than the Systems Engineer track. Separate coding section with two medium-level DSA problems.

My problems: inorder traversal of a binary tree without recursion (stack-based), and a DP problem — maximum profit from buying and selling stock with one transaction.

The cut-off for DSE is significantly higher. A weak coding performance is hard to recover from.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `About 50 minutes.

Detailed project discussion: explain your architecture, why you made specific design decisions, and how you would scale it.

DSA:
- Implement a binary search tree — insert and search operations
- Find the lowest common ancestor of two nodes in a BST
- Given two arrays, find their intersection (elements present in both)

Questions about time complexity after each answer.

The interviewer was testing depth of understanding, not just surface knowledge.`,
      },
      {
        title: "Round 3 — HR",
        content: `Why the DSE track specifically and not the Systems Engineer track?

Technical ambitions — what do you want to learn in your first two years?

Are you comfortable with the challenges of a higher-responsibility technical role from day one?`,
      },
    ],
    result_note: "Selected for DSE. The package difference over SE is significant. The extra preparation is worth it.",
  },

  // ════════════════════════════════════════════════════
  // Wipro
  // ════════════════════════════════════════════════════

  "wip-1": {
    company: "Wipro",
    companyId: "9",
    role: "Project Engineer",
    batch: "2024",
    package: "3.5 LPA",
    difficulty: "Easy",
    result: "Selected",
    interviewDate: "September 2024",
    preparationDuration: "4 weeks",
    rounds: [
      {
        title: "Round 1 — Online Assessment",
        content: `Three sections:
1. Aptitude — quantitative (percentages, ratios, time and work) and logical reasoning
2. Communication — English comprehension and essay writing
3. Coding — two easy problems

My coding problems: print all prime numbers up to N, and reverse a linked list. Both straightforward.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `Project discussion first — be ready to explain your final year project clearly.

OOP concepts:
- What is encapsulation? Give an example.
- Difference between abstraction and encapsulation

SQL:
- Write a query to find the second highest salary

One coding problem: check if a string has balanced parentheses (stack-based solution).`,
      },
      {
        title: "Round 3 — HR Interview",
        content: `Why Wipro?
Comfortable with relocation?
Tell me about a time you worked in a team and faced a conflict.
What are your career goals?
Are you okay with night shifts if required?`,
      },
    ],
    result_note: "Selected. Standard campus process. Good communication skills make a significant difference in the HR round.",
  },

  "wip-2": {
    company: "Wipro",
    companyId: "9",
    role: "Turbo",
    batch: "2024",
    package: "6.5 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "September 2024",
    preparationDuration: "2.5 months",
    rounds: [
      {
        title: "Round 1 — Online Assessment",
        content: `Harder version of the standard Wipro test.

The aptitude section had tougher quantitative problems. The coding section had two medium-level problems:
1. Find all pairs in an array that sum to a given target (HashMap approach expected)
2. Detect a cycle in a linked list (Floyd's algorithm)`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `DBMS focus:
- Explain normalisation up to 3NF with examples
- What are the ACID properties?
- Write a SQL query with JOIN, GROUP BY, and HAVING

OOPS:
- Explain polymorphism with a code example
- What is the difference between an interface and an abstract class?

One live coding problem: given a matrix, find the kth smallest element.`,
      },
      {
        title: "Round 3 — HR",
        content: `Why Wipro Turbo over the standard track?

Technical growth expectations.

Handling challenging assignments.

Relocation and joining preferences.`,
      },
    ],
    result_note: "Selected for Wipro Turbo. The higher package and more technical day-one work makes the extra preparation worthwhile.",
  },

  // ════════════════════════════════════════════════════
  // Capgemini
  // ════════════════════════════════════════════════════

  "cap-1": {
    company: "Capgemini",
    companyId: "10",
    role: "Analyst",
    batch: "2024",
    package: "4 LPA",
    difficulty: "Easy",
    result: "Selected",
    interviewDate: "October 2024",
    preparationDuration: "4 weeks",
    rounds: [
      {
        title: "Round 1 — Game-Based Assessment",
        content: `Capgemini uses a unique game-based online assessment instead of a traditional aptitude test.

The games test: working memory (remember sequences), attention (spot differences quickly), problem solving (pattern recognition), and processing speed.

There is no traditional coding section in the game-based round. The games feel unusual but are straightforward if you approach them calmly. Stay focused and do not overthink.

Tip: try the official Capgemini practice games before your actual test date.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `Project discussion — same as every other campus process, know your project inside out.

OOP concepts:
- Explain the four pillars with real examples
- What is a constructor? What is a destructor?

Basic networking:
- What happens when you open a browser and type a URL?
- What is the difference between TCP and UDP?

One simple coding problem: check if a number is a palindrome.`,
      },
      {
        title: "Round 3 — HR Interview",
        content: `Why Capgemini?
Comfortable with travel and client-site work?
Tell me about yourself.
Where do you see yourself in three years?
What is your biggest strength?`,
      },
    ],
    result_note: "Selected. The game-based assessment is the most distinct part of Capgemini's process. Practice it specifically.",
  },

  "cap-2": {
    company: "Capgemini",
    companyId: "10",
    role: "Senior Analyst",
    batch: "2023",
    package: "5 LPA",
    difficulty: "Easy",
    result: "Selected",
    interviewDate: "November 2023",
    preparationDuration: "5 weeks",
    rounds: [
      {
        title: "Round 1 — Online Test",
        content: `For the Senior Analyst track, the test has an additional pseudo-code section alongside the standard aptitude sections.

Pseudo-code questions: given a code block in a language-agnostic syntax, predict the output or identify the error. They test logical thinking rather than syntax knowledge.

Two easy coding problems: find the GCD of two numbers, and count vowels in a string.`,
      },
      {
        title: "Round 2 — Technical Interview",
        content: `Detailed project discussion. The interviewer asked deeper follow-up questions than the Analyst track.

OOP — abstract class vs interface (must know this cold).

DBMS: explain indexing and when it improves query performance.

Scenario: your database query is running slowly. What steps do you take to diagnose and fix it? (Expected: check for missing indexes, examine the query plan, consider denormalization if appropriate.)`,
      },
      {
        title: "Round 3 — HR",
        content: `Standard questions. The interviewer also asked about interest in consulting-style work since Capgemini is a services company.

Relocation flexibility is important for Capgemini — they place employees at client sites across India and sometimes internationally.`,
      },
    ],
    result_note: "Selected. Know the pseudo-code question format before the test — it catches many candidates off guard.",
  },

  // ════════════════════════════════════════════════════
  // Deloitte
  // ════════════════════════════════════════════════════

  "del-1": {
    company: "Deloitte",
    companyId: "11",
    role: "Business Technology Analyst",
    batch: "2024",
    package: "9 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "October 2024",
    preparationDuration: "3 months",
    rounds: [
      {
        title: "Round 1 — Online Assessment",
        content: `Aptitude, verbal, and a technical section covering basic CS concepts.

The technical section had questions on OOP, DBMS, and basic algorithms — not very deep, but you need to be confident in the fundamentals.`,
      },
      {
        title: "Round 2 — Group Discussion",
        content: `Topic: "Should companies invest in AI-driven HR tools?"

I had read about AI in HR recently which helped enormously. I made three specific points:
1. Bias in AI hiring algorithms is a real documented problem
2. AI can significantly reduce time-to-hire for high-volume roles
3. Human judgment remains essential for culture-fit assessments

I also asked a follow-up question to another participant which the moderator noticed.

Key lesson: structured points with real examples carry much more weight than generic opinions.`,
      },
      {
        title: "Round 3 — Case Study Round",
        content: `Scenario: a mid-sized retail company is losing customers to online competitors. Propose a technology solution.

15 minutes to prepare. 10 minutes to present.

My structure:
1. Problem identification: no digital storefront, no customer data analytics, poor inventory visibility
2. Proposed solution: mobile app with a loyalty program, a recommendation engine, and an inventory dashboard
3. Implementation phases: MVP in 3 months, full rollout in 9 months

They asked about:
- Cost estimate (I gave a rough range and noted it depends on build vs buy decisions)
- Data privacy (I mentioned GDPR compliance and data minimisation principles)
- What happens if the technology vendor fails? (I talked about vendor lock-in risk and open standards)

You do not need perfect answers. Clear structured thinking under pressure is what Deloitte is assessing.`,
      },
      {
        title: "Round 4 — HR Interview",
        content: `Why Deloitte and why the BTA role specifically?

A time you led a team through a difficult situation.

How do you handle working on problems where the answer is not clear?

Where do you see yourself in 5 years — within consulting or elsewhere?`,
      },
    ],
    result_note: "Selected. The case study round filtered out roughly 40% of candidates. Prepare for it specifically.",
  },

  "del-2": {
    company: "Deloitte",
    companyId: "11",
    role: "Analyst",
    batch: "2023",
    package: "7.5 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "November 2023",
    preparationDuration: "2.5 months",
    rounds: [
      {
        title: "Round 1 — Online Assessment",
        content: `Standard aptitude and a technical section. Covered quantitative, verbal, logical reasoning, and basic CS concepts.`,
      },
      {
        title: "Round 2 — Technical Interview 1",
        content: `DSA:
- Find the LCA (Lowest Common Ancestor) of a binary tree
- Two-sum problem (find two numbers in an array that add up to a target)

DBMS:
- What is indexing and when does it not help?
- Difference between clustered and non-clustered indexes

Networking:
- OSI model layers — name all seven and give a one-line description of each
- What is a subnet mask and why is it used?`,
      },
      {
        title: "Round 3 — Technical Interview 2",
        content: `Project discussion — very detailed. The interviewer asked how I would take my project to production.

System design scenario: design a simple URL shortener. Key components: a database, a hashing function, a redirect service, and analytics tracking.

Testing question: what types of testing would you do on a web application before releasing it? (Unit, integration, end-to-end, load testing.)

Debugging scenario: your API is returning 500 errors in production. Walk me through how you would diagnose it.`,
      },
      {
        title: "Round 4 — HR",
        content: `Behavioural questions using the STAR method:
- Tell me about a time you failed and what you learned
- Describe a situation where you had to adapt quickly to change
- A time you disagreed with a decision but carried it out anyway

The STAR format (Situation, Task, Action, Result) is expected at Deloitte. Have 4–5 real stories prepared that can flex to fit different questions.`,
      },
    ],
    result_note: "Selected. STAR-format behavioural answers and strong core CS fundamentals are the two differentiators for Deloitte.",
  },

  // ════════════════════════════════════════════════════
  // Microsoft
  // ════════════════════════════════════════════════════

  "msft-1": {
    company: "Microsoft",
    companyId: "13",
    role: "SWE Intern",
    batch: "2024",
    package: "80K INR/month",
    difficulty: "Hard",
    result: "Selected",
    interviewDate: "December 2023",
    preparationDuration: "4 months",
    rounds: [
      {
        title: "Round 1 — Online Coding Test",
        content: `Three problems on HackerRank, medium difficulty.

1. Array problem: given an array, find the maximum product of any two elements
2. String problem: find the longest substring without repeating characters (sliding window)
3. Tree problem: level-order traversal of a binary tree (BFS)

All three solved. Microsoft's OA is achievable with 2–3 months of consistent LeetCode practice.`,
      },
      {
        title: "Round 2 — Technical Interview 1",
        content: `One DSA problem: find the kth smallest element in a BST.

The interviewer expected me to first clarify the problem (what if k is larger than the tree size?), then walk through my approach before writing code, then write clean code, then analyse complexity.

This is the Microsoft interview style — process and communication matter as much as the solution.

After the coding problem, they asked about two of my projects.`,
      },
      {
        title: "Round 3 — Technical Interview 2",
        content: `Two more problems:
1. Implement a queue using two stacks
2. Given a string with brackets, check if it is valid (balanced parentheses — stack solution)

After each solution: "Is there a way to do this with less memory? What if the input is very large?"

They pushed me to think about edge cases and optimisations. This is not just about getting the answer — it is about demonstrating engineering thinking.`,
      },
      {
        title: "Round 4 — Technical Interview 3 (System Design)",
        content: `Introductory system design for an intern-level candidate.

Design a simple cloud file storage service (think Google Drive at a very basic level):
- Core entities: users, files, folders
- Key operations: upload, download, share, delete
- Storage: how would you store large files?
- Database: what schema would you use?

They were not expecting a production-grade answer. They wanted to see if I could break a problem into components and reason about trade-offs.`,
      },
    ],
    result_note: "Selected for the SWE Intern role. Microsoft's interview process focuses heavily on how you think, not just what you know.",
  },

  "msft-2": {
    company: "Microsoft",
    companyId: "13",
    role: "Software Engineer",
    batch: "2024",
    package: "40 LPA",
    difficulty: "Hard",
    result: "Selected",
    interviewDate: "January 2024",
    preparationDuration: "6 months",
    rounds: [
      {
        title: "Round 1 — Online Assessment",
        content: `Three medium-hard DSA problems with a strict time limit.

1. Graph problem: find all nodes reachable from a source node within k steps (BFS with depth tracking)
2. Tree problem: serialize and deserialize a binary tree
3. String problem: minimum window substring containing all characters of a pattern

I solved problems 1 and 2 fully and got partial credit on problem 3.`,
      },
      {
        title: "Round 2 — Technical Interview 1",
        content: `DSA: implement a trie data structure — insert a word, search for a word, and find all words with a given prefix.

Full working code required. The interviewer watched as I coded and asked clarifying questions throughout.

After the implementation: what is the time and space complexity of each operation? How would you modify the trie to support autocomplete?`,
      },
      {
        title: "Round 3 — Technical Interview 2 (System Design)",
        content: `Design Twitter's trending topics feature.

Components I covered:
- A tweet ingestion pipeline
- A real-time counting service (sliding window counter)
- A storage layer (Redis for fast counts, PostgreSQL for persistence)
- A ranking algorithm (by tweet velocity, not just total count)
- An API layer for clients

They asked about consistency vs availability trade-offs, how to handle a sudden spike in tweets about a breaking news event, and how to prevent a single user from gaming the trending algorithm.

This was the most intellectually demanding 45 minutes of my campus placement experience.`,
      },
      {
        title: "Round 4 — Technical Interview 3",
        content: `One more DSA problem: design and implement an in-memory database supporting set, get, delete, and snapshot operations.

Then a deep project discussion: take your best project and explain how you would take it to a production environment with 100,000 users. What breaks first? How do you fix it?

This tests engineering maturity — knowing not just how to build something, but how to think about failure.`,
      },
      {
        title: "Round 5 — Hiring Manager Round",
        content: `Mostly behavioural and culture-fit focused.

- Why Microsoft? (Have a real answer — "good package" is not enough)
- Tell me about a time you had a technical disagreement with a teammate. How was it resolved?
- What kind of engineering problems excite you most?
- Where do you see yourself in 3 years — IC track or management track?

The hiring manager also gave me a brief overview of the team I would be joining and asked if I had questions. Always have thoughtful questions ready.`,
      },
    ],
    result_note: "Selected. Microsoft's process rewards clear communication and structured thinking as much as technical depth.",
  },

  // ════════════════════════════════════════════════════
  // Oracle
  // ════════════════════════════════════════════════════

  "ora-1": {
    company: "Oracle",
    companyId: "14",
    role: "Applications Engineer",
    batch: "2024",
    package: "10 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "October 2024",
    preparationDuration: "3 months",
    rounds: [
      {
        title: "Round 1 — Online Assessment",
        content: `Aptitude and a technical section covering Java, SQL, and DBMS concepts.

Java questions: output prediction from code with generics, exceptions, and collections.
SQL: query writing — complex joins, subqueries, aggregate functions.
DBMS: normalization, indexing, transaction isolation levels.

Oracle is a database company — SQL and DBMS are tested more seriously here than at most other campus recruiters.`,
      },
      {
        title: "Round 2 — Technical Interview 1",
        content: `DBMS and SQL were the main focus.

SQL questions:
- Find the nth highest salary without using LIMIT or TOP (subquery approach)
- Write a query using window functions (RANK, ROW_NUMBER)
- What is a covering index?

Normalization:
- Explain 2NF and 3NF with examples
- What is BCNF? When does a relation in 3NF fail BCNF?

One DSA problem: given a binary tree, find the maximum path sum.`,
      },
      {
        title: "Round 3 — Technical Interview 2",
        content: `Java focused:
- Java Collections framework: when to use HashMap vs TreeMap vs LinkedHashMap
- What is multithreading? How do you prevent race conditions in Java?
- What is the difference between checked and unchecked exceptions?

One coding problem: implement a thread-safe stack using Java's synchronized keyword.`,
      },
      {
        title: "Round 4 — HR",
        content: `Why Oracle and why enterprise software?

Long-term career interest in database technology or cloud infrastructure.

Relocation flexibility (Oracle has offices in Bangalore, Hyderabad, and Chennai).`,
      },
    ],
    result_note: "Selected. SQL and DBMS depth is the real differentiator for Oracle. Go beyond the basics.",
  },

  "ora-2": {
    company: "Oracle",
    companyId: "14",
    role: "Cloud Engineer",
    batch: "2023",
    package: "12 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "November 2023",
    preparationDuration: "3.5 months",
    rounds: [
      {
        title: "Round 1 — Online Assessment",
        content: `Aptitude plus a technical section covering cloud concepts, networking, and databases.

Cloud basics: IaaS vs PaaS vs SaaS, what is a virtual machine vs a container, what is serverless computing.
Networking: IP addressing, subnetting, TCP/IP model.
Databases: SQL queries, indexing, basic query optimisation.`,
      },
      {
        title: "Round 2 — Technical Interview 1",
        content: `Oracle Cloud Infrastructure (OCI) fundamentals:
- What are the main services in OCI? (Compute, Object Storage, VCN, Database)
- What is a Virtual Cloud Network and how does it differ from a physical network?
- Difference between block storage and object storage

Linux basics:
- What is a process? How do you list running processes in Linux?
- What does chmod 755 mean?

SQL: write a query to find duplicate records in a table.`,
      },
      {
        title: "Round 3 — Technical Interview 2",
        content: `One coding problem: implement a simple LRU cache.

Networking deep dive:
- Explain the TCP three-way handshake
- What is NAT and why is it used?
- What is the difference between a hub, switch, and router?

Project discussion: how would you host my final year project on a cloud provider? Walk through the key infrastructure decisions.`,
      },
      {
        title: "Round 4 — HR",
        content: `Career interest in cloud computing specifically.

Why cloud infrastructure over software development?

Relocation and joining timeline.`,
      },
    ],
    result_note: "Selected. Reading about OCI specifically before the interview is worth doing — they appreciate when candidates know their product.",
  },

  // ════════════════════════════════════════════════════
  // Cisco
  // ════════════════════════════════════════════════════

  "cis-1": {
    company: "Cisco",
    companyId: "15",
    role: "Software Engineer",
    batch: "2024",
    package: "18 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "January 2024",
    preparationDuration: "4 months",
    rounds: [
      {
        title: "Round 1 — Coding Test",
        content: `Three problems with a networking flavour (Cisco leans toward networking even in software roles):

1. Graph problem: simulate a simple routing algorithm — find the shortest path between two routers given a network topology (Dijkstra's)
2. Standard graph BFS — find minimum hops to reach a target node
3. String processing: parse a log file format and extract error counts by type

All three solved. The networking context for the first problem was helpful context, not a barrier — the algorithm underneath is standard Dijkstra's.`,
      },
      {
        title: "Round 2 — Technical Interview 1",
        content: `Networking fundamentals — this is Cisco, so expect depth here:
- OSI model: name all 7 layers and explain what happens at each layer when you send an HTTP request
- TCP vs UDP: when would you choose UDP over TCP despite its unreliability? (Gaming, video streaming, DNS)
- Three-way handshake: explain each step
- OSPF basics: what type of routing protocol is it and how does it discover neighbours?
- Subnetting: given 192.168.1.0/24, divide it into 4 equal subnets

DSA:
- Two medium graph problems focusing on connectivity and path-finding`,
      },
      {
        title: "Round 3 — Technical Interview 2",
        content: `System design: design a simple load balancer.

Components covered: a DNS layer, multiple backend servers, a health-check mechanism, and different load balancing algorithms (round robin, least connections, IP hash).

They asked about what happens when a backend server goes down mid-request and how to handle session persistence.

One coding problem: implement a trie for autocomplete functionality.`,
      },
      {
        title: "Round 4 — HR",
        content: `Why Cisco specifically?

Interest in networking or infrastructure software.

Long-term career goals — are you more interested in the networking side or the software engineering side of Cisco's work?

Relocation flexibility.`,
      },
    ],
    result_note: "Selected. Networking fundamentals are non-negotiable at Cisco. Cover OSI, TCP/IP, routing protocols, and subnetting thoroughly.",
  },

  "cis-2": {
    company: "Cisco",
    companyId: "15",
    role: "Network Engineer",
    batch: "2023",
    package: "14 LPA",
    difficulty: "Medium",
    result: "Selected",
    interviewDate: "February 2023",
    preparationDuration: "4 months",
    rounds: [
      {
        title: "Round 1 — Online Assessment",
        content: `Heavy on networking fundamentals — more so than any other campus test I have seen.

Topics: routing protocols (OSPF, BGP basics), switching concepts (VLANs, Spanning Tree Protocol), subnetting calculations, Access Control Lists (ACLs), and basic network troubleshooting scenarios.

Small programming section: two easy Python problems.

If your networking knowledge is weak, this test will be very difficult. It is not a standard aptitude test.`,
      },
      {
        title: "Round 2 — Technical Interview 1",
        content: `Deep networking:

- OSPF vs BGP: what is the fundamental difference between an interior and exterior gateway protocol?
- Spanning Tree Protocol: what problem does it solve and how does it elect the root bridge?
- VLAN: what is a VLAN and why do enterprises use them to segment traffic?
- ACL: what is the difference between a standard and extended ACL in Cisco IOS?

Troubleshooting scenario: I was given a network diagram and asked to identify at which point a packet from Host A to Host B would be dropped, and why.

This was a genuinely difficult round for someone without networking certifications or coursework beyond CN basics.`,
      },
      {
        title: "Round 3 — Technical Interview 2",
        content: `Python for network automation — a growing area at Cisco.

- Write a Python script to parse a router configuration file and extract all interface IP addresses
- What is the Netmiko library and what is it used for?
- What is a REST API and how would you use it to configure a network device?

The interviewer said Cisco increasingly wants network engineers who can automate repetitive configuration tasks — pure CLI knowledge is no longer enough.`,
      },
      {
        title: "Round 4 — HR",
        content: `Long-term interest in networking as a career?

The interviewer asked whether I was interested in moving toward network automation and programmability or staying on the traditional network engineering path.

Relocation (Cisco has offices in Bangalore and Chennai primarily).`,
      },
    ],
    result_note: "Selected. This role requires genuine networking depth. CCNA-level knowledge as a minimum is strongly recommended before applying.",
  },
};

const DIFF_STYLE = {
  Easy:   { background: "#E3F8EE", color: "#1E8A4C", border: "1px solid #A8E4C4" },
  Medium: { background: "#FFF8E1", color: "#B86A00", border: "1px solid #FFE082" },
  Hard:   { background: "#FEF0EE", color: "#C0392B", border: "1px solid #F0C0BB" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ExperienceDetails() {
  const { experienceId } = useParams();
  const navigate         = useNavigate();

  const exp = DETAILS[experienceId];

  // ── Not found ──
  if (!exp) {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <button style={s.backBtn} onClick={() => navigate("/companies")}>
            ← Back to Companies
          </button>
          <div style={s.notFound}>
            <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔍</p>
            <h2 style={{ color: "#24213A", marginBottom: "0.5rem" }}>Experience not found</h2>
            <p style={{ color: "#857FA8" }}>
              This experience could not be found. It may have been removed or the link
              may be incorrect.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* ── Back link ─────────────────────────────────── */}
        <button
          style={s.backBtn}
          onClick={() => navigate(`/companies/${exp.companyId}`)}
        >
          ← Back to {exp.company} Experiences
        </button>

        {/* ── Header card ───────────────────────────────── */}
        <div style={s.headerCard}>
          <div style={s.headerTop}>
            <div>
              <p style={s.companyLabel}>{exp.company}</p>
              <h1 style={s.title}>{exp.role}</h1>
            </div>
            {exp.difficulty && (
              <span style={{ ...s.badge, ...(DIFF_STYLE[exp.difficulty] ?? {}) }}>
                {exp.difficulty}
              </span>
            )}
          </div>

          {/* Metadata chips */}
          <div style={s.metaRow}>
            {exp.batch              && <span style={s.chip}>🎓 Batch {exp.batch}</span>}
            {exp.package            && <span style={s.chip}>💰 {exp.package}</span>}
            {exp.result             && <span style={{ ...s.chip, ...s.chipGreen }}>✅ {exp.result}</span>}
            {exp.interviewDate      && <span style={s.chip}>📅 {exp.interviewDate}</span>}
            {exp.preparationDuration && <span style={s.chip}>⏱ Prep: {exp.preparationDuration}</span>}
          </div>
        </div>

        {/* ── Interview Experience section ──────────────── */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Interview Experience</h2>

          <div style={s.roundsList}>
            {exp.rounds.map((round, i) => (
              <div key={i} style={s.roundCard}>
                <div style={s.roundHeader}>
                  <div style={s.roundNum}>{i + 1}</div>
                  <h3 style={s.roundTitle}>{round.title}</h3>
                </div>
                <div style={s.roundBody}>{round.content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Result note ───────────────────────────────── */}
        {exp.result_note && (
          <div style={s.resultBox}>
            <h3 style={s.resultTitle}>📌 Result</h3>
            <p style={s.resultText}>{exp.result_note}</p>
          </div>
        )}

        {/* ── Bottom back button ────────────────────────── */}
        <button
          style={s.backBtnBottom}
          onMouseEnter={e => { e.currentTarget.style.background = "#6847E8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#7C5CFC"; e.currentTarget.style.transform = "translateY(0)"; }}
          onClick={() => navigate(`/companies/${exp.companyId}`)}
        >
          ← Back to {exp.company} Experiences
        </button>

      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page:         { minHeight: "100vh", background: "#F8F7FF", padding: "2rem 1rem" },
  container:    { maxWidth: "800px", margin: "0 auto" },
  backBtn:      { display: "inline-block", marginBottom: "1.5rem", background: "none", border: "none", color: "#7C5CFC", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", padding: 0 },
  notFound:     { textAlign: "center", padding: "4rem 2rem", background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E2DDF2" },
  headerCard:   { background: "#FFFFFF", border: "1px solid #E2DDF2", borderRadius: "20px", padding: "2rem", boxShadow: "0 2px 10px rgba(36,33,58,0.07), 0 4px 18px rgba(36,33,58,0.05)", marginBottom: "1.75rem" },
  headerTop:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" },
  companyLabel: { fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", color: "#7C5CFC", textTransform: "uppercase", marginBottom: "0.35rem" },
  title:        { fontSize: "1.85rem", fontWeight: 800, color: "#24213A", letterSpacing: "-0.03em", lineHeight: 1.12 },
  badge:        { display: "inline-block", padding: "0.28rem 0.9rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap", alignSelf: "flex-start" },
  metaRow:      { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  chip:         { display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "#F4F2FC", border: "1px solid #E2DDF2", borderRadius: "8px", padding: "0.26rem 0.72rem", fontSize: "0.82rem", color: "#857FA8", fontWeight: 600 },
  chipGreen:    { background: "#E3F8EE", border: "1px solid #A8E4C4", color: "#1E8A4C" },
  section:      { marginBottom: "1.75rem" },
  sectionTitle: { fontSize: "1.1rem", fontWeight: 800, color: "#24213A", marginBottom: "1.1rem", paddingBottom: "0.6rem", borderBottom: "2px solid #E2DDF2" },
  roundsList:   { display: "flex", flexDirection: "column", gap: "1rem" },
  roundCard:    { background: "#FFFFFF", border: "1px solid #E2DDF2", borderRadius: "14px", padding: "1.4rem 1.6rem", boxShadow: "0 1px 4px rgba(36,33,58,0.06)" },
  roundHeader:  { display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.85rem" },
  roundNum:     { width: "30px", height: "30px", background: "#7C5CFC", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800, flexShrink: 0 },
  roundTitle:   { fontSize: "1rem", fontWeight: 700, color: "#24213A" },
  roundBody:    { fontSize: "0.94rem", color: "#4D4960", lineHeight: 1.9, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  resultBox:    { background: "#E3F8EE", border: "1px solid #A8E4C4", borderRadius: "14px", padding: "1.25rem 1.5rem", marginBottom: "2rem" },
  resultTitle:  { fontSize: "0.97rem", fontWeight: 800, color: "#1A6B3A", marginBottom: "0.5rem" },
  resultText:   { fontSize: "0.93rem", color: "#1E7040", lineHeight: 1.75 },
  backBtnBottom: { background: "#7C5CFC", color: "#fff", border: "none", borderRadius: "13px", padding: "0.7rem 1.6rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", transition: "background 0.18s, transform 0.15s", boxShadow: "0 4px 14px rgba(124,92,252,0.28)" },
};
