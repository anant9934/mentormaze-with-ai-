#!/usr/bin/env python3
"""
MentorMaze-2B: Schema Normalization & Task Construction Engine
Transforms diverse raw datasets into canonical instruction-tuning task pairs.
Specifically converts raw Job Descriptions into verified structured mentoring tasks.
Brand: AI Tathastu / MentorMaze (https://mentormaze.aitathastu.com)
"""

import sys
import json
from pathlib import Path

PROCESSED_DIR = Path("training/datasets/processed")

def normalize_naukri_record(rec: dict) -> dict:
    """Transform raw JD into a high-value skill gap & roadmap mentoring task"""
    title = rec.get("title", "Software Engineer")
    company = rec.get("company", "Tech Company")
    skills = rec.get("skills", [])
    exp = rec.get("experience", "0-2 Yrs")
    loc = rec.get("location", "Bengaluru")

    skill_str = ", ".join(skills[:8]) if skills else "Core Engineering Fundamentals"
    mandatory_skills = skills[:3] if skills else ["Programming", "DSA"]
    desirable_skills = skills[3:7] if len(skills) > 3 else ["Cloud Platforms"]

    system_prompt = (
        "You are MentorMaze, an adaptive technical and career mentor by AI Tathastu. "
        "Analyze job descriptions with zero-fabrication: distinguish mandatory from desirable skills, "
        "diagnose knowledge gaps, and formulate concrete learning roadmaps without inventing unverified facts."
    )

    user_prompt = (
        f"I am preparing to apply for the role of **{title}** at **{company}** ({loc}, Experience: {exp}).\n"
        f"Key skills mentioned in the job post: {skill_str}.\n\n"
        f"Can you break down what is strictly mandatory vs desirable, and recommend an engineering roadmap?"
    )

    assistant_response = (
        f"### 📋 Career Architecture: {title} Competency Breakdown\n\n"
        f"**Target Role**: {title} · **Experience Tier**: {exp} · **Location**: {loc}\n\n"
        f"#### 1. Mandatory Core Competencies (Must-Have for Screening)\n"
        + "".join([f"- **{s}**: Production fluency required for technical rounds.\n" for s in mandatory_skills])
        + f"\n#### 2. Desirable & Secondary Skills (Competitive Advantage)\n"
        + "".join([f"- **{s}**: Differentiates candidates in system architecture discussions.\n" for s in desirable_skills])
        + f"\n#### 3. Recommended 6-Week Actionable Roadmap\n"
        f"- **Weeks 1–2**: Deep-dive into {mandatory_skills[0] if mandatory_skills else 'core algorithms'} and time/space complexity analysis.\n"
        f"- **Weeks 3–4**: Build a portfolio milestone featuring real-world integration of {skill_str[:40]}.\n"
        f"- **Weeks 5–6**: Mock interviews using the STAR framework; audit resume bullets using the Google XYZ formula.\n\n"
        f"> 🛡️ *Note: MentorMaze enforces zero-fabrication. Do not claim skills on your resume that you cannot defend live in a coding round.*"
    )

    return {
        "domain": "career",
        "subdomain": "job_description_analysis",
        "system_prompt": system_prompt,
        "turns": [
            {"role": "user", "content": user_prompt},
            {"role": "assistant", "content": assistant_response}
        ],
        "metadata": {
            "source_id": "ds-naukri-jds",
            "task_type": "jd_skill_gap_roadmap",
            "job_id": rec.get("record_id"),
            "license": "CC-BY 4.0"
        }
    }

def normalize_socratic_record(rec: dict) -> dict:
    system_prompt = (
        "You are MentorMaze, an adaptive technical and career mentor by AI Tathastu. "
        "Apply Socratic progressive scaffolding: guide student thinking through invariants and targeted questions. "
        "Never dump a full code solution upon initial student struggle."
    )
    return {
        "domain": "socratic",
        "subdomain": "active_tutoring",
        "system_prompt": system_prompt,
        "turns": rec.get("turns", []),
        "metadata": {
            "source_id": "ds-mentormaze-socratic",
            "task_type": "socratic_scaffolding",
            "topic": rec.get("topic"),
            "license": "Proprietary Commercial"
        }
    }

def normalize_star_record(rec: dict) -> dict:
    system_prompt = (
        "You are MentorMaze, an elite technical and behavioral interview coach by AI Tathastu. "
        "Evaluate candidate behavioral responses strictly using the STAR framework (Situation, Task, Action, Result). "
        "Enforce zero-fabrication: ensure all claimed metrics can be defended."
    )
    user_prompt = (
        f"Please evaluate my answer to this interview question:\n"
        f"**Question**: \"{rec.get('question')}\"\n\n"
        f"**My Answer**: \"{rec.get('candidate_response')}\""
    )
    assistant_response = rec.get("coach_critique")
    return {
        "domain": "behavioral",
        "subdomain": "star_interview_coaching",
        "system_prompt": system_prompt,
        "turns": [
            {"role": "user", "content": user_prompt},
            {"role": "assistant", "content": assistant_response}
        ],
        "metadata": {
            "source_id": "ds-interview-star",
            "task_type": "behavioral_rubric_critique",
            "category": rec.get("category"),
            "license": "Proprietary Commercial"
        }
    }

def normalize_leveling_record(rec: dict) -> dict:
    system_prompt = (
        "You are MentorMaze, a principal engineering mentor by AI Tathastu. "
        "Calibrate engineering career progression, seniority expectations, and promotional criteria across SDE tiers."
    )
    return {
        "domain": "leveling",
        "subdomain": "engineering_progression",
        "system_prompt": system_prompt,
        "turns": [
            {"role": "user", "content": rec.get("coaching_prompt")},
            {"role": "assistant", "content": rec.get("mentor_response")}
        ],
        "metadata": {
            "source_id": "ds-progression-fyi",
            "task_type": "career_calibration",
            "level": rec.get("level"),
            "license": "CC-BY-SA 4.0"
        }
    }

def normalize_coding_record(rec: dict) -> dict:
    system_prompt = (
        "You are MentorMaze, a staff software engineer and algorithms mentor by AI Tathastu. "
        "Conduct rigorous code reviews, evaluate asymptotic time/space complexity, spot boundary traps, "
        "and provide optimized implementations with clear invariant explanations."
    )
    return {
        "domain": "technical",
        "subdomain": "code_review_and_dsa",
        "system_prompt": system_prompt,
        "turns": [
            {"role": "user", "content": rec.get("prompt")},
            {"role": "assistant", "content": rec.get("response")}
        ],
        "metadata": {
            "source_id": "ds-map-codefeedback",
            "task_type": "algorithmic_optimization",
            "title": rec.get("title"),
            "license": "Apache 2.0"
        }
    }

def main():
    print("=" * 70)
    print("MENTORMAZE SCHEMA NORMALIZATION & TASK SYNTHESIS")
    print("=" * 70)

    dispatch = {
        "dedup_naukri_jds.jsonl": normalize_naukri_record,
        "dedup_mentormaze_socratic_pedagogy.jsonl": normalize_socratic_record,
        "dedup_star_behavioral_coaching.jsonl": normalize_star_record,
        "dedup_progression_leveling.jsonl": normalize_leveling_record,
        "dedup_codefeedback_technical.jsonl": normalize_coding_record
    }

    total_normalized = 0
    for dedup_file in sorted(PROCESSED_DIR.glob("dedup_*.jsonl")):
        fn = dedup_file.name
        if fn not in dispatch:
            continue
        normalizer = dispatch[fn]
        out_file = PROCESSED_DIR / f"norm_{fn[6:]}"

        written = 0
        with open(dedup_file, "r", encoding="utf-8") as f_in, open(out_file, "w", encoding="utf-8") as f_out:
            for line in f_in:
                if not line.strip():
                    continue
                rec = json.loads(line)
                norm = normalizer(rec)
                f_out.write(json.dumps(norm, ensure_ascii=False) + "\n")
                written += 1
                total_normalized += 1

        print(f"[NORMALIZED] {fn} -> {out_file.name} ({written:,} tasks constructed)")

    print(f"\nTotal Canonical Tasks Constructed: {total_normalized:,}")
    print("=" * 70)

if __name__ == "__main__":
    main()

