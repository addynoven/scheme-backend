from pathlib import Path
import re
from typing import Any
from sqlalchemy.orm import Session

from app.modules.eligibility.bitmask_engine import bitmask_engine
from app.modules.routing.schemas import (
    DecomposedQueryPlan,
    QueryRouteResponse,
    RouteType,
    SQLWorkerPayload,
    SynthesizerContext,
)

KNOWLEDGE_ROOT = Path("/home/neon/programs/side_project/scheme-backend/knowledge")

# Language detection keywords
INDIC_LANGUAGE_HINTS = {
    "hi": ["kya", "hai", "mujhe", "yojana", "milegi", "kaise", "form", "bhaiya", "umar", "aavedan", "pension", "dastavej"],
    "mr": ["kay", "ahe", "yojana", "kashi", "milnar", "arja", "mahiti", "kagadpatre"],
    "ta": ["enna", "thittam", "eppadi", "vinnappam", "thevai"],
}

STATE_SYNONYMS = {
    "mp": "Madhya Pradesh",
    "madhya pradesh": "Madhya Pradesh",
    "maharashtra": "Maharashtra",
    "mh": "Maharashtra",
    "karnataka": "Karnataka",
    "ka": "Karnataka",
    "up": "Uttar Pradesh",
    "uttar pradesh": "Uttar Pradesh",
    "bihar": "Bihar",
    "rajasthan": "Rajasthan",
    "delhi": "Delhi",
    "tamil nadu": "Tamil Nadu",
    "tn": "Tamil Nadu",
    "gujarat": "Gujarat",
    "west bengal": "West Bengal",
    "wb": "West Bengal",
}

SCHEME_KEYWORD_MAP = {
    "pm-kisan": ["pm kisan", "kisan samman", "kisan yojana", "farmer 6000", "kheti", "kisan"],
    "ladli-behna": ["ladli behna", "ladli bahin", "majhi ladki", "1250", "women monthly"],
    "sukanya-samriddhi-yojana": ["sukanya", "ssy", "beti", "girl child", "daughter"],
    "ab-pmjay": ["ayushman", "pmjay", "pm-jay", "golden card", "5 lakh health", "hospital", "ilaj"],
    "mp-medhavi-vidyarthi-yojana": ["medhavi", "mmvy", "college fee", "higher education scholarship"],
    "pm-awas-yojana": ["pm awas", "pmay", "pucca house", "makan", "housing", "ghar"],
    "pm-vishwakarma": ["vishwakarma", "artisan", "toolkit", "15000 tool", "karigar", "carpenter", "tailor"],
    "pm-mudra-yojana": ["mudra", "pmmy", "business loan", "shishu loan", "business", "vyapar", "startup", "dukan", "shop", "msme", "udyog", "dhandha"],
}


class IntelligentQueryRouter:
    def __init__(self, knowledge_dir: Path = KNOWLEDGE_ROOT):
        self.knowledge_dir = knowledge_dir

    def decompose_query(self, raw_query: str, user_profile: dict[str, Any] | None = None) -> DecomposedQueryPlan:
        q = raw_query.lower().strip()

        # 1. Language Detection
        detected_lang = "en"
        for lang_code, hints in INDIC_LANGUAGE_HINTS.items():
            if any(h in q for h in hints):
                detected_lang = "hi" if lang_code == "hi" else lang_code
                break

        # 2. Extract State
        matched_state = None
        for syn, canonical_state in STATE_SYNONYMS.items():
            if re.search(r"\b" + re.escape(syn) + r"\b", q):
                matched_state = canonical_state
                break
        if not matched_state and user_profile:
            matched_state = user_profile.get("state")

        # 3. Extract Age & Income
        age_match = re.search(r"\b(\d{1,2})\s*(?:saal|year|years|age|umar)\b", q)
        extracted_age = int(age_match.group(1)) if age_match else (user_profile.get("age") if user_profile else None)

        income_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lac|k|hazar|thousand)", q)
        extracted_income = None
        if income_match:
            num = float(income_match.group(1))
            extracted_income = num * 100000 if "l" in income_match.group(0) else num * 1000
        elif user_profile and user_profile.get("annual_income"):
            extracted_income = float(user_profile.get("annual_income"))

        # 4. Extract Category / Occupation
        category = None
        if any(k in q for k in ["business", "loan", "startup", "msme", "dukan", "shop", "vyapar", "udyog", "dhandha", "kranti", "kam"]):
            category = "Business & Finance"
        elif any(k in q for k in ["farmer", "kisan", "kheti", "crop", "fasal", "agriculture"]):
            category = "Agriculture"
        elif any(k in q for k in ["scholarship", "college", "school", "padhai", "student", "education", "fee"]):
            category = "Education"
        elif any(k in q for k in ["women", "mahila", "lady", "girl", "beti", "mother", "daughter"]):
            category = "Women & Child"
        elif any(k in q for k in ["health", "hospital", "bimari", "doctor", "ayushman", "treatment", "ilaj"]):
            category = "Healthcare"
        elif any(k in q for k in ["house", "housing", "makan", "ghar", "awas", "flat"]):
            category = "Housing"
        elif any(k in q for k in ["artisan", "karigar", "skill", "training", "vishwakarma", "job", "naukri"]):
            category = "Employment & Skills"
        elif any(k in q for k in ["pension", "old age", "senior", "vriddha", "atal", "elderly"]):
            category = "Social Welfare"
        elif any(k in q for k in ["disability", "disabled", "divyang", "viklang"]):
            category = "Social Welfare"

        # 5. Check Scheme Matches in OKF
        matched_slugs = []
        for slug, kws in SCHEME_KEYWORD_MAP.items():
            if any(kw in q for kw in kws):
                matched_slugs.append(slug)

        okf_paths = []
        for slug in matched_slugs:
            found_files = list(self.knowledge_dir.glob(f"schemes/**/{slug}.md"))
            if found_files:
                okf_paths.append(str(found_files[0]))

        # Also check for document references
        if any(k in q for k in ["document", "documents", "aadhaar", "income cert", "caste cert", "domicile", "khasra", "dastavej"]):
            if "income" in q:
                p = self.knowledge_dir / "documents/income-wealth/income-certificate.md"
                if p.exists(): okf_paths.append(str(p))
            if "domicile" in q or "niwas" in q:
                p = self.knowledge_dir / "documents/social-category/domicile-certificate.md"
                if p.exists(): okf_paths.append(str(p))
            if "caste" in q or "jati" in q:
                p = self.knowledge_dir / "documents/social-category/caste-certificate.md"
                if p.exists(): okf_paths.append(str(p))
            if "aadhaar" in q or "aadhar" in q:
                p = self.knowledge_dir / "documents/identity/aadhaar-card.md"
                if p.exists(): okf_paths.append(str(p))

        # 6. Route Classification
        is_eligibility_intent = any(k in q for k in ["eligible", "patra", "milegi", "qualify", "can i get", "apply kar sakta", "criteria"])
        is_doc_or_procedure_intent = any(k in q for k in ["document", "dastavej", "how to apply", "kaise kare", "portal", "link", "kaha"])
        is_live_news_intent = any(k in q for k in ["last date", "deadline", "today", "aaj", "extended", "kab tak", "latest"])

        if is_eligibility_intent and (extracted_age or extracted_income or matched_state or category):
            route_target = RouteType.MULTI_SOURCE if okf_paths else RouteType.SQL_RULES
        elif is_doc_or_procedure_intent and okf_paths:
            route_target = RouteType.OKF_CANONICAL
        elif is_live_news_intent:
            route_target = RouteType.MULTI_SOURCE
        else:
            route_target = RouteType.MULTI_SOURCE if (okf_paths or category) else RouteType.HYBRID_RAG

        # Build clean canonical English intent
        canonical_parts = []
        if is_eligibility_intent:
            canonical_parts.append("Eligibility check")
        if category:
            canonical_parts.append(f"for {category}")
        if matched_state:
            canonical_parts.append(f"in {matched_state}")
        if matched_slugs:
            canonical_parts.append(f"for scheme {matched_slugs[0]}")
        canonical_intent = " ".join(canonical_parts) if canonical_parts else f"Citizen welfare inquiry regarding {raw_query}"

        return DecomposedQueryPlan(
            original_query=raw_query,
            detected_language=detected_lang,
            canonical_english_intent=canonical_intent,
            route_target=route_target,
            sql_payload=SQLWorkerPayload(
                state=matched_state,
                age=extracted_age,
                annual_income=extracted_income,
                category=category,
            ),
            okf_target_paths=okf_paths,
            web_agent_query=f"{matched_state or 'India'} {category or ''} scheme updates 2026" if is_live_news_intent else None,
            confidence=0.95,
        )

    def route_and_execute(
        self,
        raw_query: str,
        db: Session,
        user_profile: dict[str, Any] | None = None,
        chat_history: list[dict[str, str]] | None = None,
    ) -> QueryRouteResponse:
        # Step 1: Decompose
        plan = self.decompose_query(raw_query, user_profile)

        # Step 2: Ensure Bitmask Engine is ready
        if not bitmask_engine.is_warmed:
            bitmask_engine.warm_up(db)

        # Step 3: Parallel Execution
        # 3a. Execute SQL / Bitmask Engine
        eval_profile = {
            "state": plan.sql_payload.state if plan.sql_payload and plan.sql_payload.state else "all_india",
            "age": plan.sql_payload.age if plan.sql_payload and plan.sql_payload.age else 25,
            "annual_income": plan.sql_payload.annual_income if plan.sql_payload and plan.sql_payload.annual_income else 100000,
        }
        if user_profile:
            eval_profile.update(user_profile)

        matches = bitmask_engine.evaluate(eval_profile)
        if plan.sql_payload and plan.sql_payload.category:
            matches = [m for m in matches if plan.sql_payload.category.lower() in (m.get("category", "").lower())]

        # 3b. Read OKF Files
        okf_docs_content = []
        citations = []
        for path_str in plan.okf_target_paths:
            p = Path(path_str)
            if p.exists():
                try:
                    rel_path = str(p.relative_to(self.knowledge_dir.parent))
                except ValueError:
                    rel_path = str(p)
                content = p.read_text(encoding="utf-8")
                okf_docs_content.append({"path": rel_path, "content": content})
                citations.append(rel_path)

        # If query is a greeting or short letter, do not attach scheme citations or execute heavy bitmask
        clean_q = raw_query.strip().lower()
        is_greeting = clean_q in ["hi", "hello", "hey", "namaste", "h", "t", "hola", "pranam", "kya haal hai", "k"] or len(clean_q) <= 2
        if is_greeting:
            citations = []
            matches = []
        elif not citations and matches:
            for m in matches[:3]:
                citations.append(f"knowledge/schemes/{m['slug']}.md")

        # Step 4: Synthesize Response
        synthesizer_ctx = SynthesizerContext(
            original_query=raw_query,
            chat_history=chat_history or [],
            detected_language=plan.detected_language,
            sql_eligibility_matches=matches[:6],
            okf_documents_content=okf_docs_content if not is_greeting else [],
            web_agent_live_facts="Application portal is accepting active registrations for the current fiscal cycle." if (plan.web_agent_query and not is_greeting) else None,
        )

        response_text = self._synthesize_answer(synthesizer_ctx, user_profile)

        return QueryRouteResponse(
            query=raw_query,
            route_used=RouteType.HYBRID_RAG if is_greeting else plan.route_target,
            plan=plan,
            response_text=response_text,
            citations=citations,
            matched_schemes=matches[:5],
        )

    def _generate_answer_with_gemini(
        self, ctx: SynthesizerContext, user_profile: dict[str, Any] | None = None
    ) -> str | None:
        from app.core.config import settings
        import json
        import urllib.request

        if not settings.GEMINI_API_KEY:
            return None

        # Short casual greetings or random test letters
        clean_q = ctx.original_query.strip().lower()
        is_greeting = clean_q in ["hi", "hello", "hey", "namaste", "h", "t", "hola", "pranam", "kya haal hai", "k"]

        # Build user profile string
        profile_str = ""
        if user_profile:
            profile_str = (
                f"Citizen Profile:\n"
                f"- Name: {user_profile.get('full_name', 'Citizen')}\n"
                f"- State: {user_profile.get('state', 'All-India')}\n"
                f"- District: {user_profile.get('district', '')}\n"
                f"- Age: {user_profile.get('age', '')}\n"
                f"- Gender: {user_profile.get('gender', '')}\n"
                f"- Occupation: {user_profile.get('occupation', '')}\n"
                f"- Annual Income: ₹{user_profile.get('annual_income', '')}\n"
                f"- Caste Category: {user_profile.get('caste_category', '')}\n"
            )

        schemes_str = ""
        if ctx.sql_eligibility_matches and not is_greeting:
            schemes_str = "Worker 1: Deterministic SQL & Bitmask Scheme Matches:\n"
            for m in ctx.sql_eligibility_matches[:6]:
                schemes_str += (
                    f"- [{m['name']}](/schemes/{m['slug']})\n"
                    f"  Category: {m.get('category')}, State: {m.get('state')}\n"
                    f"  Benefit: {m.get('benefit_title')}\n"
                    f"  Description: {m.get('description', '')[:140]}\n"
                    f"  Application Portal: {m.get('application_url')}\n"
                )

        okf_str = ""
        if ctx.okf_documents_content and not is_greeting:
            okf_str = "Worker 2: Canonical OKF Knowledge Files (Document & Eligibility Rules):\n"
            for doc in ctx.okf_documents_content[:3]:
                path = doc.get("path", "")
                content = doc.get("content", "")[:500]
                okf_str += f"--- Source ({path}) ---\n{content}\n\n"

        web_str = ""
        if ctx.web_agent_live_facts and not is_greeting:
            web_str = f"Worker 3: Live Web & Portal Announcements:\n{ctx.web_agent_live_facts}\n"

        history_str = ""
        if ctx.chat_history:
            history_str = "Conversation History:\n"
            for h in ctx.chat_history[-4:]:
                history_str += f"{h.get('sender', 'user')}: {h.get('content', '')}\n"

        system_instruction = (
            "You are the Sovereign Citizen Welfare AI Advisor for Scheme Navigator (India).\n"
            "Your goal is to synthesize the worker findings (SQL Rules, OKF Canonical Docs, and Live Web Facts) into an accurate, empathetic, and actionable response for the citizen.\n"
            "Rules:\n"
            "1. Language: Answer naturally in the same language as the citizen's query (Hindi, Hinglish, English, etc.).\n"
            "2. Grounding: Rely on the verified SQL matches and OKF canonical guidelines provided in the context.\n"
            "3. Business in MP/India: If the citizen asks about starting a business or loans in Madhya Pradesh / India, detail PM Mudra Yojana (loans up to ₹10-20 Lakhs collateral-free), PMEGP (25-35% subsidy), and MP Mukhyamantri Udyam Kranti Yojana, and specify required documents (Aadhaar, Project Report, Bank Passbook).\n"
            "4. Greetings / Short messages ('hi', 'h', 't', 'namaste'): Greet them politely by name (if available in profile) and ask how you can help them navigate welfare programs.\n"
            "5. Markdown Links: Format scheme names with markdown links in format: [Scheme Name](/schemes/{slug}).\n"
            "6. Structure: Keep responses clear, professional, and easy to read with bullet points."
        )

        user_content = f"{profile_str}\n\n{schemes_str}\n\n{okf_str}\n\n{web_str}\n\n{history_str}\n\nCitizen Question: {ctx.original_query}"

        payload = {
            "system_instruction": {"parts": [{"text": system_instruction}]},
            "contents": [{"parts": [{"text": user_content}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2048,
            },
        }

        models_to_try = [
            settings.GEMINI_MODEL or "gemini-flash-latest",
            "gemini-flash-latest",
            "gemini-flash-lite-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.7-flash",
            "gemini-3.1-flash-lite",
            "gemini-2.5-flash-lite",
        ]
        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "X-goog-api-key": settings.GEMINI_API_KEY,
                },
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=12) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    cand = data.get("candidates", [])[0]
                    text = cand.get("content", {}).get("parts", [])[0].get("text", "")
                    if text:
                        return text.strip()
            except Exception:
                continue

        return None

    def _synthesize_answer(self, ctx: SynthesizerContext, user_profile: dict[str, Any] | None = None) -> str:
        # Try Gemini LLM generation first
        llm_answer = self._generate_answer_with_gemini(ctx, user_profile)
        if llm_answer:
            return llm_answer

        lang = ctx.detected_language
        matches = ctx.sql_eligibility_matches
        okf_docs = ctx.okf_documents_content
        has_profile = bool(ctx.chat_history or (matches and any(m.get("match_score", 0) > 0 for m in matches)))

        clean_q = ctx.original_query.strip().lower()
        is_greeting = clean_q in ["hi", "hello", "hey", "namaste", "h", "t", "hola", "pranam", "kya haal hai", "k"] or len(clean_q) <= 2
        citizen_name = (user_profile.get("full_name") or "").strip() if user_profile else ""
        greeting_name = f" {citizen_name}" if citizen_name else ""

        if is_greeting:
            if lang in ["hi", "hinglish"]:
                return (
                    f"नमस्ते{greeting_name}! 🙏 मैं आपका **सॉवरेन वेलफेयर एआई सलाहकार** हूँ।\n\n"
                    "मैं आपको केंद्र व राज्य सरकार की प्रमुख जनकल्याणकारी योजनाओं की जानकारी देने के लिए यहाँ हूँ।\n\n"
                    "आप मुझसे निम्नलिखित विषयों पर पूछ सकते हैं:\n"
                    "- 💼 **स्वरोजगार व बिजनेस लोन:** (जैसे [पीएम मुद्रा योजना](/schemes/pm-mudra-yojana), PMEGP, मुख्यमंत्री उद्यम क्रांति)\n"
                    "- 🎓 **शिक्षा व छात्रवृत्ति:** (जैसे मेधावी विद्यार्थी योजना, पोस्ट-मैट्रिक स्कॉलरशिप)\n"
                    "- 🌾 **कृषि व किसान सम्मान:** (जैसे [पीएम-किसान](/schemes/pm-kisan))\n"
                    "- 🏥 **स्वास्थ्य व सुरक्षा:** (जैसे [आयुष्मान भारत](/schemes/ayushman-bharat-pmjay), लाडली बहना)\n"
                    "- 🏠 **आवास व पेंशन:** (जैसे [पीएम आवास योजना](/schemes/pmay-gramin), अटल पेंशन)\n\n"
                    "कृपया बताएं मैं आपकी क्या सहायता कर सकता हूँ?"
                )
            else:
                return (
                    f"Hello{greeting_name}! 👋 I am your **Sovereign Citizen Welfare AI Advisor**.\n\n"
                    "I am here to help you navigate and unlock government welfare schemes tailored to your household.\n\n"
                    "You can ask me about:\n"
                    "- 💼 **Business & MSME Loans:** (e.g. [PM Mudra Yojana](/schemes/pm-mudra-yojana), PMEGP, State Startup Grants)\n"
                    "- 🎓 **Education & Scholarships:** (e.g. Higher Education Scholarships, Fee Reimbursement)\n"
                    "- 🌾 **Agriculture & Farmers:** (e.g. [PM-Kisan](/schemes/pm-kisan), Kisan Credit Card)\n"
                    "- 🏥 **Healthcare & Family Welfare:** (e.g. [Ayushman Bharat PM-JAY](/schemes/ayushman-bharat-pmjay), Women Welfare)\n"
                    "- 🏠 **Housing & Pensions:** (e.g. [PMAY-Gramin](/schemes/pmay-gramin), Atal Pension Yojana)\n\n"
                    "What welfare assistance or scheme details are you looking for today?"
                )

        # Hindi / Hinglish Response Generation
        if lang in ["hi", "hinglish"]:
            if matches:
                top = matches[0]
                greeting = (
                    "**हाँ! आपकी आवश्यकता के अनुसार निम्नलिखित प्रमुख सरकारी योजनाएं उपलब्ध हैं:**"
                    if not has_profile
                    else "**हाँ! आपके विवरण के अनुसार आप निम्नलिखित प्रमुख सरकारी योजनाओं के लिए पात्र हैं:**"
                )
                lines = [
                    greeting,
                    f"\n### 1. [{top['name']}](/schemes/{top['slug']})",
                    f"- **लाभ:** {top['benefit_title']}",
                    f"- **विभाग:** {top['ministry']}",
                    f"- **आधिकारिक पोर्टल:** [{top['application_url'] or 'पोर्टल पर जाएं'}]({top['application_url'] or '#'})",
                ]
                if len(matches) > 1:
                    lines.append("\n**अन्य संबंधित योजनाएं:**")
                    for m in matches[1:4]:
                        lines.append(f"- **[{m['name']}](/schemes/{m['slug']})** ({m['category']}) — {m['benefit_title']}")

                if okf_docs:
                    lines.append("\n**आवश्यक दस्तावेज़ एवं आवेदन प्रक्रिया:**")
                    lines.append("- आधार कार्ड, आय प्रमाण पत्र, और मूल निवास प्रमाण पत्र तैयार रखें।")
                    lines.append("- आधिकारिक पोर्टल पर जाकर ऑनलाइन आवेदन करें।")

                return "\n".join(lines)
            else:
                return (
                    "नमस्ते! आपके द्वारा पूछे गए सवाल के आधार पर सीधे कोई योजना मैच नहीं हुई। "
                    "कृपया अपनी सटीक आयु, वार्षिक आय, और राज्य बताएं ताकि हम सही योजना ढूंढ सकें।"
                )

        # Default English Response Generation
        if matches:
            top = matches[0]
            greeting = (
                "Here are the **government welfare programs & scholarships** matching your request:"
                if not has_profile
                else "Based on your criteria, you are **eligible** for the following welfare programs:"
            )
            lines = [
                greeting,
                f"\n### 1. [{top['name']}](/schemes/{top['slug']})",
                f"- **Benefit:** {top['benefit_title']}",
                f"- **Governing Department:** {top['ministry']}",
                f"- **Official Application Portal:** [{top['application_url'] or 'Access Portal'}]({top['application_url'] or '#'})",
            ]
            if len(matches) > 1:
                lines.append("\n**Additional Matching Schemes:**")
                for m in matches[1:4]:
                    lines.append(f"- **[{m['name']}](/schemes/{m['slug']})** ({m['category']}): {m['benefit_title']}")

            if okf_docs:
                lines.append("\n**Checklist & Guidelines:**")
                lines.append("- Ensure you have your verified Aadhaar Card, Income Certificate, and Bank Passbook ready.")
                lines.append(f"- Submit your application via the official state portal: {top['application_url']}.")

            return "\n".join(lines)
        else:
            return (
                "Hello! We couldn't find a direct matching scheme for your specific query. "
                "Please mention your state, age, student/occupation status, or annual household income so we can find exact benefits for you."
            )

            return "\n".join(lines)

        return (
            "We could not find an exact deterministic match based on the provided inputs. "
            "Please provide your state, age, and family annual income to receive verified government benefits."
        )


# Global Router Singleton
query_router = IntelligentQueryRouter()
