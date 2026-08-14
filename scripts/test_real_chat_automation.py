import time
import requests
import json

BASE_URL = "http://localhost:8000"

def run_real_world_citizen_chat_journey():
    print("=" * 70)
    print("🤖 STARTING AUTOMATED REAL-WORLD CITIZEN JOURNEY & CHAT TEST")
    print("=" * 70)

    # 1. Register a realistic citizen
    unique_id = int(time.time())
    email = f"kavita.sharma.{unique_id}@example.gov.in"
    password = "CitizenPass123!@"
    phone = f"+9198765{unique_id % 100000:05d}"

    print(f"\n[STEP 1] Registering Citizen: Kavita Sharma ({email})")
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "phone": phone,
        "password": password
    })
    print(f"Registration HTTP Status: {reg_res.status_code}")
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    reg_data = reg_res.json()
    print(f"Assigned Citizen UID: {reg_data.get('citizen_uid')}")
    print(f"Assigned Household UID: {reg_data.get('household_uid')}")

    # 2. Login
    print(f"\n[STEP 2] Logging in to obtain sovereign bearer token...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    print(f"Login HTTP Status: {login_res.status_code}")
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 3. Complete Demographic Profile (College student in Indore, MP, OBC, Income 1.2L)
    print(f"\n[STEP 3] Populating Verified Demographic Profile...")
    profile_payload = {
        "full_name": "Kavita Sharma",
        "date_of_birth": "2006-03-15",
        "gender": "female",
        "state": "Madhya Pradesh",
        "district": "Indore",
        "annual_income": 120000,
        "occupation": "student",
        "caste_category": "OBC",
        "residence_area": "Urban",
        "marital_status": "Single",
        "has_land": False,
        "is_differently_abled": False
    }
    prof_res = requests.post(f"{BASE_URL}/users/me/profile", json=profile_payload, headers=headers)
    print(f"Profile Update HTTP Status: {prof_res.status_code}")
    assert prof_res.status_code in [200, 201], f"Profile update failed: {prof_res.text}"
    print("Profile successfully synchronized with Sovereign Fact Store.")

    # 4. Initialize Multi-Turn Consultation Session
    print(f"\n[STEP 4] Initializing AI Welfare Consultation Session...")
    sess_res = requests.post(f"{BASE_URL}/chat/sessions", json={
        "title": "College Scholarship & Family Welfare",
        "language_code": "hi"
    }, headers=headers)
    assert sess_res.status_code == 201
    session_id = sess_res.json()["id"]
    print(f"Active Consultation Session ID: {session_id}")

    # 5. TURN 1: Ask about Higher Education / College Fee in MP
    query_1 = "Namaste! Main Indore MP me college student hu. Kya mujhe college fee ke liye koi government scholarship ya financial help mil sakti hai?"
    print(f"\n" + "-"*70)
    print(f"[TURN 1] CITIZEN: {query_1}")
    t0 = time.time()
    msg1_res = requests.post(f"{BASE_URL}/chat/sessions/{session_id}/messages", json={"content": query_1}, headers=headers)
    latency_1 = time.time() - t0
    assert msg1_res.status_code == 200, f"Turn 1 failed: {msg1_res.text}"
    ans_1 = msg1_res.json()
    print(f"AI RESPONSE ({latency_1:.2f}s):\n{ans_1['content']}")
    print(f"Citations: {ans_1.get('citations')}")

    # 6. TURN 2: Ask about Required Documents & Online Portal
    query_2 = "Iske liye mujhe kon-kon se documents chahiye honge aur online form kaise bharna hoga?"
    print(f"\n" + "-"*70)
    print(f"[TURN 2] CITIZEN: {query_2}")
    t0 = time.time()
    msg2_res = requests.post(f"{BASE_URL}/chat/sessions/{session_id}/messages", json={"content": query_2}, headers=headers)
    latency_2 = time.time() - t0
    assert msg2_res.status_code == 200, f"Turn 2 failed: {msg2_res.text}"
    ans_2 = msg2_res.json()
    print(f"AI RESPONSE ({latency_2:.2f}s):\n{ans_2['content']}")
    print(f"Citations: {ans_2.get('citations')}")

    # 7. TURN 3: Ask about Mother's Welfare (Ladli Behna in MP)
    query_3 = "Meri mata ji ke liye bhi koi scheme hai kya MP me? Unki umar 42 saal hai aur wo housewife hain."
    print(f"\n" + "-"*70)
    print(f"[TURN 3] CITIZEN: {query_3}")
    t0 = time.time()
    msg3_res = requests.post(f"{BASE_URL}/chat/sessions/{session_id}/messages", json={"content": query_3}, headers=headers)
    latency_3 = time.time() - t0
    assert msg3_res.status_code == 200, f"Turn 3 failed: {msg3_res.text}"
    ans_3 = msg3_res.json()
    print(f"AI RESPONSE ({latency_3:.2f}s):\n{ans_3['content']}")
    print(f"Citations: {ans_3.get('citations')}")

    # 8. TURN 4: Multimodal Voice Synthesis & Voice Chat Pipeline
    print(f"\n" + "-"*70)
    print(f"[TURN 4] TESTING REAL MULTIMODAL VOICE SYNTHESIS (/voice/synthesize)...")
    t0 = time.time()
    synth_res = requests.post(f"{BASE_URL}/voice/synthesize", json={
        "text": "नमस्ते कविता! मुख्यमंत्री मेधावी विद्यार्थी योजना में आपको कॉलेज की पूरी फीस का लाभ मिलता है।",
        "language_code": "hi",
    }, headers=headers)
    latency_4 = time.time() - t0
    print(f"Voice Synthesis HTTP Status: {synth_res.status_code} ({latency_4:.2f}s)")
    assert synth_res.status_code == 200, f"Voice synthesis failed: {synth_res.text}"
    synth_data = synth_res.json()
    audio_b64 = synth_data.get('audio_base64')
    print(f"Synthesized Neural Voice Base64 Length: {len(audio_b64) if audio_b64 else 0} chars")
    assert audio_b64 is not None, "Expected synthesized audio bytes"

    # Now upload audio file to /voice/chat
    import base64
    audio_bytes = base64.b64decode(audio_b64)
    files = {'file': ('query.mp3', audio_bytes, 'audio/mp3')}
    vchat_res = requests.post(f"{BASE_URL}/voice/chat", files=files, headers={"Authorization": f"Bearer {token}"})
    print(f"End-to-End Voice Chat Upload HTTP Status: {vchat_res.status_code}")
    assert vchat_res.status_code == 200, f"Voice chat failed: {vchat_res.text}"
    vchat_data = vchat_res.json()
    print(f"Voice Transcribed Query: {vchat_data.get('transcribed_text')}")
    print(f"Voice Assistant Response: {vchat_data.get('response_text')[:180]}...")

    print("\n" + "=" * 70)
    print("✅ AUTOMATED REAL-WORLD CITIZEN JOURNEY & MULTI-TURN CHAT TEST PASSED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    run_real_world_citizen_chat_journey()
