#!/usr/bin/env python3
"""
End-to-End Multi-Turn Citizen Conversation Simulation.

Simulates 5 distinct realistic Indian citizens with authentic profiles/facts:
1. Rameshwar Sharma (Farmer, 48, Varanasi, UP, Income ₹85,000, OBC, Landowner)
2. Sunita Bai (Rural Artisan & Expecting Mother, 29, Sehore, MP, Income ₹65,000, SC)
3. Rahul Deshmukh (Engineering Student, 20, Pune, Maharashtra, Income ₹1,40,000, General/EWS)
4. Lakshmi Narayanan (Elderly Widow, 70, Madurai, Tamil Nadu, Income ₹35,000, OBC)
5. Jagdish Gurjar (Artisan/Carpenter, 35, Jaipur, Rajasthan, Income ₹95,000, OBC)

Each persona has:
- User registration (`POST /auth/register`)
- Sovereign JWT Login (`POST /auth/login`)
- Profile facts registration (`POST /users/me/profile`)
- Chat session initialization (`POST /chat/sessions`)
- 6 human-like conversational turns (total 30 messages across all personas)
- Natural human reference patterns ("tell me second one for example", "for that one", "what about the first scheme on your list?")
"""

import json
import os
import sys
import time
from datetime import datetime

# Add backend directory to sys.path and load backend/.env
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))
os.environ["DEV_MODE"] = "true"

import app.main
from app.core.config import settings
settings.DEV_MODE = True
from fastapi.testclient import TestClient

PERSONAS = [
    {
        "id": "persona_1_farmer_up",
        "name": "Rameshwar Sharma",
        "gender": "male",
        "dob": "1978-04-12",
        "state": "Uttar Pradesh",
        "district": "Varanasi",
        "occupation": "farmer",
        "annual_income": 85000,
        "caste_category": "OBC",
        "has_land": True,
        "marital_status": "Married",
        "residence_area": "Rural",
        "session_title": "UP Farmer Crop & Input Support",
        "language_code": "en",
        "messages": [
            "Namaste! I am a small farmer in Varanasi with around 1.5 acres of land. Seeds and fertilizer are getting very expensive this season. What government schemes can help me with farming money?",
            "To save time, tell me the second one for example. How much benefit do they give and what does it cover?",
            "What papers do I need to submit for that one? I have my Khasra Khatauni land paper and Aadhaar card ready.",
            "My younger brother also works with me in the same field, can he also apply separately or only one person per land record?",
            "And what about the first scheme on your list earlier? Can I receive benefits from both of these schemes at the same time or do I have to choose only one?",
            "Where should I go in Varanasi or my block tehsil if I want someone at Common Service Center to help me fill this?",
        ],
    },
    {
        "id": "persona_2_artisan_mother_mp",
        "name": "Sunita Bai",
        "gender": "female",
        "dob": "1997-08-14",
        "state": "Madhya Pradesh",
        "district": "Sehore",
        "occupation": "artisan",
        "annual_income": 65000,
        "caste_category": "SC",
        "has_land": False,
        "marital_status": "Married",
        "residence_area": "Rural",
        "session_title": "MP Women & Expecting Mother Welfare",
        "language_code": "en",
        "messages": [
            "Hello, I live in a village in Sehore, MP. I make bamboo handicraft baskets at home and I am also expecting a baby in a few months. Can you tell me what government welfare schemes are there for women like me?",
            "Tell me about the first one first. Does the MP government send money directly to the woman's bank account every month?",
            "I do not know how to use internet on computer. Can I just go to my Anganwadi didi or Gram Panchayat camp to submit the form?",
            "What about the second one you listed for pregnant mothers? How much total rupees do they give in that?",
            "My husband works as daily wage laborer. Do we need any special certificate for his job or is my SC certificate enough?",
            "Does my bank account need to have Aadhaar DBT link active, or can money come to any savings account?",
        ],
    },
    {
        "id": "persona_3_student_mh",
        "name": "Rahul Deshmukh",
        "gender": "male",
        "dob": "2005-10-20",
        "state": "Maharashtra",
        "district": "Pune",
        "occupation": "student",
        "annual_income": 140000,
        "caste_category": "General",
        "has_land": False,
        "marital_status": "Single",
        "residence_area": "Urban",
        "session_title": "Maharashtra Engineering Scholarship & Fee Concession",
        "language_code": "en",
        "messages": [
            "Hi, I am a 2nd year engineering student in Pune, Maharashtra. My family's total annual income is 1.4 Lakh. College fees are really high. Are there any government scholarships or tuition fee concessions available for me?",
            "To save time, tell me about the second scholarship you mentioned. How much of my tuition fee will they waive?",
            "What marks or 12th percentage do I need to keep getting this fee waiver every year?",
            "We have an EWS and Income certificate made from Pune Tahsildar office. Is that sufficient proof for that scheme?",
            "What about the third one for hostel maintenance on your initial list? Can I apply for both together or does the portal allow only one?",
            "Which exact portal do I need to register on and what is the typical deadline for this academic year?",
        ],
    },
    {
        "id": "persona_4_elderly_widow_tn",
        "name": "Lakshmi Narayanan",
        "gender": "female",
        "dob": "1956-03-08",
        "state": "Tamil Nadu",
        "district": "Madurai",
        "occupation": "retired",
        "annual_income": 35000,
        "caste_category": "OBC",
        "has_land": False,
        "marital_status": "Widowed",
        "residence_area": "Rural",
        "session_title": "Senior Citizen Pension & Free Medical Treatment",
        "language_code": "en",
        "messages": [
            "Vanakkam. I am a 70 year old widow living alone near Madurai. I have no fixed income and my knees and eyes need treatment. Are there any government pensions and free hospital schemes for elders like me?",
            "Explain the first pension scheme to me simply. How much money will I receive every month?",
            "I find it very hard to walk to the bank branch. Can the postman bring the pension to my house?",
            "Now tell me about the second one you said for hospital treatment. Does it cover eye cataract surgery and medicine costs?",
            "Can I go to private hospitals in Madurai or only government Rajaji hospital?",
            "Where in Madurai can an old woman like me get this medical card made without standing in long lines?",
        ],
    },
    {
        "id": "persona_5_carpenter_rj",
        "name": "Jagdish Gurjar",
        "gender": "male",
        "dob": "1990-11-15",
        "state": "Rajasthan",
        "district": "Jaipur",
        "occupation": "artisan",
        "annual_income": 95000,
        "caste_category": "OBC",
        "has_land": False,
        "marital_status": "Married",
        "residence_area": "Urban",
        "session_title": "Artisan Toolkit Grant & Collateral-Free Mudra Loan",
        "language_code": "en",
        "messages": [
            "Ram Ram sa! I work as a traditional carpenter making wooden doors and furniture in Jaipur. I need financial help to buy modern power tools and expand my workshop. What schemes are there for craftsmen and artisans?",
            "Tell me about the first scheme you mentioned. Does it provide free training and money for toolkits?",
            "Is the 15,000 rupees for tools a gift or loan that I have to repay back to the government?",
            "And what about the second scheme on your list, how is Mudra loan different if I just want raw material cash?",
            "I don't have any property papers to show the bank manager. Will they demand a guarantor for either of these?",
            "Which website or office in Jaipur should I visit with my Aadhaar card to apply for the artisan certificate?",
        ],
    },
]


def run_e2e_simulation():
    print("=" * 80)
    print("🏛️ REAL-WORLD CITIZEN WELFARE CHAT SIMULATION: 5 PERSONAS, 30 CONVERSATION TURNS")
    print("=" * 80)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Configured LLM Provider: {settings.LLM_PROVIDER}")
    print(f"Configured Groq Model: {settings.GROQ_MODEL}")
    print(f"Total Personas: {len(PERSONAS)}")
    print(f"Total Citizen Messages: {sum(len(p['messages']) for p in PERSONAS)}")
    print("=" * 80)

    results_report = []
    total_turns_completed = 0
    total_start_time = time.perf_counter()

    with TestClient(app.main.app) as client:
        for p_idx, persona in enumerate(PERSONAS, start=1):
            ts = int(time.time() * 1000) % 10000000
            email = f"citizen.{persona['id']}.{ts}@gov.in"
            phone = f"+9198{p_idx:02d}{ts % 1000000:06d}"
            password = "CitizenSecret123!@"

            print(f"\n{'#' * 80}")
            print(f"👤 [PERSONA {p_idx}/5] {persona['name']} ({persona['state']}, {persona['occupation'].title()})")
            print(f"   Facts: Age={datetime.now().year - int(persona['dob'][:4])} | Gender={persona['gender'].title()} | Income=₹{persona['annual_income']:,} | Caste={persona['caste_category']} | Land={persona['has_land']}")
            print(f"{'#' * 80}")

            # 1. Register Account
            print(f"   [Step 1] Registering citizen account: {email}...")
            reg_res = client.post(
                "/auth/register",
                json={"email": email, "phone": phone, "password": password},
            )
            assert reg_res.status_code == 201, f"Registration failed for {email}: {reg_res.text}"
            reg_data = reg_res.json()
            user_id = reg_data.get("id")
            citizen_uid = reg_data.get("citizen_uid")
            print(f"   ✅ Registered with Citizen UID: {citizen_uid} (User ID: {user_id})")

            # 2. Login
            print(f"   [Step 2] Authenticating via Sovereign JWT...")
            login_res = client.post(
                "/auth/login",
                json={"email": email, "password": password},
            )
            assert login_res.status_code == 200, f"Login failed for {email}: {login_res.text}"
            access_token = login_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
            print(f"   ✅ Authenticated with Bearer Token")

            # 3. Complete Profile & Facts
            print(f"   [Step 3] Storing Verified Demographic Facts in PostgreSQL...")
            profile_payload = {
                "full_name": persona["name"],
                "date_of_birth": persona["dob"],
                "gender": persona["gender"],
                "state": persona["state"],
                "district": persona["district"],
                "annual_income": persona["annual_income"],
                "occupation": persona["occupation"],
                "caste_category": persona["caste_category"],
                "has_land": persona["has_land"],
                "marital_status": persona["marital_status"],
                "residence_area": persona["residence_area"],
            }
            prof_res = client.post("/users/me/profile", json=profile_payload, headers=headers)
            assert prof_res.status_code in (200, 201), f"Profile update failed: {prof_res.text}"
            print(f"   ✅ Citizen Profile synchronized with Fact Store")

            # 4. Start Chat Session
            print(f"   [Step 4] Starting consultation session: '{persona['session_title']}'...")
            sess_res = client.post(
                "/chat/sessions",
                json={"title": persona["session_title"], "language_code": persona["language_code"]},
                headers=headers,
            )
            assert sess_res.status_code == 201, f"Session creation failed: {sess_res.text}"
            session_id = sess_res.json()["id"]
            print(f"   ✅ Active Session ID: {session_id}")

            persona_transcript = {
                "persona": persona["name"],
                "state": persona["state"],
                "occupation": persona["occupation"],
                "turns": [],
            }

            # 5. Multi-Turn Conversation (6 turns per persona)
            for m_idx, message_content in enumerate(persona["messages"], start=1):
                total_turns_completed += 1
                print(f"\n   💬 [Turn {m_idx}/6 | Overall #{total_turns_completed}/30]")
                print(f"   🧑 CITIZEN: \"{message_content}\"")

                t0 = time.perf_counter()
                msg_res = client.post(
                    f"/chat/sessions/{session_id}/messages",
                    json={"content": message_content, "language_code": persona["language_code"]},
                    headers=headers,
                )
                latency_s = time.perf_counter() - t0

                assert msg_res.status_code == 200, f"Chat message turn {m_idx} failed: {msg_res.text}"
                msg_data = msg_res.json()
                response_text = msg_data.get("content", "")
                citations = msg_data.get("citations", [])
                intent = msg_data.get("intent", "UNKNOWN")

                print(f"   🤖 ADVISOR ({latency_s:.2f}s | Intent: {intent} | Citations: {len(citations)}):")
                # Format response indented
                for line in response_text.strip().split("\n"):
                    print(f"      {line}")

                persona_transcript["turns"].append({
                    "turn_number": m_idx,
                    "overall_turn": total_turns_completed,
                    "citizen": message_content,
                    "advisor": response_text,
                    "citations": citations,
                    "latency_seconds": round(latency_s, 2),
                })

                # Polite breather between turns to respect API token rate limits
                time.sleep(3.0)

            results_report.append(persona_transcript)

    total_duration = time.perf_counter() - total_start_time
    print(f"\n{'=' * 80}")
    print(f"🎉 SIMULATION COMPLETED SUCCESSFULLY!")
    print(f"   Total Personas Tested: {len(PERSONAS)}")
    print(f"   Total Messages Exchanged: {total_turns_completed * 2} (30 Citizen + 30 AI Advisor)")
    print(f"   Total Execution Time: {total_duration:.2f}s (Average {total_duration / total_turns_completed:.2f}s/turn)")
    print(f"{'=' * 80}")

    # Save complete transcript to disk
    output_path = os.path.join(backend_dir, "test_conversations_transcript.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results_report, f, indent=2, ensure_ascii=False)
    print(f"Saved complete JSON transcript to: {output_path}\n")

    return results_report


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run citizen conversation simulation.")
    parser.add_argument("--provider", choices=["groq", "gemini", "agy"], default=None, help="LLM Provider override")
    args = parser.parse_args()
    if args.provider:
        settings.LLM_PROVIDER = args.provider
    run_e2e_simulation()
