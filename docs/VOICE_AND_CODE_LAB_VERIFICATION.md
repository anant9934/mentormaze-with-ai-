# MentorMaze — Voice & Code Lab Verification Report

**Platform:** MentorMaze by AI Tathastu  
**Domain:** `https://mentormaze.aitathastu.com`  
**Document Code:** `MM-ENG-VOICE-CODE-08`  
**Frontend Modules:** `app/ai-mentor/page.tsx`, `lib/ai-mentor/code-mentor.ts`

---

## 1. Voice Interaction Architecture (Web Speech API)

To support accessible and multimodal learning for Indian engineering students, the AI Mentor interface includes a bidirectional voice interaction system supporting English, Hindi, and Hinglish.

### Voice Implementation Breakdown
1. **Speech Recognition (STT - Speech-to-Text)**:
   - Uses the browser-native `webkitSpeechRecognition` / `SpeechRecognition` API.
   - Dynamically sets `recognition.lang`:
     - English: `en-US` / `en-IN`
     - Hindi & Hinglish: `hi-IN`
   - Microphone state is reactively tracked with visual listening waves and auto-stops upon silence detection.
2. **Speech Synthesis (TTS - Text-to-Speech)**:
   - Uses `window.speechSynthesis`.
   - Cleans markdown, formatting artifacts, and URLs before synthesis:
     ```typescript
     const cleanSpeech = text
       .replace(/[*#_`~\[\]]/g, "")
       .replace(/https?:\/\/\S+/g, "")
       .replace(/\s+/g, " ")
       .trim();
     ```
   - Automatically prioritizes natural voices (Google Indian English, Samantha, or Natural voice profiles) when available in the operating system.
   - Includes a one-click mute/unmute control in the mentor header (`Volume2` / `VolumeX`).

---

## 2. Code Lab: Static Algorithmic Analysis

The Code Lab tab in `/ai-mentor` provides static code review and algorithmic optimization without requiring external compilation services:

### Detected Code Smells & Patterns
1. **Nested Linear Scan Trap ($O(N^2)$)**:
   - Identifies calls to `arr.includes(...)`, `arr.indexOf(...)`, or `arr.find(...)` inside iteration loops (`for`, `while`).
   - Advises replacing with an auxiliary `Set` or `Map` to reduce time complexity to $O(N)$ linear time.
2. **Unsorted Two-Pointers Bug**:
   - Identifies two-pointer loops operating over unsorted array inputs.
   - Explains how unsorted arrays violate the directional monotonicity invariant.
3. **Missing Boundary Edge Cases**:
   - Warns when functions omit null checks, empty array validations, or negative number handling.
4. **Asymptotic Complexity Calculator**:
   - Reports estimated worst-case time complexity (e.g. $O(N^2) \rightarrow O(N)$) and auxiliary space complexity.

---

## 3. Code Execution Sandbox: Security Policy & Reality Audit

### Pre-Audit Reality Inspection
In the pre-audit codebase, `CodeMentorService.executeInSandbox` returned a mock string claiming:
`"[MentorMaze Isolated Sandbox Container] Status: PASS. All test assertions succeeded. Executed within ephemeral container with network disabled, 512MB RAM cap..."`

### Audit Decision: Honest Offline Policy Enforced
Untrusted student code cannot be executed directly on the Next.js server runtime without risking Remote Code Execution (RCE), denial-of-service, or server crash. Running true sandboxing requires a separate microservice running gVisor, Firecracker microVMs, or Docker daemon containers.

Because no container sandbox daemon was configured on the local host, **the mock simulation was decommissioned**.

### Production Offline Policy Implementation:
In `lib/ai-mentor/code-mentor.ts`:
```typescript
const elapsed = Number((performance.now() - t0).toFixed(2));

return {
  success: false,
  stdout: "",
  stderr: "Execution unavailable: Isolated code execution container daemon is offline on host.",
  executionTimeMs: elapsed,
  memoryUsedKb: 0,
  isSandboxed: false,
  isolationNotice:
    "Isolated code execution sandbox container is currently offline on host. Direct execution of untrusted code on Next.js server is disabled for security.",
};
```

### Safety Principles Enforced:
1. **Zero Fake Executions**: The platform never tells a student that buggy code "passed all assertions" when it was never executed.
2. **Server Process Boundary**: Code submitted by students is never passed to Node.js `eval()` or `child_process.exec()`.
3. **Clear Student Guidance**: The UI guides students to review algorithms through static complexity analysis and test edge cases on official LeetCode / HackerRank sandboxes until the MentorMaze gVisor cluster daemon is deployed.

