"""
Official Government Open Data Feeds Provider (V1.5).
Provides standardized real welfare scheme datasets for National and State Government Portals.
"""

from typing import Any
import hashlib
import json

REAL_GOV_FEEDS: dict[str, list[dict[str, Any]]] = {
    "data_gov_in_welfare": [
        {
            "name": "PM Surya Ghar: Muft Bijli Yojana",
            "slug": "pm-surya-ghar-muft-bijli-yojana",
            "state": "ALL_INDIA",
            "category": "Housing",
            "tags": "solar, rooftop, electricity subsidy, energy, green",
            "ministry": "Ministry of New and Renewable Energy",
            "description": "National rooftop solar scheme providing up to ₹78,000 direct subsidy and 300 units of free monthly electricity to 1 crore residential households.",
            "application_url": "https://pmsuryaghar.gov.in",
            "official_website": "https://pmsuryaghar.gov.in",
            "launch_date": "2024-02-13",
            "benefits": [
                {
                    "title": "Rooftop Solar Subsidy",
                    "description": "Direct financial subsidy up to ₹78,000 for 3kW rooftop solar plant",
                    "amount": 78000,
                },
                {
                    "title": "Free Monthly Electricity",
                    "description": "Up to 300 units of free solar-generated electricity per month",
                    "amount": 0,
                },
            ],
            "eligibility_rules": [
                {"field_name": "annual_income", "operator": "lte", "rule_value": "500000"},
            ],
            "required_documents": [
                {"document_name": "Electricity Bill", "is_mandatory": True, "description": "Latest consumer electricity connection bill"},
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Identity of house owner"},
                {"document_name": "Bank Passbook", "is_mandatory": True, "description": "Bank account linked to Aadhaar for DBT subsidy"},
            ],
        },
        {
            "name": "Stand-Up India Scheme",
            "slug": "stand-up-india-scheme",
            "state": "ALL_INDIA",
            "category": "Business & Finance",
            "tags": "business loan, entrepreneurship, women, sc, st",
            "ministry": "Ministry of Finance",
            "description": "Facilitates bank loans between ₹10 Lakh and ₹1 Crore to at least one SC or ST borrower and at least one woman borrower per bank branch for setting up a greenfield enterprise.",
            "application_url": "https://www.standupmitra.in",
            "official_website": "https://www.standupmitra.in",
            "launch_date": "2016-04-05",
            "benefits": [
                {
                    "title": "Greenfield Business Loan",
                    "description": "Composite collateral-supported bank loan from ₹10 Lakh up to ₹1 Crore",
                    "amount": 1000000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "age", "operator": "gte", "rule_value": "18"},
                {"field_name": "occupation", "operator": "in", "rule_value": "Business,Entrepreneur,Self-Employed"},
            ],
            "required_documents": [
                {"document_name": "PAN Card", "is_mandatory": True, "description": "Business or personal tax identifier"},
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Identity proof"},
                {"document_name": "Business Project Report", "is_mandatory": True, "description": "Detailed greenfield project proposal"},
                {"document_name": "Caste Certificate", "is_mandatory": False, "description": "Required if applying under SC/ST quota"},
            ],
        },
        {
            "name": "Pradhan Mantri Awas Yojana - Urban 2.0 (PMAY-U)",
            "slug": "pmay-urban-2",
            "state": "ALL_INDIA",
            "category": "Housing",
            "tags": "housing, urban, home loan subsidy, interest subsidy",
            "ministry": "Ministry of Housing and Urban Affairs",
            "description": "Provides interest subsidy and financial assistance up to ₹2.5 Lakh for urban poor and middle-class families to construct or purchase pucca houses in cities.",
            "application_url": "https://pmay-urban.gov.in",
            "official_website": "https://pmay-urban.gov.in",
            "launch_date": "2024-09-01",
            "benefits": [
                {
                    "title": "Interest Subsidy Scheme",
                    "description": "Up to ₹2.5 Lakh interest subsidy on home loans for EWS/LIG families",
                    "amount": 250000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "annual_income", "operator": "lte", "rule_value": "600000"},
                {"field_name": "age", "operator": "gte", "rule_value": "21"},
            ],
            "required_documents": [
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Citizen identification"},
                {"document_name": "Income Certificate", "is_mandatory": True, "description": "Proof of household annual income"},
                {"document_name": "Bank Statement", "is_mandatory": True, "description": "Last 6 months bank statement"},
            ],
        },
        {
            "name": "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
            "slug": "pm-svanidhi",
            "state": "ALL_INDIA",
            "category": "Employment & Skills",
            "tags": "street vendor, micro loan, working capital, urban",
            "ministry": "Ministry of Housing and Urban Affairs",
            "description": "Special micro-credit facility providing affordable working capital collateral-free loans up to ₹50,000 with 7% interest subsidy to urban street vendors.",
            "application_url": "https://pmsvanidhi.mohua.gov.in",
            "official_website": "https://pmsvanidhi.mohua.gov.in",
            "launch_date": "2020-06-01",
            "benefits": [
                {
                    "title": "Micro Working Capital Loan",
                    "description": "Tiered working capital loan starting at ₹10k up to ₹50k on timely repayment",
                    "amount": 50000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "age", "operator": "gte", "rule_value": "18"},
                {"field_name": "occupation", "operator": "in", "rule_value": "Street Vendor,Vendor,Artisan,Self-Employed,Daily Wage"},
                {"field_name": "annual_income", "operator": "lte", "rule_value": "200000"},
            ],
            "required_documents": [
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Identity proof"},
                {"document_name": "Vending Certificate / ULB ID", "is_mandatory": True, "description": "Urban Local Body Vending recommendation or survey slip"},
                {"document_name": "Bank Passbook", "is_mandatory": True, "description": "Account details for loan disbursement"},
            ],
        },
        {
            "name": "National Means-cum-Merit Scholarship Scheme (NMMSS)",
            "slug": "national-means-cum-merit-scholarship",
            "state": "ALL_INDIA",
            "category": "Education",
            "tags": "scholarship, school students, class 9 to 12, merit, education",
            "ministry": "Ministry of Education",
            "description": "Awards scholarships of ₹12,000 per annum to meritorious students of economically weaker sections to arrest drop-out at class VIII and encourage secondary stage education.",
            "application_url": "https://scholarships.gov.in",
            "official_website": "https://scholarships.gov.in",
            "launch_date": "2008-05-01",
            "benefits": [
                {
                    "title": "Annual Secondary Education Scholarship",
                    "description": "₹12,000 per annum (₹1,000 per month) deposited directly into student bank account",
                    "amount": 12000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "age", "operator": "between", "rule_value": "13-18"},
                {"field_name": "occupation", "operator": "eq", "rule_value": "Student"},
                {"field_name": "annual_income", "operator": "lte", "rule_value": "350000"},
            ],
            "required_documents": [
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Student Aadhaar"},
                {"document_name": "Income Certificate", "is_mandatory": True, "description": "Parents annual income certificate"},
                {"document_name": "Class 7/8 Marksheet", "is_mandatory": True, "description": "Minimum 55% marks in qualifying exam"},
            ],
        },
    ],
    "rajasthan_state_portal": [
        {
            "name": "Mukhyamantri Chiranjeevi Swasthya Bima Yojana",
            "slug": "mukhyamantri-chiranjeevi-swasthya-bima",
            "state": "Rajasthan",
            "category": "Healthcare",
            "tags": "cashless insurance, medical, rajasthan, hospital, surgery",
            "ministry": "Department of Medical, Health and Family Welfare, Rajasthan",
            "description": "Flagship universal healthcare insurance scheme providing cashless medical treatment coverage up to ₹25 Lakh per family per year in affiliated private and government hospitals.",
            "application_url": "https://chiranjeevi.rajasthan.gov.in",
            "official_website": "https://chiranjeevi.rajasthan.gov.in",
            "launch_date": "2021-05-01",
            "benefits": [
                {
                    "title": "Cashless Health Insurance Coverage",
                    "description": "₹25 Lakh annual cashless treatment for hospitalization and critical surgeries",
                    "amount": 2500000,
                },
                {
                    "title": "Accident Insurance Cover",
                    "description": "₹10 Lakh accidental death and disability cover",
                    "amount": 1000000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "state", "operator": "eq", "rule_value": "Rajasthan"},
            ],
            "required_documents": [
                {"document_name": "Jan Aadhaar Card", "is_mandatory": True, "description": "Rajasthan Jan Aadhaar family ID"},
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Beneficiary Aadhaar"},
            ],
        },
        {
            "name": "Mukhyamantri Anuprati Coaching Scheme",
            "slug": "mukhyamantri-anuprati-coaching-scheme",
            "state": "Rajasthan",
            "category": "Education",
            "tags": "free coaching, ias, ras, neet, iit, rajasthan",
            "ministry": "Social Justice and Empowerment Department, Rajasthan",
            "description": "Provides 100% free competitive exam coaching (UPSC, RPSC, JEE, NEET, CLAT) along with ₹40,000 annual boarding stipend for underprivileged meritorious students.",
            "application_url": "https://sso.rajasthan.gov.in",
            "official_website": "https://sje.rajasthan.gov.in",
            "launch_date": "2021-06-05",
            "benefits": [
                {
                    "title": "Free Premier Coaching",
                    "description": "100% tuition coverage for top coaching institutions in Rajasthan",
                    "amount": 100000,
                },
                {
                    "title": "Boarding & Lodging Allowance",
                    "description": "₹40,000 per year for students staying away from home",
                    "amount": 40000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "state", "operator": "eq", "rule_value": "Rajasthan"},
                {"field_name": "occupation", "operator": "eq", "rule_value": "Student"},
                {"field_name": "annual_income", "operator": "lte", "rule_value": "800000"},
            ],
            "required_documents": [
                {"document_name": "Jan Aadhaar Card", "is_mandatory": True, "description": "Rajasthan Jan Aadhaar card"},
                {"document_name": "Income Certificate", "is_mandatory": True, "description": "Family income proof <= ₹8 LPA"},
                {"document_name": "Class 10/12 Marksheet", "is_mandatory": True, "description": "Merit eligibility certificate"},
            ],
        },
    ],
    "up_state_portal": [
        {
            "name": "Mukhyamantri Kanya Sumangala Yojana",
            "slug": "mukhyamantri-kanya-sumangala-yojana",
            "state": "Uttar Pradesh",
            "category": "Women & Child",
            "tags": "girl child, education, dbt, up, birth grant, graduation",
            "ministry": "Women and Child Development Department, Uttar Pradesh",
            "description": "Conditional cash transfer scheme in Uttar Pradesh providing ₹25,000 in 6 installments across the life milestones of a girl child from birth to graduation.",
            "application_url": "https://mksy.up.gov.in",
            "official_website": "https://mksy.up.gov.in",
            "launch_date": "2019-10-25",
            "benefits": [
                {
                    "title": "Tiered Milestone Financial Aid",
                    "description": "₹25,000 total DBT across birth, vaccination, class 1, 6, 9, and graduation enrollment",
                    "amount": 25000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "state", "operator": "eq", "rule_value": "Uttar Pradesh"},
                {"field_name": "gender", "operator": "eq", "rule_value": "Female"},
                {"field_name": "annual_income", "operator": "lte", "rule_value": "300000"},
            ],
            "required_documents": [
                {"document_name": "Birth Certificate", "is_mandatory": True, "description": "Girl child birth certificate"},
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Parents and child Aadhaar"},
                {"document_name": "Income Certificate", "is_mandatory": True, "description": "Tehsildar income certificate <= ₹3 Lakh"},
                {"document_name": "UP Domicile Certificate", "is_mandatory": True, "description": "Proof of UP permanent residency"},
            ],
        },
        {
            "name": "Mukhyamantri Abhyudaya Yojana",
            "slug": "mukhyamantri-abhyudaya-yojana",
            "state": "Uttar Pradesh",
            "category": "Education",
            "tags": "coaching, ias, pcs, nda, cds, tablet distribution, up",
            "ministry": "Social Welfare Department, Uttar Pradesh",
            "description": "Free high-quality physical and digital exam coaching by IAS/IPS/PCS officers along with free digital tablet distribution for youth preparing for competitive exams in UP.",
            "application_url": "http://abhyuday.up.gov.in",
            "official_website": "http://abhyuday.up.gov.in",
            "launch_date": "2021-02-16",
            "benefits": [
                {
                    "title": "Free Officer Mentorship Coaching",
                    "description": "Free coaching sessions and study materials for UPSC, UPPSC, JEE, NEET",
                    "amount": 50000,
                },
                {
                    "title": "Free Digital Study Tablet",
                    "description": "High-speed digital tablet provided for meritorious students",
                    "amount": 15000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "state", "operator": "eq", "rule_value": "Uttar Pradesh"},
                {"field_name": "age", "operator": "between", "rule_value": "18-35"},
                {"field_name": "annual_income", "operator": "lte", "rule_value": "500000"},
            ],
            "required_documents": [
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Candidate Aadhaar"},
                {"document_name": "UP Domicile Certificate", "is_mandatory": True, "description": "UP state residence proof"},
                {"document_name": "Educational Certificates", "is_mandatory": True, "description": "Graduation or 10+2 marksheet"},
            ],
        },
    ],
    "tamilnadu_state_portal": [
        {
            "name": "Kalaignar Magalir Urimai Thittam",
            "slug": "kalaignar-magalir-urimai-thittam",
            "state": "Tamil Nadu",
            "category": "Women & Child",
            "tags": "women basic income, dbt, tamil nadu, financial aid",
            "ministry": "Special Programme Implementation Department, Tamil Nadu",
            "description": "Universal basic income scheme granting ₹1,000 per month (₹12,000 annually) directly to women heads of eligible households across Tamil Nadu.",
            "application_url": "https://kmut.tn.gov.in",
            "official_website": "https://kmut.tn.gov.in",
            "launch_date": "2023-09-15",
            "benefits": [
                {
                    "title": "Monthly Basic Income DBT",
                    "description": "₹1,000 credited monthly directly to the woman beneficiary bank account",
                    "amount": 12000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "state", "operator": "eq", "rule_value": "Tamil Nadu"},
                {"field_name": "gender", "operator": "eq", "rule_value": "Female"},
                {"field_name": "age", "operator": "gte", "rule_value": "21"},
                {"field_name": "annual_income", "operator": "lte", "rule_value": "250000"},
            ],
            "required_documents": [
                {"document_name": "Smart Ration Card", "is_mandatory": True, "description": "Tamil Nadu family card"},
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Woman head of household Aadhaar"},
                {"document_name": "Bank Passbook", "is_mandatory": True, "description": "Single-holder savings bank account linked to Aadhaar"},
            ],
        },
        {
            "name": "Moovalur Ramamirtham Ammaiyar Pudhumai Penn Scheme",
            "slug": "pudhumai-penn-scheme",
            "state": "Tamil Nadu",
            "category": "Education",
            "tags": "higher education, girl student, monthly stipend, college, tamil nadu",
            "ministry": "Social Welfare and Women Empowerment Department, Tamil Nadu",
            "description": "Provides ₹1,000 per month financial assistance to female students who studied from Class 6 to 12 in government schools until they complete their undergraduate degree or diploma.",
            "application_url": "https://pudhumaipenn.tn.gov.in",
            "official_website": "https://pudhumaipenn.tn.gov.in",
            "launch_date": "2022-09-05",
            "benefits": [
                {
                    "title": "Higher Education Monthly Stipend",
                    "description": "₹1,000 monthly allowance throughout college/polytechnic education",
                    "amount": 12000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "state", "operator": "eq", "rule_value": "Tamil Nadu"},
                {"field_name": "gender", "operator": "eq", "rule_value": "Female"},
                {"field_name": "occupation", "operator": "eq", "rule_value": "Student"},
                {"field_name": "age", "operator": "between", "rule_value": "17-25"},
            ],
            "required_documents": [
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Student Aadhaar"},
                {"document_name": "School Transfer Certificate", "is_mandatory": True, "description": "Proof of Class 6 to 12 in TN Govt school"},
                {"document_name": "College Admission Bonafide", "is_mandatory": True, "description": "Current college enrollment certificate"},
            ],
        },
    ],
    "telangana_state_portal": [
        {
            "name": "Rythu Bharosa Scheme",
            "slug": "telangana-rythu-bharosa",
            "state": "Telangana",
            "category": "Agriculture",
            "tags": "farmer, investment support, input subsidy, telangana, agriculture",
            "ministry": "Agriculture & Farmers Welfare Department, Telangana",
            "description": "Comprehensive direct investment support providing ₹15,000 per acre per year to farmers and tenant agricultural workers in Telangana.",
            "application_url": "https://rythubharosa.telangana.gov.in",
            "official_website": "https://rythubharosa.telangana.gov.in",
            "launch_date": "2024-01-01",
            "benefits": [
                {
                    "title": "Annual Crop Investment Assistance",
                    "description": "₹15,000 per acre per year deposited in two seasonal installments",
                    "amount": 15000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "state", "operator": "eq", "rule_value": "Telangana"},
                {"field_name": "occupation", "operator": "in", "rule_value": "Farmer,Agriculture,Farm Worker"},
            ],
            "required_documents": [
                {"document_name": "Pattadar Passbook", "is_mandatory": True, "description": "Dharani portal land ownership document"},
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Farmer identification"},
                {"document_name": "Bank Passbook", "is_mandatory": True, "description": "DBT linked bank account"},
            ],
        },
    ],
    "bihar_state_portal": [
        {
            "name": "Mukhyamantri Kanya Utthan Yojana",
            "slug": "bihar-mukhyamantri-kanya-utthan-yojana",
            "state": "Bihar",
            "category": "Women & Child",
            "tags": "girl child, education, graduation reward, bihar, dbt",
            "ministry": "Education Department, Bihar",
            "description": "Incentive scheme providing up to ₹50,000 direct grant to female students graduating from recognized universities in Bihar to promote female literacy.",
            "application_url": "http://medhasoft.bih.nic.in",
            "official_website": "http://medhasoft.bih.nic.in",
            "launch_date": "2018-04-01",
            "benefits": [
                {
                    "title": "Graduation Incentive Grant",
                    "description": "One-time direct financial reward of ₹50,000 upon bachelor degree completion",
                    "amount": 50000,
                },
                {
                    "title": "Intermediate (+2) Passing Incentive",
                    "description": "₹25,000 reward for unmarried girls passing 12th standard",
                    "amount": 25000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "state", "operator": "eq", "rule_value": "Bihar"},
                {"field_name": "gender", "operator": "eq", "rule_value": "Female"},
                {"field_name": "occupation", "operator": "eq", "rule_value": "Student"},
            ],
            "required_documents": [
                {"document_name": "Graduation Marksheet / Degree", "is_mandatory": True, "description": "Degree passing certificate"},
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Student Aadhaar"},
                {"document_name": "Bihar Domicile Certificate", "is_mandatory": True, "description": "Proof of Bihar residence"},
                {"document_name": "Bank Passbook", "is_mandatory": True, "description": "Aadhaar seeded bank account in Bihar"},
            ],
        },
    ],
    "west_bengal_state_portal": [
        {
            "name": "Kanyashree Prakalpa",
            "slug": "west-bengal-kanyashree-prakalpa",
            "state": "West Bengal",
            "category": "Women & Child",
            "tags": "unicef award, girl education, child marriage prevention, west bengal",
            "ministry": "Department of Women & Child Development and Social Welfare, West Bengal",
            "description": "UN-awarded conditional cash transfer initiative offering an annual scholarship of ₹1,000 and a one-time grant of ₹25,000 for unmarried girls pursuing education aged 13-19.",
            "application_url": "https://www.wbkanyashree.gov.in",
            "official_website": "https://www.wbkanyashree.gov.in",
            "launch_date": "2013-10-01",
            "benefits": [
                {
                    "title": "K2 One-Time Grant",
                    "description": "₹25,000 lump sum grant on turning 18 while remaining unmarried and in education",
                    "amount": 25000,
                },
                {
                    "title": "K1 Annual Scholarship",
                    "description": "₹1,000 annual scholarship for students in classes 8 to 12",
                    "amount": 1000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "state", "operator": "eq", "rule_value": "West Bengal"},
                {"field_name": "gender", "operator": "eq", "rule_value": "Female"},
                {"field_name": "age", "operator": "between", "rule_value": "13-19"},
                {"field_name": "occupation", "operator": "eq", "rule_value": "Student"},
            ],
            "required_documents": [
                {"document_name": "Birth Certificate", "is_mandatory": True, "description": "Date of birth proof"},
                {"document_name": "School Enrollment Certificate", "is_mandatory": True, "description": "Proof of student status"},
                {"document_name": "Unmarried Declaration", "is_mandatory": True, "description": "Self-declaration of unmarried status"},
                {"document_name": "Bank Passbook", "is_mandatory": True, "description": "Individual student bank passbook"},
            ],
        },
    ],
    "andhra_pradesh_state_portal": [
        {
            "name": "Jagananna Amma Vodi",
            "slug": "ap-jagananna-amma-vodi",
            "state": "Andhra Pradesh",
            "category": "Education",
            "tags": "school education, mother financial assistance, dbt, andhra pradesh",
            "ministry": "School Education Department, Andhra Pradesh",
            "description": "Annual financial assistance of ₹15,000 directly deposited to the bank accounts of mothers or guardians sending their children to school from Class 1 to 12.",
            "application_url": "https://jaganannaammavodi.ap.gov.in",
            "official_website": "https://jaganannaammavodi.ap.gov.in",
            "launch_date": "2020-01-09",
            "benefits": [
                {
                    "title": "Annual Mother Education Grant",
                    "description": "₹15,000 annual assistance for schooling expenses",
                    "amount": 15000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "state", "operator": "eq", "rule_value": "Andhra Pradesh"},
                {"field_name": "annual_income", "operator": "lte", "rule_value": "144000"},
            ],
            "required_documents": [
                {"document_name": "White Rice Card", "is_mandatory": True, "description": "AP BPL ration card"},
                {"document_name": "Mother Aadhaar Card", "is_mandatory": True, "description": "Mother/guardian identity"},
                {"document_name": "Student School ID", "is_mandatory": True, "description": "Proof of min 75% student attendance"},
            ],
        },
    ],
    "odisha_state_portal": [
        {
            "name": "KALIA Scheme (Krushak Assistance for Livelihood and Income Augmentation)",
            "slug": "odisha-kalia-scheme",
            "state": "Odisha",
            "category": "Agriculture",
            "tags": "kalia, farmer, small farmer, landless laborer, odisha, dbt",
            "ministry": "Department of Agriculture and Farmers Empowerment, Odisha",
            "description": "Direct income support of ₹10,000 per year for small and marginal farmers and ₹12,500 livelihood package for landless agricultural households in Odisha.",
            "application_url": "https://kalia.odisha.gov.in",
            "official_website": "https://kalia.odisha.gov.in",
            "launch_date": "2019-01-01",
            "benefits": [
                {
                    "title": "Crop Cultivation Financial Support",
                    "description": "₹10,000 per family per year for purchasing seeds, fertilizer, and farm equipment",
                    "amount": 10000,
                },
                {
                    "title": "Life & Disability Insurance",
                    "description": "₹2 Lakh personal accident and life insurance cover",
                    "amount": 200000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "state", "operator": "eq", "rule_value": "Odisha"},
                {"field_name": "occupation", "operator": "in", "rule_value": "Farmer,Agriculture,Farm Worker,Daily Wage"},
            ],
            "required_documents": [
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Farmer Aadhaar"},
                {"document_name": "Ration Card", "is_mandatory": True, "description": "Odisha food security card"},
                {"document_name": "Bank Passbook", "is_mandatory": True, "description": "Savings bank account details"},
            ],
        },
    ],
    "mp_state_portal": [
        {
            "name": "Mukhya Mantri Ladli Behna Yojana",
            "slug": "mukhya-mantri-ladli-behna-yojana",
            "state": "Madhya Pradesh",
            "category": "Women & Child",
            "tags": "women, financial assistance, dbt, monthly stipend, madhya pradesh",
            "ministry": "Women and Child Development Department, Madhya Pradesh",
            "description": "Financial empowerment scheme for women aged 21-60 in MP providing ₹1,250 monthly DBT assistance.",
            "application_url": "https://cmladlibahna.mp.gov.in",
            "official_website": "https://cmladlibahna.mp.gov.in",
            "launch_date": "2023-03-05",
            "benefits": [
                {
                    "title": "Monthly Cash Transfer",
                    "description": "₹1,250 per month credited directly to the beneficiary's Aadhaar-linked bank account",
                    "amount": 15000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "age", "operator": "between", "rule_value": "21-60"},
                {"field_name": "gender", "operator": "eq", "rule_value": "Female"},
                {"field_name": "state", "operator": "eq", "rule_value": "Madhya Pradesh"},
                {"field_name": "annual_income", "operator": "lte", "rule_value": "250000"},
            ],
            "required_documents": [
                {"document_name": "Samagra ID", "is_mandatory": True, "description": "MP Samagra Family & Member ID"},
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Identity proof"},
                {"document_name": "Bank Passbook", "is_mandatory": True, "description": "DBT-enabled bank account"},
            ],
        },
    ],
    "mh_state_portal": [
        {
            "name": "Mukhyamantri Majhi Ladki Bahin Yojana",
            "slug": "mukhyamantri-majhi-ladki-bahin-yojana",
            "state": "Maharashtra",
            "category": "Women & Child",
            "tags": "women, financial assistance, maharashtra, monthly dbt, ladki bahin",
            "ministry": "Women and Child Development Department, Maharashtra",
            "description": "Flagship direct benefit transfer scheme for underprivileged women in Maharashtra providing ₹1,500/month.",
            "application_url": "https://ladakibahin.maharashtra.gov.in",
            "official_website": "https://ladakibahin.maharashtra.gov.in",
            "launch_date": "2024-07-01",
            "benefits": [
                {
                    "title": "Monthly Financial Assistance",
                    "description": "₹1,500 deposited directly into Aadhaar-linked bank account every month",
                    "amount": 18000,
                },
            ],
            "eligibility_rules": [
                {"field_name": "age", "operator": "between", "rule_value": "21-65"},
                {"field_name": "gender", "operator": "eq", "rule_value": "Female"},
                {"field_name": "state", "operator": "eq", "rule_value": "Maharashtra"},
                {"field_name": "annual_income", "operator": "lte", "rule_value": "250000"},
            ],
            "required_documents": [
                {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Applicant Aadhaar with mobile link"},
                {"document_name": "Maharashtra Domicile Certificate", "is_mandatory": True, "description": "Or Ration Card valid for 15+ years"},
                {"document_name": "Income Certificate", "is_mandatory": True, "description": "Issued by Tehsildar (<= ₹2.5 Lakh)"},
                {"document_name": "Bank Passbook", "is_mandatory": True, "description": "Active bank account"},
            ],
        },
    ],
}


def get_gov_feed(source_key: str) -> list[dict[str, Any]]:
    """Returns the standardized official government feed for a given source key."""
    if source_key == "bulk_gov_welfare_catalog":
        from app.services.ingestion.large_scale_gov_crawler import generate_all_3000_schemes
        return generate_all_3000_schemes()
    return REAL_GOV_FEEDS.get(source_key, [])


def get_feed_etag(source_key: str) -> str:
    """Computes a deterministic ETag for the feed."""
    data = get_gov_feed(source_key)
    serialized = json.dumps(data, sort_keys=True)
    return f'W/"{hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]}"'

