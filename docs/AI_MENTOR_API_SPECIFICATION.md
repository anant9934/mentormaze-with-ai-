# AI Mentor API Specification

**System:** MentorMaze AI Mentor  
**Base URL:** `https://mentormaze.aitathastu.com/api/ai-mentor`  
**Authentication:** Cookie Session JWT or Bearer Token (`Authorization: Bearer <token>`)

---

## 1. Core Endpoints

### A. Turn Processing (Streaming & JSON)
- **Route**: `POST /api/ai-mentor`
- **Headers**:
  - `Content-Type: application/json`
  - `Accept: text/event-stream` (Optional for Server-Sent Events)
- **Request Body**:
  ```json
  {
    "studentUserId": "usr-student-1",
    "userMessage": "Explain Cache-Aside directly",
    "mode": "learn",
    "languagePreference": "en",
    "codeSnippet": "optional code text",
    "hintLevel": 0,
    "activeTopic": "distributed_systems"
  }
  ```
- **Response Body (200 OK)**:
  ```json
  {
    "success": true,
    "aiResponse": "Markdown technical explanation...",
    "voiceText": "Short speech summary...",
    "teachingStrategy": "conceptual_explanation",
    "topic": "distributed_systems",
    "difficulty": "intermediate",
    "hintLevel": 0,
    "studentUnderstandingSignal": "strong",
    "sources": [
      {
        "sourceTitle": "Distributed Caching",
        "collection": "technical",
        "publisher": "MentorMaze Review Board",
        "license": "Proprietary CC-BY-NC",
        "confidence": 0.85
      }
    ],
    "recommendedActions": [
      {
        "id": "act-1",
        "title": "Implement Cache-Aside wrapper in TypeScript",
        "category": "Implementation",
        "priority": "high"
      }
    ],
    "skillUpdates": [
      {
        "skillId": "relational_db_sql",
        "skillName": "SQL & Relational Modeling",
        "previousState": "developing",
        "newState": "demonstrated",
        "score": 8.4,
        "confidence": 0.88,
        "evidence": "Accurate Cache-Aside implementation"
      }
    ],
    "latencyMs": 0.41,
    "modelProvider": "tathastu-pedagogy-v1"
  }
  ```

---

### B. Student Context Profile
- **Route**: `GET /api/ai-mentor/context?userId=<id>`
- **Response**: Returns verified skills, identified knowledge gaps, recent mistakes, and active projects.

### C. Skill Graph Management
- **Route**: `GET /api/ai-mentor/skills?userId=<id>`: Returns student skill nodes and canonical taxonomy.
- **Route**: `POST /api/ai-mentor/skills`: Calibrates new evidence and updates mastery score.

### D. Structured Memory Management
- **Route**: `GET /api/ai-mentor/memory?userId=<id>`: List active memories.
- **Route**: `POST /api/ai-mentor/memory`: Store or update structured memory.
- **Route**: `DELETE /api/ai-mentor/memory?userId=<id>&memoryId=<id>`: Permanently remove a memory.

### E. Career & JD Intelligence
- **Route**: `GET /api/ai-mentor/career?q=<query>&action=roadmap`: Search JDs or generate 24-week roadmap.
- **Route**: `POST /api/ai-mentor/career`: Match resume against target JD using Google XYZ formula.

### F. Quality & Evaluation Benchmarks
- **Route**: `GET /api/ai-mentor/eval` & `POST /api/ai-mentor/eval`: Runs the holdout benchmark suite, returning technical accuracy, Socratic Quotient, and baseline deltas.

### G. Admin Control Center
- **Route**: `GET /api/admin/ai-mentor`: Returns multi-provider health, dataset licensing registry, benchmark history, and safety status.
