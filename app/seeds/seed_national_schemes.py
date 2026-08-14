from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.modules.schemes.models import (
    Benefit,
    EligibilityRule,
    OfficialSource,
    RequiredDocument,
    Scheme,
)

NATIONAL_AND_STATE_SCHEMES_DATA = [
    # =========================================================================
    # 1. NATIONAL FLAGSHIP SCHEMES (ALL_INDIA)
    # =========================================================================
    {
        "name": "Pradhan Mantri Kisan Samman Nidhi",
        "slug": "pm-kisan",
        "state": "ALL_INDIA",
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
            {"field_name": "occupation", "operator": "eq", "rule_value": "farmer"},
            {"field_name": "annual_income", "operator": "lte", "rule_value": "200000"},
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
        "state": "ALL_INDIA",
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
            {"field_name": "annual_income", "operator": "lte", "rule_value": "150000"}
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
        "state": "ALL_INDIA",
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
            {"field_name": "gender", "operator": "eq", "rule_value": "female"},
            {"field_name": "age", "operator": "lte", "rule_value": "10"},
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
        "state": "ALL_INDIA",
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
            {"field_name": "age", "operator": "gte", "rule_value": "60"},
            {"field_name": "annual_income", "operator": "lte", "rule_value": "100000"},
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
        "state": "ALL_INDIA",
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
            {"field_name": "age", "operator": "gte", "rule_value": "18"},
            {"field_name": "occupation", "operator": "in", "rule_value": "carpenter, blacksmith, potter, goldsmith, sculptor, cobbler, mason, tailor, weaver, barber, washerman, artisan"},
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
        "state": "ALL_INDIA",
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
            {"field_name": "annual_income", "operator": "lte", "rule_value": "180000"}
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
        "state": "ALL_INDIA",
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
            {"field_name": "gender", "operator": "eq", "rule_value": "female"},
            {"field_name": "age", "operator": "gte", "rule_value": "18"},
            {"field_name": "annual_income", "operator": "lte", "rule_value": "120000"},
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
        "state": "ALL_INDIA",
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
            {"field_name": "age", "operator": "gte", "rule_value": "18"}
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
        "state": "ALL_INDIA",
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
            {"field_name": "age", "operator": "between", "rule_value": "18-40"}
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
        "state": "ALL_INDIA",
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
            {"field_name": "age", "operator": "between", "rule_value": "15-30"},
            {"field_name": "annual_income", "operator": "lte", "rule_value": "250000"},
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
        "state": "ALL_INDIA",
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
            {"field_name": "gender", "operator": "eq", "rule_value": "female"},
            {"field_name": "age", "operator": "gte", "rule_value": "19"},
            {"field_name": "annual_income", "operator": "lte", "rule_value": "800000"},
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
        "state": "ALL_INDIA",
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
            {"field_name": "occupation", "operator": "eq", "rule_value": "farmer"}
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

    # =========================================================================
    # 2. MADHYA PRADESH (MP) STATE FLAGSHIP SCHEMES
    # =========================================================================
    {
        "name": "Mukhya Mantri Ladli Behna Yojana",
        "slug": "mp-ladli-behna-yojana",
        "state": "Madhya Pradesh",
        "category": "Women & Child",
        "tags": "women, monthly allowance, cash transfer, dbt, financial independence, samagra, madhya pradesh",
        "ministry": "Department of Women and Child Development, Government of Madhya Pradesh",
        "description": "Flagship scheme providing ₹1,250 per month (₹15,000/year) direct benefit transfer into bank accounts of resident women in Madhya Pradesh aged 21-60.",
        "status": "active",
        "application_url": "https://ladlibehna.mp.gov.in",
        "official_website": "https://ladlibehna.mp.gov.in",
        "benefits": [
            {
                "title": "₹1,250 Monthly Direct Cash Transfer",
                "description": "₹15,000 annual direct cash transfer credited on the 10th of every month into Aadhaar-linked accounts.",
            }
        ],
        "eligibility_rules": [
            {"field_name": "state", "operator": "eq", "rule_value": "Madhya Pradesh"},
            {"field_name": "gender", "operator": "eq", "rule_value": "female"},
            {"field_name": "age", "operator": "between", "rule_value": "21-60"},
            {"field_name": "annual_income", "operator": "lte", "rule_value": "250000"},
        ],
        "required_documents": [
            {"document_name": "Samagra Family ID", "description": "MP Samagra Portal 9-digit member ID", "is_mandatory": True},
            {"document_name": "Aadhaar Card", "description": "Mandatory identity proof linked with mobile", "is_mandatory": True},
            {"document_name": "Aadhaar-Linked Bank Passbook", "description": "Bank account with active DBT enable status", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "MP Ladli Behna Portal", "url": "https://ladlibehna.mp.gov.in", "source_type": "portal"},
            {"title": "Samagra Social Security Mission", "url": "https://samagra.gov.in", "source_type": "registry"}
        ],
    },
    {
        "name": "Mukhya Mantri Kisan Kalyan Yojana",
        "slug": "mp-kisan-kalyan-yojana",
        "state": "Madhya Pradesh",
        "category": "Agriculture",
        "tags": "farmer, cash top-up, crop, saara portal, agriculture, dbt, madhya pradesh",
        "ministry": "Department of Revenue, Government of Madhya Pradesh",
        "description": "State financial assistance of ₹6,000 per year paid in three installments of ₹2,000, complementing PM-Kisan to provide a total ₹12,000 annual farmer support.",
        "status": "active",
        "application_url": "https://saara.mp.gov.in",
        "official_website": "https://saara.mp.gov.in",
        "benefits": [
            {
                "title": "₹6,000 Annual MP State Farmer Grant",
                "description": "₹2,000 transferred in three installments directly to verified landholding farmers in MP.",
            }
        ],
        "eligibility_rules": [
            {"field_name": "state", "operator": "eq", "rule_value": "Madhya Pradesh"},
            {"field_name": "occupation", "operator": "eq", "rule_value": "farmer"},
            {"field_name": "annual_income", "operator": "lte", "rule_value": "300000"},
        ],
        "required_documents": [
            {"document_name": "Khasra Land Ownership Record", "description": "Official agricultural land record from Patwari / SAARA", "is_mandatory": True},
            {"document_name": "Aadhaar Card", "description": "Identity proof", "is_mandatory": True},
            {"document_name": "Bank Passbook", "description": "Aadhaar-seeded bank account", "is_mandatory": True},
            {"document_name": "PM Kisan Registration ID", "description": "Active PM-Kisan beneficiary registration number", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "SAARA MP Portal", "url": "https://saara.mp.gov.in", "source_type": "portal"}
        ],
    },
    {
        "name": "Mukhyamantri Medhavi Vidyarthi Yojana (MMVY)",
        "slug": "mp-medhavi-vidyarthi-yojana",
        "state": "Madhya Pradesh",
        "category": "Education",
        "tags": "scholarship, higher education, engineering, medical, fee waiver, college, merit, madhya pradesh",
        "ministry": "Department of Technical Education and Skill Development, Government of Madhya Pradesh",
        "description": "Complete tuition fee sponsorship for meritorious MP students pursuing engineering (IIT/NIT/JEE), medical (NEET), law (CLAT), or degree courses.",
        "status": "active",
        "application_url": "http://scholarshipportal.mp.nic.in",
        "official_website": "http://scholarshipportal.mp.nic.in",
        "benefits": [
            {
                "title": "100% Higher Education Tuition Fee Waiver",
                "description": "Direct payment of entire college and course tuition fee directly to the educational institution by MP Government.",
            }
        ],
        "eligibility_rules": [
            {"field_name": "state", "operator": "eq", "rule_value": "Madhya Pradesh"},
            {"field_name": "age", "operator": "between", "rule_value": "16-25"},
            {"field_name": "annual_income", "operator": "lte", "rule_value": "600000"},
        ],
        "required_documents": [
            {"document_name": "12th Class Marksheet", "description": "70%+ in MP Board or 85%+ in CBSE/ICSE", "is_mandatory": True},
            {"document_name": "MP Domicile Certificate", "description": "Mool Niwas Praman Patra", "is_mandatory": True},
            {"document_name": "Income Certificate", "description": "Family income certificate issued by Tehsildar", "is_mandatory": True},
            {"document_name": "College Admission Allotment Letter", "description": "Proof of active college enrollment", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "MP State Scholarship Portal", "url": "http://scholarshipportal.mp.nic.in", "source_type": "portal"}
        ],
    },
    {
        "name": "State Government ST Scholarship (Class 9 to 10)",
        "slug": "mp-st-scholarship-class-9-10",
        "state": "Madhya Pradesh",
        "category": "Education",
        "tags": "scholarship, student, class 9, class 10, pre-matric, scheduled tribe, st, shiksha portal, tribal affairs, madhya pradesh, dbt",
        "ministry": "Tribal Affairs Department, Government of Madhya Pradesh",
        "description": "Pre-matric scholarship scheme launched by the Tribal Affairs Department, Government of Madhya Pradesh, providing annual financial assistance to Scheduled Tribe (ST) students in Classes 9 and 10 with no family income limit.",
        "status": "active",
        "application_url": "https://shikshaportal.mp.gov.in",
        "official_website": "https://cmhelpline.mp.gov.in/KnowYourEntitleDetail.aspx?Schemeid=891",
        "benefits": [
            {
                "title": "₹600/year Scholarship for Boys (Class 9-10)",
                "description": "Direct Benefit Transfer (DBT) of ₹600 per academic year transferred into the student's Aadhaar-linked bank account.",
            },
            {
                "title": "₹1,300/year Scholarship for Girls (Class 9-10)",
                "description": "Direct Benefit Transfer (DBT) of ₹1,300 per academic year transferred into the student's Aadhaar-linked bank account.",
            }
        ],
        "eligibility_rules": [
            {"field_name": "state", "operator": "eq", "rule_value": "Madhya Pradesh"},
            {"field_name": "caste_category", "operator": "eq", "rule_value": "ST"},
            {"field_name": "occupation", "operator": "eq", "rule_value": "student"},
            {"field_name": "age", "operator": "between", "rule_value": "13-18"},
        ],
        "required_documents": [
            {"document_name": "Aadhaar Card", "description": "Student Aadhaar identity proof", "is_mandatory": True},
            {"document_name": "Caste Certificate", "description": "Official Scheduled Tribe (ST) certificate", "is_mandatory": True},
            {"document_name": "Domicile Certificate", "description": "Madhya Pradesh resident/domicile certificate", "is_mandatory": True},
            {"document_name": "Samagra Family ID", "description": "9-digit MP Samagra member ID", "is_mandatory": True},
            {"document_name": "Bank Passbook", "description": "Student bank account details for direct benefit transfer", "is_mandatory": True},
            {"document_name": "Passport-size Photograph", "description": "Recent passport size photo", "is_mandatory": False},
        ],
        "official_sources": [
            {"title": "MP Shiksha Portal", "url": "https://shikshaportal.mp.gov.in", "source_type": "portal"},
            {"title": "CM Helpline Entitlement Details", "url": "https://cmhelpline.mp.gov.in/KnowYourEntitleDetail.aspx?Schemeid=891", "source_type": "official_circular"},
            {"title": "MyScheme National Portal - SGSTSC9T10", "url": "https://www.myscheme.gov.in/schemes/sgstsc9t10", "source_type": "portal"},
            {"title": "AIGGPA MP Social Protection Guidelines", "url": "https://aiggpa.mp.gov.in/uploads/publication/Social_Protection_Eng.pdf", "source_type": "guidelines_pdf"},
        ],
    },

    # =========================================================================
    # 3. MAHARASHTRA (MH) STATE FLAGSHIP SCHEMES
    # =========================================================================
    {
        "name": "Mukhyamantri Majhi Ladki Bahin Yojana",
        "slug": "mh-majhi-ladki-bahin",
        "state": "Maharashtra",
        "category": "Women & Child",
        "tags": "women, cash transfer, monthly financial aid, dbt, maharashtra, mahadbt",
        "ministry": "Department of Women and Child Development, Government of Maharashtra",
        "description": "Direct financial assistance of ₹1,500 per month (₹18,000/year) deposited directly into bank accounts of eligible resident women in Maharashtra aged 21-65.",
        "status": "active",
        "application_url": "https://ladakibahin.maharashtra.gov.in",
        "official_website": "https://ladakibahin.maharashtra.gov.in",
        "benefits": [
            {
                "title": "₹1,500 Monthly Financial Assistance",
                "description": "₹18,000 annual direct benefit transfer deposited into Aadhaar-linked bank accounts.",
            }
        ],
        "eligibility_rules": [
            {"field_name": "state", "operator": "eq", "rule_value": "Maharashtra"},
            {"field_name": "gender", "operator": "eq", "rule_value": "female"},
            {"field_name": "age", "operator": "between", "rule_value": "21-65"},
            {"field_name": "annual_income", "operator": "lte", "rule_value": "250000"},
        ],
        "required_documents": [
            {"document_name": "Aadhaar Card", "description": "Mandatory identity proof", "is_mandatory": True},
            {"document_name": "Maharashtra Domicile Certificate", "description": "Domicile / Birth certificate proving 15+ years residency", "is_mandatory": True},
            {"document_name": "Ration Card (Yellow/Orange)", "description": "Family income classification proof", "is_mandatory": True},
            {"document_name": "Bank Passbook", "description": "Aadhaar-seeded bank account", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "Majhi Ladki Bahin Portal", "url": "https://ladakibahin.maharashtra.gov.in", "source_type": "portal"},
            {"title": "Aaple Sarkar Maharashtra", "url": "https://aaplesarkar.mahaonline.gov.in", "source_type": "portal"}
        ],
    },
    {
        "name": "Namo Shetkari Mahasanman Nidhi Yojana",
        "slug": "mh-namo-shetkari-yojana",
        "state": "Maharashtra",
        "category": "Agriculture",
        "tags": "farmer, agriculture, crop, cash top-up, dbt, maharashtra, mahadbt",
        "ministry": "Department of Agriculture, Government of Maharashtra",
        "description": "Maharashtra state cash grant of ₹6,000 per year in three installments of ₹2,000, complementing PM-Kisan for total ₹12,000 farmer income support.",
        "status": "active",
        "application_url": "https://mahadbt.maharashtra.gov.in",
        "official_website": "https://mahadbt.maharashtra.gov.in",
        "benefits": [
            {
                "title": "₹6,000 Annual Maharashtra Farmer Grant",
                "description": "₹2,000 per installment transferred directly to verified landholding farmers in Maharashtra.",
            }
        ],
        "eligibility_rules": [
            {"field_name": "state", "operator": "eq", "rule_value": "Maharashtra"},
            {"field_name": "occupation", "operator": "eq", "rule_value": "farmer"},
        ],
        "required_documents": [
            {"document_name": "7/12 Land Extract", "description": "Official land ownership record from Maharashtra Revenue Department", "is_mandatory": True},
            {"document_name": "8-A Holding Extract", "description": "Khata details of agricultural land", "is_mandatory": True},
            {"document_name": "Aadhaar Card", "description": "Identity proof", "is_mandatory": True},
            {"document_name": "Bank Passbook", "description": "Aadhaar-seeded bank account", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "MahaDBT Portal", "url": "https://mahadbt.maharashtra.gov.in", "source_type": "portal"}
        ],
    },

    # =========================================================================
    # 4. KARNATAKA (KA) STATE FLAGSHIP SCHEMES
    # =========================================================================
    {
        "name": "Gruha Lakshmi Scheme",
        "slug": "ka-gruha-lakshmi-scheme",
        "state": "Karnataka",
        "category": "Women & Child",
        "tags": "women, head of family, guarantee scheme, cash assistance, dbt, karnataka, seva sindhu",
        "ministry": "Department of Women and Child Development, Government of Karnataka",
        "description": "Monthly financial assistance of ₹2,000 (₹24,000/year) transferred directly into bank accounts of female heads of household in Karnataka.",
        "status": "active",
        "application_url": "https://sevasindhugs.karnataka.gov.in",
        "official_website": "https://sevasindhugs.karnataka.gov.in",
        "benefits": [
            {
                "title": "₹2,000 Monthly Head of Household Grant",
                "description": "₹24,000 annual direct benefit transfer credited monthly into the woman head's bank account.",
            }
        ],
        "eligibility_rules": [
            {"field_name": "state", "operator": "eq", "rule_value": "Karnataka"},
            {"field_name": "gender", "operator": "eq", "rule_value": "female"},
            {"field_name": "age", "operator": "gte", "rule_value": "18"},
        ],
        "required_documents": [
            {"document_name": "Ration Card (Antyodaya / BPL / APL)", "description": "Ration card naming applicant as woman head of household", "is_mandatory": True},
            {"document_name": "Aadhaar Card of Woman Head", "description": "Identity proof", "is_mandatory": True},
            {"document_name": "Aadhaar-Linked Bank Passbook", "description": "Bank account enabled with NPCI direct debit", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "Seva Sindhu Guarantee Portal", "url": "https://sevasindhugs.karnataka.gov.in", "source_type": "portal"}
        ],
    },
    {
        "name": "Yuva Nidhi Scheme",
        "slug": "ka-yuva-nidhi-scheme",
        "state": "Karnataka",
        "category": "Employment & Skills",
        "tags": "unemployed, youth, graduate, diploma, stipend, allowance, karnataka, seva sindhu",
        "ministry": "Department of Skill Development, Entrepreneurship and Livelihood, Government of Karnataka",
        "description": "Monthly unemployment stipend of ₹3,000 for degree holders and ₹1,500 for diploma holders who completed education in the current academic year and remain unemployed.",
        "status": "active",
        "application_url": "https://sevasindhugs.karnataka.gov.in",
        "official_website": "https://sevasindhugs.karnataka.gov.in",
        "benefits": [
            {
                "title": "₹3,000 Monthly Unemployment Allowance",
                "description": "Monthly financial allowance for up to 2 years while seeking employment or attending skill development training.",
            }
        ],
        "eligibility_rules": [
            {"field_name": "state", "operator": "eq", "rule_value": "Karnataka"},
            {"field_name": "age", "operator": "between", "rule_value": "18-35"},
            {"field_name": "occupation", "operator": "eq", "rule_value": "unemployed"},
        ],
        "required_documents": [
            {"document_name": "Degree / Diploma Certificate & Marksheet", "description": "Proof of passing degree or diploma", "is_mandatory": True},
            {"document_name": "Karnataka Domicile Certificate", "description": "Residency proof in Karnataka for at least 6 years", "is_mandatory": True},
            {"document_name": "Aadhaar Card", "description": "Identity proof", "is_mandatory": True},
            {"document_name": "Unemployment Self-Declaration", "description": "Declaration of not being employed or self-employed", "is_mandatory": True},
        ],
        "official_sources": [
            {"title": "Seva Sindhu Yuva Nidhi Portal", "url": "https://sevasindhugs.karnataka.gov.in", "source_type": "portal"}
        ],
    },
]

# Alias for backward compatibility with existing tests
NATIONAL_SCHEMES_DATA = NATIONAL_AND_STATE_SCHEMES_DATA


def seed_national_schemes(db: Session) -> int:
    seeded_count = 0

    for item in NATIONAL_AND_STATE_SCHEMES_DATA:
        existing = db.scalar(select(Scheme).where(Scheme.slug == item["slug"]))
        if existing:
            # Update existing scheme attributes
            existing.name = item["name"]
            existing.state = item["state"]
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
            state=item["state"],
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
        print(f"Successfully seeded/verified {len(NATIONAL_AND_STATE_SCHEMES_DATA)} national & state schemes ({count} newly inserted).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
