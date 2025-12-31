---
Title: Synapse System Overview
Version: v1.0 (Pre-Launch)
Status: System Architecture Overview
Visibility: Private
Last Updated: January 2026
---

# Synapse System Overview

## 1. What is Synapse

Synapse is an AI-powered medical education platform designed for medical students and healthcare professionals. The system enables users to upload medical lectures and study materials, then interact with an AI tutor to understand concepts, generate practice questions, create flashcards, and produce structured summaries. The platform prioritizes conceptual understanding by providing contextual AI assistance adapted to the user's academic stage and learning goals. All interactions are private to the user, with no public sharing or collaboration features at launch.

---

## 2. System Boundaries

### Frontend Responsibilities

The frontend application handles all user interface interactions and client-side rendering. It manages user authentication flows, displays file libraries, renders document pages, provides chat interfaces for AI tutoring, and presents generated content such as summaries, multiple-choice questions, and flashcards. The frontend polls backend services to check the status of file processing and content generation jobs. It does not perform any business logic validation, file processing, or AI model interactions.

### Backend Responsibilities

The backend manages all business logic, data validation, and external service integrations. It handles user authentication and authorization, processes uploaded files through rendering pipelines, orchestrates AI model interactions for tutoring and content generation, manages background job queues for asynchronous tasks, and enforces data access controls through row-level security policies. The backend never trusts client-side validation and performs all security checks server-side.

---

## 3. High-Level Architecture

The Synapse system consists of six primary components that work together to deliver the platform functionality.

**Client Application**: A browser-based React single-page application that provides the user interface. Users interact with the client to upload files, view content, chat with the AI tutor, and consume generated study materials. The client communicates with the backend via RESTful API calls.

**API Layer**: An Express-based backend service that receives and processes all client requests. The API layer validates user permissions, coordinates file processing workflows, manages AI model interactions, and maintains job queues for asynchronous operations. It serves as the single point of integration between the client and all backend services.

**Storage Layer**: Supabase provides both relational database storage for user data, file metadata, and generated content, as well as object storage for uploaded files and processed document images. All data access is governed by row-level security policies that ensure users can only access their own data.

**AI Providers**: External AI services provide large language model capabilities for tutoring interactions and content generation. The system integrates with external AI providers to handle tasks such as conversational tutoring, summary generation, question creation, and flashcard production. The backend orchestrates these interactions and manages context passing.

**Background Workers**: Asynchronous job processing services handle time-intensive operations such as file rendering, AI content generation, and notification delivery. These workers operate independently of user requests, allowing the system to process large files and complex AI tasks without blocking the user interface.

**Notifications System**: A service that generates and delivers user notifications for events such as completed file processing, finished content generation, and system announcements. Notifications are stored in the database and retrieved by the client on demand.

---

## 4. Core User Flows (High Level)

### Signup and Onboarding

New users begin by creating an account through email and password registration, followed by email verification via one-time password. After verification, users complete an onboarding flow that collects their academic stage, field of study, country, university, and learning preferences. This information personalizes the AI tutor's responses and content generation to match the user's educational context.

### File Upload and Processing

Users upload medical lecture files, notes, or exam materials through the library interface. The system accepts PDF, PowerPoint, and image formats. Upon upload, files are queued for processing, which involves rendering document pages into images and extracting text content. Users can view files while processing continues in the background. Once processing completes, files become available for AI interactions and content generation.

### AI Tutoring Interaction

Users can interact with the AI tutor in two contexts. Standalone tutoring provides general medical education assistance without file context. File-aware tutoring allows users to ask questions about specific pages of uploaded documents, with the AI tutor receiving both the user's question and the relevant document context. All tutoring conversations are saved and can be resumed later.

### Content Generation

Users generate study materials by selecting files and specifying parameters such as academic stage, difficulty level, or content goals. The system creates summaries, multiple-choice question decks, or flashcard decks based on the selected files. Generation occurs asynchronously, with the client polling for completion status. Once complete, users can view, study, and interact with the generated content.

---

## 5. Data Ownership & Security

All data within Synapse is user-scoped and private. Users own their uploaded files, generated content, tutoring conversations, and personal profile information. There are no public sharing features, collaboration tools, or community-accessible content at launch.

Data security is enforced at multiple layers. The backend API validates all requests and checks user permissions before processing. Database row-level security policies ensure that users can only query and modify their own data, even if API validation were to fail. The frontend application never performs authorization checks; it only displays data that the backend has already verified the user can access.

Authentication is handled through Supabase Auth, which manages session tokens and password hashing. All API requests include authentication tokens that the backend validates before processing. File uploads and downloads are restricted to the file owner, with no cross-user access possible through the storage layer.

---

## 6. Known Limitations (At Launch)

The initial launch version of Synapse operates as a beta product with several known limitations that will be addressed in future iterations.

The system uses polling-based updates rather than real-time synchronization. This means that file processing status, content generation completion, and other asynchronous operations are checked at regular intervals rather than pushed immediately to the client. This approach is functional but may introduce slight delays in status updates.

There are no collaboration or sharing features. Users cannot share files, summaries, or study materials with other users. All content remains private to the individual user account.

The platform is designed primarily for desktop use. Mobile and tablet interfaces have not been optimized, and some features may not function as intended on smaller screens or touch devices.

Offline functionality is not available. The application requires an active internet connection to function, and no data is cached locally for offline access.

Several modules are marked as placeholders and will be released after the beta stabilization phase. These include oral exam preparation, OSCE practice, study planning, and analytics features. These modules are actively under development and will be introduced incrementally after core system stabilization.

Error handling in the initial version relies primarily on browser alerts rather than integrated notification systems. This will be improved in future updates.

---

## 7. Reference Documents

For detailed technical implementation information, refer to the following architecture blueprints:

- **Synapse Backend Blueprint v1.0**: Complete technical documentation of backend services, API endpoints, database schema, AI integration patterns, and background job processing.

- **Synapse Frontend Blueprint v1.0**: Complete technical documentation of frontend application structure, component architecture, routing, state management, and user interface implementation.

These blueprints contain code-accurate implementation details, file structures, and technical specifications. They are intended for engineering teams and should not be shared outside of technical review contexts.

---

**Document Status**: This overview represents the system architecture as of the pre-launch freeze. Architecture changes after launch will be documented in subsequent versions.

