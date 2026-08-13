from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.benefit import Benefit
from app.models.eligibility_rule import EligibilityRule
from app.models.official_source import OfficialSource
from app.models.required_document import RequiredDocument
from app.models.scheme import Scheme

NATIONAL_SCHEMES_DATA = [
    {
        "name": "Pradhan Mantri Kisan Samman Nidhi",
        "slug": "pm-kisan",
        "category": "Agriculture",
        "tags": "farmer, agriculture, crop, fertilizer, income support, rural, direct benefit transfer",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "description": "Direct income support of ₹6,000 per year paid in three equal installments to small and marginal farmer families.",
        "status": "active",
        "application_url": "https://pmkisan.gov.in",
        "official_website": "https://pmkisan.gov.in",
        "benefits": [
            {
                "title": "₹6,000 Annual Direct Cash Benefit",
                "description": "₹2,000 transferred every four months directly into Aadhaar-linked bank accounts.",
            }
        ],
        "eligibility_rules": [
            {
                "field_name": "occupation",
                "operator": "eq",
                "rule_value": "farmer",
            },
            {
                "field_name": "annual_income",
                "operator": "lte",
                "rule_value": "200000",
            },
        ],
        "required_documents": [
            {"document_name": "Aadhaar Card", "description": "Mandatory identity proof", "is_mandatory": True},
            {"document_name": "Bank Passbook", "description": "Bank account details linked to Aadhaar", "is_mandatory": True},
            {"document_name": "Land Records", "description": "Khasra / Khatauni land ownership paper", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "PM Kisan Portal", "url": "https://pmkisan.gov.in", "source_type": "website"}
        ],
    },
    {
        "name": "Ayushman Bharat PM-JAY",
        "slug": "ayushman-bharat-pmjay",
        "category": "Healthcare",
        "tags": "health, hospital, medical, insurance, surgery, treatment, bpl, free healthcare, golden card",
        "ministry": "Ministry of Health and Family Welfare",
        "description": "World's largest health assurance scheme providing ₹5 Lakh cashless cover per family per year for secondary and tertiary care hospitalization.",
        "status": "active",
        "application_url": "https://beneficiary.nha.gov.in",
        "official_website": "https://pmjay.gov.in",
        "benefits": [
            {
                "title": "₹5 Lakh Cashless Health Cover",
                "description": "Covers hospitalization, diagnostic tests, surgeries, medicines, and intensive care across 27,000+ empaneled hospitals.",
            }
        ],
        "eligibility_rules": [
            {
                "field_name": "annual_income",
                "operator": "lte",
                "rule_value": "150000",
            }
        ],
        "required_documents": [
            {"document_name": "Aadhaar Card", "description": "Identity proof", "is_mandatory": True},
            {"document_name": "Ration Card", "description": "Family membership / BPL card", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "National Health Authority", "url": "https://pmjay.gov.in", "source_type": "website"}
        ],
    },
    {
        "name": "Sukanya Samriddhi Yojana",
        "slug": "sukanya-samriddhi-yojana",
        "category": "Women & Child",
        "tags": "girl child, savings, education, marriage, high interest, tax exemption, daughter, post office",
        "ministry": "Ministry of Finance",
        "description": "Small deposit savings scheme for girl child with high government-backed interest (8.2% p.a.) and triple tax exemption (EEE).",
        "status": "active",
        "application_url": "https://www.indiapost.gov.in",
        "official_website": "https://www.indiapost.gov.in",
        "benefits": [
            {
                "title": "High Compounded Returns & Tax Exemption",
                "description": "8.2% annual interest compounded yearly, completely exempt from income tax under Section 80C.",
            }
        ],
        "eligibility_rules": [
            {
                "field_name": "gender",
                "operator": "eq",
                "rule_value": "female",
            },
            {
                "field_name": "age",
                "operator": "lte",
                "rule_value": "10",
            },
        ],
        "required_documents": [
            {"document_name": "Birth Certificate", "description": "Birth certificate of the girl child", "is_mandatory": True},
            {"document_name": "Parent Aadhaar Card", "description": "Identity and address proof of legal guardian", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "India Post SSY Guide", "url": "https://www.indiapost.gov.in", "source_type": "website"}
        ],
    },
    {
        "name": "Indira Gandhi National Old Age Pension Scheme",
        "slug": "ignoaps-old-age-pension",
        "category": "Social Welfare",
        "tags": "pension, elderly, senior citizen, monthly allowance, retirement, destitute, bpl",
        "ministry": "Ministry of Rural Development",
        "description": "Monthly financial assistance for senior citizens living below poverty line to ensure dignified social security.",
        "status": "active",
        "application_url": "https://nsap.nic.in",
        "official_website": "https://nsap.nic.in",
        "benefits": [
            {
                "title": "Monthly Cash Pension",
                "description": "₹1,000 to ₹2,000 per month credited directly into beneficiary bank accounts.",
            }
        ],
        "eligibility_rules": [
            {
                "field_name": "age",
                "operator": "gte",
                "rule_value": "60",
            },
            {
                "field_name": "annual_income",
                "operator": "lte",
                "rule_value": "100000",
            },
        ],
        "required_documents": [
            {"document_name": "Aadhaar Card", "description": "Identity proof", "is_mandatory": True},
            {"document_name": "Age Proof Certificate", "description": "Birth certificate or voter card showing age 60+", "is_mandatory": True},
            {"document_name": "Income Certificate", "description": "BPL card or Tehsildar income certificate", "is_mandatory": True},
            {"document_name": "Bank Passbook", "description": "Bank account for pension DBT", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "National Social Assistance Programme", "url": "https://nsap.nic.in", "source_type": "website"}
        ],
    },
    {
        "name": "PM Vishwakarma Scheme",
        "slug": "pm-vishwakarma",
        "category": "Employment & Skills",
        "tags": "artisan, craftsman, carpenter, blacksmith, potter, goldsmith, sculptor, tool kit, loan, skill training",
        "ministry": "Ministry of Micro, Small and Medium Enterprises",
        "description": "Holistic support scheme providing skill verification, ₹15,000 modern toolkit incentive, and collateral-free enterprise loans up to ₹3 Lakh at 5% interest for traditional artisans.",
        "status": "active",
        "application_url": "https://pmvishwakarma.gov.in",
        "official_website": "https://pmvishwakarma.gov.in",
        "benefits": [
            {
                "title": "₹15,000 Tool Incentive & ₹3 Lakh Low-Interest Loan",
                "description": "₹15,000 digital e-voucher for modern tools + ₹1 Lakh (Tranche 1) and ₹2 Lakh (Tranche 2) business loan at concessional 5% interest.",
            }
        ],
        "eligibility_rules": [
            {
                "field_name": "age",
                "operator": "gte",
                "rule_value": "18",
            },
            {
                "field_name": "occupation",
                "operator": "in",
                "rule_value": "carpenter, blacksmith, potter, goldsmith, sculptor, cobbler, mason, tailor, weaver, barber, washerman, artisan",
            },
        ],
        "required_documents": [
            {"document_name": "Aadhaar Card", "description": "Identity proof", "is_mandatory": True},
            {"document_name": "Bank Passbook", "description": "Bank account for stipend & loans", "is_mandatory": True},
            {"document_name": "Trade Self Declaration", "description": "Declaration of traditional family trade", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "PM Vishwakarma Portal", "url": "https://pmvishwakarma.gov.in", "source_type": "website"}
        ],
    },
    {
        "name": "Pradhan Mantri Awas Yojana - Gramin",
        "slug": "pmay-gramin",
        "category": "Housing",
        "tags": "housing, home, pucca house, construction, rural housing, shelter, grant, sanitation",
        "ministry": "Ministry of Rural Development",
        "description": "Financial grant of up to ₹1,30,000 for houseless rural households and families living in kutcha/dilapidated homes to construct safe, pucca houses.",
        "status": "active",
        "application_url": "https://pmayg.nic.in",
        "official_website": "https://pmayg.nic.in",
        "benefits": [
            {
                "title": "₹1.2 Lakh to ₹1.3 Lakh Construction Grant",
                "description": "Direct financial aid for building pucca house + 90 days MGNREGA unskilled labour wages + ₹12,000 toilet grant.",
            }
        ],
        "eligibility_rules": [
            {
                "field_name": "annual_income",
                "operator": "lte",
                "rule_value": "180000",
            }
        ],
        "required_documents": [
            {"document_name": "Aadhaar Card", "description": "Identity proof", "is_mandatory": True},
            {"document_name": "Bank Passbook", "description": "Bank account for DBT installments", "is_mandatory": True},
            {"document_name": "MGNREGA Job Card", "description": "Job card number for wage tracking", "is_mandatory": False},
        ],
        "official_sources": [
            {"title": "PMAY-G Official Portal", "url": "https://pmayg.nic.in", "source_type": "website"}
        ],
    },
    {
        "name": "Pradhan Mantri Ujjwala Yojana 2.0",
        "slug": "pm-ujjwala-yojana",
        "category": "Social Welfare",
        "tags": "lpg, gas cylinder, clean cooking, fuel, women empowerment, bpl, subsidy, smoke free",
        "ministry": "Ministry of Petroleum and Natural Gas",
        "description": "Deposit-free LPG connection for adult women of poor households along with free first refill and hotplate/stove.",
        "status": "active",
        "application_url": "https://pmuy.gov.in",
        "official_website": "https://pmuy.gov.in",
        "benefits": [
            {
                "title": "Free LPG Connection + First Refill & Stove",
                "description": "Full security deposit waiver for cylinder and regulator + free first gas refill + free LPG stove.",
            }
        ],
        "eligibility_rules": [
            {
                "field_name": "gender",
                "operator": "eq",
                "rule_value": "female",
            },
            {
                "field_name": "age",
                "operator": "gte",
                "rule_value": "18",
            },
            {
                "field_name": "annual_income",
                "operator": "lte",
                "rule_value": "120000",
            },
        ],
        "required_documents": [
            {"document_name": "Aadhaar Card", "description": "Identity proof of woman applicant", "is_mandatory": True},
            {"document_name": "Ration Card", "description": "Family composition proof", "is_mandatory": True},
            {"document_name": "Bank Passbook", "description": "Aadhaar-linked bank account", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "Ujjwala 2.0 Portal", "url": "https://pmuy.gov.in", "source_type": "website"}
        ],
    },
    {
        "name": "Pradhan Mantri Mudra Yojana",
        "slug": "pm-mudra-yojana",
        "category": "Business & Finance",
        "tags": "business loan, shopkeeper, small business, microfinance, shishu, kishore, tarun, collateral free, enterprise",
        "ministry": "Ministry of Finance",
        "description": "Collateral-free loans up to ₹10 Lakh for small manufacturing, processing, retail, and service enterprises under Shishu, Kishore, and Tarun categories.",
        "status": "active",
        "application_url": "https://www.udyamimitra.in",
        "official_website": "https://www.mudra.org.in",
        "benefits": [
            {
                "title": "Collateral-Free Business Loans up to ₹10 Lakh",
                "description": "Shishu (up to ₹50,000), Kishore (₹50,000 to ₹5 Lakh), Tarun (₹5 Lakh to ₹10 Lakh) with zero collateral requirements.",
            }
        ],
        "eligibility_rules": [
            {
                "field_name": "age",
                "operator": "gte",
                "rule_value": "18",
            }
        ],
        "required_documents": [
            {"document_name": "Aadhaar Card", "description": "Identity proof", "is_mandatory": True},
            {"document_name": "PAN Card", "description": "Tax identity for business borrower", "is_mandatory": True},
            {"document_name": "Business Proof", "description": "Udyam registration or shop establishment license", "is_mandatory": True},
            {"document_name": "Bank Statement", "description": "Last 6 months bank statement", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "MUDRA Official Portal", "url": "https://www.mudra.org.in", "source_type": "website"}
        ],
    },
    {
        "name": "Atal Pension Yojana",
        "slug": "atal-pension-yojana",
        "category": "Social Welfare",
        "tags": "pension, retirement, unorganized sector, monthly income, guaranteed pension, old age",
        "ministry": "Ministry of Finance",
        "description": "Government-backed pension scheme for workers in the unorganized sector providing guaranteed monthly pension of ₹1,000 to ₹5,000 post age 60.",
        "status": "active",
        "application_url": "https://www.npscra.nsdl.co.in",
        "official_website": "https://www.npscra.nsdl.co.in",
        "benefits": [
            {
                "title": "Guaranteed Monthly Pension Post 60",
                "description": "Guaranteed lifetime monthly pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000, or ₹5,000 depending on contribution amount.",
            }
        ],
        "eligibility_rules": [
            {
                "field_name": "age",
                "operator": "between",
                "rule_value": "18-40",
            }
        ],
        "required_documents": [
            {"document_name": "Aadhaar Card", "description": "Identity proof", "is_mandatory": True},
            {"document_name": "Bank Passbook", "description": "Savings bank account with auto-debit facility", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "NPS Trust APY Portal", "url": "https://www.npscra.nsdl.co.in", "source_type": "website"}
        ],
    },
    {
        "name": "Post-Matric Scholarship for Higher Education",
        "slug": "post-matric-scholarship",
        "category": "Education",
        "tags": "scholarship, student, college, higher education, tuition fee, reimbursement, maintenance allowance, degree",
        "ministry": "Ministry of Social Justice and Empowerment",
        "description": "100% compulsory tuition fee waiver and monthly maintenance allowance for students pursuing post-matriculation or post-secondary courses.",
        "status": "active",
        "application_url": "https://scholarships.gov.in",
        "official_website": "https://scholarships.gov.in",
        "benefits": [
            {
                "title": "Full Fee Reimbursement + Monthly Allowance",
                "description": "Complete coverage of non-refundable college fees and monthly study allowance directly to student bank account.",
            }
        ],
        "eligibility_rules": [
            {
                "field_name": "age",
                "operator": "between",
                "rule_value": "15-30",
            },
            {
                "field_name": "annual_income",
                "operator": "lte",
                "rule_value": "250000",
            },
        ],
        "required_documents": [
            {"document_name": "Aadhaar Card", "description": "Identity proof", "is_mandatory": True},
            {"document_name": "Income Certificate", "description": "Competent authority family income certificate", "is_mandatory": True},
            {"document_name": "Academic Marksheet", "description": "Previous qualifying exam marksheet", "is_mandatory": True},
            {"document_name": "College Admission Fee Receipt", "description": "Proof of active college enrollment", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "National Scholarship Portal", "url": "https://scholarships.gov.in", "source_type": "website"}
        ],
    },
    {
        "name": "Pradhan Mantri Matru Vandana Yojana",
        "slug": "pm-matru-vandana-yojana",
        "category": "Women & Child",
        "tags": "pregnancy, maternity benefit, newborn, lactating mother, nutrition, cash incentive, mother",
        "ministry": "Ministry of Women and Child Development",
        "description": "Maternity benefit cash incentive of ₹5,000 provided in installments for pregnant women and lactating mothers for health and nutrition.",
        "status": "active",
        "application_url": "https://pmmvy.wcd.gov.in",
        "official_website": "https://pmmvy.wcd.gov.in",
        "benefits": [
            {
                "title": "₹5,000 Direct Maternity Cash Incentive",
                "description": "Direct cash assistance to compensate for wage loss and support nutritious diet before and after delivery.",
            }
        ],
        "eligibility_rules": [
            {
                "field_name": "gender",
                "operator": "eq",
                "rule_value": "female",
            },
            {
                "field_name": "age",
                "operator": "gte",
                "rule_value": "19",
            },
            {
                "field_name": "annual_income",
                "operator": "lte",
                "rule_value": "800000",
            },
        ],
        "required_documents": [
            {"document_name": "Aadhaar Card", "description": "Identity proof of mother", "is_mandatory": True},
            {"document_name": "MCP Card", "description": "Mother and Child Protection card", "is_mandatory": True},
            {"document_name": "Bank Passbook", "description": "Bank account in mother's name", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "PMMVY Portal", "url": "https://pmmvy.wcd.gov.in", "source_type": "website"}
        ],
    },
    {
        "name": "Pradhan Mantri Fasal Bima Yojana",
        "slug": "pm-fasal-bima-yojana",
        "category": "Agriculture",
        "tags": "crop insurance, drought, flood, harvest loss, farmer, insurance claim, low premium, weather",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "description": "Comprehensive insurance coverage against crop failure and yield loss due to non-preventable natural calamities, pests, and diseases at low premiums (1.5%-2%).",
        "status": "active",
        "application_url": "https://pmfby.gov.in",
        "official_website": "https://pmfby.gov.in",
        "benefits": [
            {
                "title": "Full Crop Damage Insurance Claim",
                "description": "Direct settlement of claim amount into farmer bank accounts based on crop loss assessment.",
            }
        ],
        "eligibility_rules": [
            {
                "field_name": "occupation",
                "operator": "eq",
                "rule_value": "farmer",
            }
        ],
        "required_documents": [
            {"document_name": "Aadhaar Card", "description": "Identity proof", "is_mandatory": True},
            {"document_name": "Land Possession Certificate", "description": "Khasra / Khatauni land record", "is_mandatory": True},
            {"document_name": "Sowing Certificate", "description": "Certificate from Patwari / Village Officer", "is_mandatory": True},
            {"document_name": "Bank Passbook", "description": "Bank account for claim DBT", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "PMFBY Portal", "url": "https://pmfby.gov.in", "source_type": "website"}
        ],
    },
]


def seed_national_schemes(db: Session) -> int:
    seeded_count = 0

    for item in NATIONAL_SCHEMES_DATA:
        existing = db.scalar(select(Scheme).where(Scheme.slug == item["slug"]))
        if existing:
            # Update existing scheme attributes
            existing.name = item["name"]
            existing.category = item["category"]
            existing.tags = item["tags"]
            existing.ministry = item["ministry"]
            existing.description = item["description"]
            existing.status = item["status"]
            existing.application_url = item["application_url"]
            existing.official_website = item["official_website"]
            continue

        scheme = Scheme(
            name=item["name"],
            slug=item["slug"],
            category=item["category"],
            tags=item["tags"],
            ministry=item["ministry"],
            description=item["description"],
            status=item["status"],
            application_url=item["application_url"],
            official_website=item["official_website"],
        )
        db.add(scheme)
        db.flush()

        for b in item["benefits"]:
            db.add(Benefit(scheme_id=scheme.id, **b))

        for r in item["eligibility_rules"]:
            db.add(EligibilityRule(scheme_id=scheme.id, **r))

        for d in item["required_documents"]:
            db.add(RequiredDocument(scheme_id=scheme.id, **d))

        for s in item["official_sources"]:
            db.add(OfficialSource(scheme_id=scheme.id, **s))

        seeded_count += 1

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return seeded_count


def main():
    db = SessionLocal()
    try:
        count = seed_national_schemes(db)
        print(f"Successfully seeded/verified {len(NATIONAL_SCHEMES_DATA)} national schemes ({count} newly inserted).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
