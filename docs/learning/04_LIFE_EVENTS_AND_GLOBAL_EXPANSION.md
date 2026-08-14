# 📖 Chapter 4: Life-Event Intelligence Engine & Universal Global Architecture

> **Milestones:** V4.0 (Life Events) & V5.0 (Global Architecture)  
> **Core Concept:** Moving from reactive search to proactive welfare delivery, and structuring multi-country governance systems.

---

## 1. What is a Life-Event Engine?

In traditional government portals, citizens must actively search for schemes:
- If a farmer doesn't know a new solar pump subsidy exists, they never apply.
- If a girl turns 18 and becomes eligible for higher education grants, nobody notifies her.

**A Life-Event Engine flips the paradigm from Reactive Search to Proactive Welfare Delivery:**

```text
                  CITIZEN LIFE EVENT
            (e.g., "Daughter enrolled in College",
                   "Citizen turned 60 years old",
                   "Acquired 2 acres of farmland")
                           │
                           ▼
               EVENT DISPATCHER (Pub/Sub)
                           │
                           ▼
          BACKGROUND ELIGIBILITY RE-EVALUATOR
        (Re-runs rules across active scheme catalog)
                           │
                           ▼
                      DIFF ENGINE
      (Compares previous eligible schemes vs new results)
                           │
                           ▼
               NEW OPPORTUNITIES DISCOVERED!
                           │
                           ▼
                  CITIZEN NOTIFICATION
      "You are now eligible for 3 new Higher Education
       Scholarships (Up to ₹50,000/yr). Click to apply."
```

---

## 2. The Two Types of Life Events

| Event Category | Trigger Mechanism | Examples |
| :--- | :--- | :--- |
| **Temporal Milestones** | Computed automatically by cron from Date of Birth (No citizen action needed). | • Citizen turns 18 (Voting rights, adult skilling schemes)<br>• Citizen turns 60 (Senior citizen pensions, travel concessions)<br>• Girl child turns 10 (Sukanya Samriddhi account maturity) |
| **Declared Transitions** | Triggered when a citizen uploads a new document or updates profile. | • Child birth (Maternity benefits, immunization support)<br>• College admission (Stipends, laptops, book grants)<br>• Job loss / Business start (Mudra loan, MSME subsidies)<br>• Inter-state migration (PDS ration portability) |

---

## 3. The Re-evaluation State Machine (Python Event Pattern)

```python
from pydantic import BaseModel
from datetime import datetime

class LifeEvent(BaseModel):
    event_type: str  # e.g., "COLLEGE_ENROLLMENT", "TURNED_60", "LAND_ACQUIRED"
    user_id: int
    payload: dict
    occurred_at: datetime

def process_life_event(event: LifeEvent, db):
    # 1. Update citizen verified facts
    for key, val in event.payload.items():
        record_citizen_fact(db, user_id=event.user_id, fact_key=key, fact_value=val)
    
    # 2. Fetch active scheme catalog
    active_schemes = get_all_active_schemes(db)
    user_facts = get_citizen_facts_audit(db, user_id=event.user_id).verified_facts
    
    # 3. Compute new eligibility set
    newly_eligible = []
    for scheme in active_schemes:
        result = evaluate_scheme_eligibility(scheme=scheme, citizen_facts=user_facts)
        if result.is_eligible and not was_previously_notified(db, event.user_id, scheme.id):
            newly_eligible.append(scheme)
            
    # 4. Dispatch notification
    if newly_eligible:
        send_citizen_alert(
            user_id=event.user_id,
            title=f"New benefits available after {event.event_type.replace('_', ' ').title()}",
            schemes=newly_eligible
        )
```

---

## 4. Universal Global Expansion (V5.0 / GovStack)

To scale this platform beyond India (USA, UK, Canada, Kenya), we decouple regional assumptions:

### A. ISO 3166-1 Country Codes & Administrative Subdivisions
Instead of hardcoding Indian states, we use standard ISO standards:
```text
Country: IND (India) ──▶ State: MP (Madhya Pradesh) ──▶ District: Sehore
Country: USA (United States) ──▶ State: CA (California) ──▶ County: Alameda
Country: GBR (United Kingdom) ──▶ Country: SCT (Scotland) ──▶ Council: Glasgow
```

### B. Currency & Localization Engines
- Amounts stored as integer units in base currency with ISO 4217 code (`INR`, `USD`, `GBP`, `CAD`).
- Localized formatting (`₹1,50,000` vs `$150,000.00`).

### C. United Nations GovStack Welfare Standard
We align document types with the UN Digital Public Infrastructure (DPI) standard:
- Identity: `national_id` (Aadhaar / SSN / National Insurance)
- Tax: `tax_id` (PAN / W-2 / P60)
- Income: `means_tested_certificate`

---

## 📚 Recommended External Resources to Read

1. **Life Events in Digital Governance:**
   - [Gov.uk: Life Events Architecture in Government Services](https://www.gov.uk/service-toolkit#components)
   - [Estonia e-Estonia: Proactive Life-Event Services (Bürokratt)](https://e-estonia.com/)
2. **Global Public Infrastructure & Standards:**
   - [GovStack Global Specification (ITU & UN)](https://www.govstack.global/)
   - [ISO 3166-1 Country Codes Standard](https://www.iso.org/iso-3166-country-codes.html)
