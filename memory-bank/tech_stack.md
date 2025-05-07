# Technical Stack Reference

## Frontend
- React (with Next.js for SSR and routing)
- TypeScript for type safety
- Tailwind CSS or Material UI for rapid, modern styling

## Backend
- Node.js with Express (API server)
- Python (for AI/ML microservices, if needed)
- RESTful API (optionally GraphQL for future extensibility)

## AI/ML
- Transcription: OpenAI Whisper API or AssemblyAI
- Summarization: OpenAI GPT-4 API or custom LLM
- Media Generation: FFmpeg (video/audio processing), audiogram libraries (e.g., Audiogram.js)

## Storage
- AWS S3 (uploads and generated assets)
- CDN (CloudFront or similar for fast asset delivery)

## Database
- PostgreSQL (hosted, e.g., AWS RDS or Supabase)

## Authentication
- Auth0 or Firebase Auth (OAuth, email/password)

## Payments
- Stripe (SaaS billing)

## Deployment
- Vercel (frontend and serverless functions)
- AWS (backend, storage, AI/ML microservices)
- Docker for containerization (optional, for backend/AI services)
- GitHub Actions (CI/CD)

## Integrations (Future)
- YouTube, Zoom, Dropbox, Google Drive

---
This stack is chosen for scalability, developer velocity, and best-in-class AI/ML integration. See implementation.yaml for how each technology is used in the build process. 