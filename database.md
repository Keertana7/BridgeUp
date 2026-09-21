# BridgeUp Database

BridgeUp uses **Supabase PostgreSQL** as the main database.

## Database Tables

| Table | Purpose |
|---|---|
| `profiles` | Stores user profile information |
| `companies` | Stores company information |
| `experiences` | Stores complete interview experiences |
| `questions` | Stores questions extracted from experiences |
| `advice` | Stores advice, mistakes and important points from experiences |
| `resources` | Stores learning resources and useful links |
| `documents` | Stores document/PDF metadata for ingestion |
| `experience_chunks` | Stores text chunks used for RAG |

## Main Relationships

```text
profiles
   │
   └── experiences

companies
   │
   └── experiences
          │
          ├── questions
          └── advice

documents
   │
   └── experience_chunks

```

# Authentication

Authentication is handled using Supabase Auth.

- Users authenticate through Supabase Auth.
- Application profile information is stored in **profiles**.
- Backend uses the authenticated user's identity when required.


# Storage Buckets

Supabase Storage contains:

**resumes/**
**experience-documents/**
**learning-materials/**


# RAG / AI

PostgreSQL uses the pgvector extension.

**experience_chunks** will contain chunks extracted from interview experiences/documents and will later be used for semantic search and RAG.

Embeddings will be added as part of the ingestion/RAG pipeline.


# Data Sources

Interview experiences can come from:

1. Google Form submissions
2. Placement department PDFs/documents

The backend ingestion pipeline will process these sources and store the required information in PostgreSQL.


# Security

Row Level Security (RLS) is enabled on the application tables.

Database access should be handled through the backend/Supabase security policies rather than exposing unrestricted database access to users.


# Important

The database schema in Supabase is the source of truth.

Before adding or changing columns/tables, coordinate with the database owner.