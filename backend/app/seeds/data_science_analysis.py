import csv
import json
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

OUTPUT_DIR = Path("/home/neon/.gemini/antigravity/brain/39c2ffcb-2488-4669-81ed-c45cbdb8675a")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR = Path("/home/neon/programs/side_project/scheme-backend/backend/knowledge/data")

# 1. Load Data
schemes_df = pd.read_csv(DATA_DIR / "schemes.csv")
benefits_df = pd.read_csv(DATA_DIR / "benefits.csv")
rules_df = pd.read_csv(DATA_DIR / "eligibility_rules.csv")
docs_df = pd.read_csv(DATA_DIR / "required_documents.csv")

# Clean amounts
benefits_df['amount_inr'] = pd.to_numeric(benefits_df['amount_inr'], errors='coerce')
merged_df = schemes_df.merge(benefits_df, left_on='slug', right_on='scheme_slug', suffixes=('', '_benefit'))

# Merge rules count and docs count if not present
rule_counts = rules_df.groupby('scheme_slug').size().reset_index(name='actual_rules_count')
doc_counts = docs_df.groupby('scheme_slug').size().reset_index(name='actual_docs_count')

merged_df = merged_df.merge(rule_counts, left_on='slug', right_on='scheme_slug', how='left')
merged_df = merged_df.merge(doc_counts, left_on='slug', right_on='scheme_slug', how='left')
merged_df['actual_rules_count'] = merged_df['actual_rules_count'].fillna(0)
merged_df['actual_docs_count'] = merged_df['actual_docs_count'].fillna(0)

# 2. Descriptive Statistics on Benefit Amount
amounts = merged_df['amount_inr'].dropna()
non_zero_amounts = amounts[amounts > 0]

desc = amounts.describe(percentiles=[0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99])
q1 = amounts.quantile(0.25)
q3 = amounts.quantile(0.75)
iqr = q3 - q1
lower_fence = max(0, q1 - 1.5 * iqr)
upper_fence = q3 + 1.5 * iqr
extreme_upper = q3 + 3.0 * iqr

outliers = merged_df[merged_df['amount_inr'] > upper_fence]
extreme_outliers = merged_df[merged_df['amount_inr'] > extreme_upper]
zero_benefits = merged_df[merged_df['amount_inr'] == 0]

print("=== DESCRIPTIVE STATISTICS: BENEFIT AMOUNT (INR) ===")
print(f"Total schemes with amount: {len(amounts):,}")
print(f"Mean: ₹{amounts.mean():,.2f}")
print(f"Standard Deviation: ₹{amounts.std():,.2f}")
print(f"Median (Q2): ₹{amounts.median():,.2f}")
print(f"IQR (Q3 - Q1): ₹{iqr:,.2f} (Q1=₹{q1:,.2f}, Q3=₹{q3:,.2f})")
print(f"IQR Upper Fence (Outlier Threshold): ₹{upper_fence:,.2f}")
print(f"Extreme Upper Fence: ₹{extreme_upper:,.2f}")
print(f"Total Outliers (> ₹{upper_fence:,.2f}): {len(outliers)} ({len(outliers)/len(amounts)*100:.1f}%)")
print(f"Total Extreme Outliers (> ₹{extreme_upper:,.2f}): {len(extreme_outliers)} ({len(extreme_outliers)/len(amounts)*100:.1f}%)")
print(f"Zero-amount schemes (in-kind/non-monetary): {len(zero_benefits):,}")

# Set style
sns.set_theme(style="whitegrid", font_scale=1.1)
palette = sns.color_palette("mako")

# -------------------------------------------------------------
# PLOT 1: Overall Box and Whisker Plot (Benefit Amount)
# -------------------------------------------------------------
fig, (ax_box, ax_hist) = plt.subplots(
    2, 1, figsize=(12, 9), sharex=True, gridspec_kw={'height_ratios': [0.4, 0.6]}
)

# Use Log scale for wide financial span
log_amounts = np.log10(non_zero_amounts)

sns.boxplot(
    x=log_amounts, ax=ax_box, color="#0D9488", fliersize=4,
    flierprops={"marker": "o", "markerfacecolor": "#E11D48", "markeredgecolor": "none", "alpha": 0.6}
)
ax_box.set(xlabel='')
ax_box.set_title("Box and Whisker Plot: Welfare Scheme Benefit Amounts (Log10 Scale)", fontsize=14, weight='bold', pad=12)

# Mark fences on box plot
q1_log = np.log10(q1) if q1 > 0 else 1
q3_log = np.log10(q3)
median_log = np.log10(amounts.median())

ax_box.axvline(median_log, color="#F59E0B", linestyle="--", linewidth=2, label=f"Median: ₹{amounts.median():,.0f}")
ax_box.axvline(np.log10(upper_fence), color="#EF4444", linestyle=":", linewidth=2, label=f"1.5x IQR Fence: ₹{upper_fence:,.0f}")
ax_box.legend(loc='upper right', frameon=True)

# Histogram & KDE
sns.histplot(log_amounts, kde=True, ax=ax_hist, color="#0F766E", bins=30)
ax_hist.set_title("Distribution Density of Financial Benefits", fontsize=13, weight='bold')
ax_hist.set_xlabel("Benefit Amount (Log10 INR: 3=₹1k, 4=₹10k, 5=₹1L, 6=₹10L, 7=₹1Cr)", fontsize=12)
ax_hist.set_ylabel("Number of Schemes", fontsize=12)

# Custom tick labels
tick_positions = [3, 4, 5, 6, 7]
tick_labels = ["₹1,000", "₹10,000", "₹1 Lakh", "₹10 Lakh", "₹1 Crore"]
ax_hist.set_xticks(tick_positions)
ax_hist.set_xticklabels(tick_labels)

plt.tight_layout()
plot1_path = OUTPUT_DIR / "boxplot_benefit_amounts.png"
plt.savefig(plot1_path, dpi=200)
plt.close()
print(f"Saved: {plot1_path}")

# -------------------------------------------------------------
# PLOT 2: Boxplot by Sector Category
# -------------------------------------------------------------
plt.figure(figsize=(14, 8))
order = merged_df.groupby('category')['amount_inr'].median().sort_values(ascending=False).index

merged_filtered = merged_df[merged_df['amount_inr'] > 0].copy()
merged_filtered['log_amount'] = np.log10(merged_filtered['amount_inr'])

ax = sns.boxplot(
    data=merged_filtered, x='category', y='log_amount', order=order,
    palette="viridis", fliersize=4,
    flierprops={"marker": "d", "markerfacecolor": "#DC2626", "alpha": 0.5}
)
plt.title("Box and Whisker Comparison across Sector Categories", fontsize=15, weight='bold', pad=15)
plt.xlabel("Sector Category", fontsize=12, weight='bold')
plt.ylabel("Benefit Amount", fontsize=12, weight='bold')
plt.xticks(rotation=25, ha='right')
ax.set_yticks(tick_positions)
ax.set_yticklabels(tick_labels)

# Annotate median values
medians = merged_filtered.groupby('category')['amount_inr'].median()[order]
for i, (cat, med) in enumerate(medians.items()):
    ax.text(i, np.log10(med) + 0.1, f"₹{med/1000:,.0f}k" if med < 100000 else f"₹{med/100000:,.1f}L",
            horizontalalignment='center', size=10, weight='bold', color='#1E293B')

plt.tight_layout()
plot2_path = OUTPUT_DIR / "boxplot_by_category.png"
plt.savefig(plot2_path, dpi=200)
plt.close()
print(f"Saved: {plot2_path}")

# -------------------------------------------------------------
# PLOT 3: Multi-metric Complexity Boxplots (Rules, Docs, Amounts)
# -------------------------------------------------------------
fig, axes = plt.subplots(1, 3, figsize=(16, 6))

# Rules Count Boxplot
sns.boxplot(y=merged_df['actual_rules_count'], ax=axes[0], color="#6366F1", flierprops={"markerfacecolor": "#EF4444"})
axes[0].set_title("Eligibility Rules per Scheme", fontsize=13, weight='bold')
axes[0].set_ylabel("Count of Rules", fontsize=11)
q1_r, med_r, q3_r = merged_df['actual_rules_count'].quantile([0.25, 0.5, 0.75])
axes[0].text(0.1, med_r, f"Median: {int(med_r)}", weight='bold', color='#1E1B4B')

# Documents Count Boxplot
sns.boxplot(y=merged_df['actual_docs_count'], ax=axes[1], color="#EC4899", flierprops={"markerfacecolor": "#EF4444"})
axes[1].set_title("Required Documents per Scheme", fontsize=13, weight='bold')
axes[1].set_ylabel("Count of Documents", fontsize=11)
q1_d, med_d, q3_d = merged_df['actual_docs_count'].quantile([0.25, 0.5, 0.75])
axes[1].text(0.1, med_d, f"Median: {int(med_d)}", weight='bold', color='#831843')

# Benefit Types Count
top_benefit_types = merged_df['benefit_type'].value_counts()
sns.barplot(x=top_benefit_types.values[:6], y=top_benefit_types.index[:6], ax=axes[2], palette="crest")
axes[2].set_title("Benefit Archetypes Distribution", fontsize=13, weight='bold')
axes[2].set_xlabel("Total Schemes", fontsize=11)

plt.tight_layout()
plot3_path = OUTPUT_DIR / "boxplot_complexity_and_rules.png"
plt.savefig(plot3_path, dpi=200)
plt.close()
print(f"Saved: {plot3_path}")

# Save JSON metrics for report
summary_stats = {
    "total_schemes": len(schemes_df),
    "schemes_with_benefit": len(benefits_df),
    "amount_stats": {
        "count": int(desc['count']),
        "mean": float(desc['mean']),
        "std": float(desc['std']),
        "min": float(desc['min']),
        "p25": float(q1),
        "median": float(desc['50%']),
        "p75": float(q3),
        "max": float(desc['max']),
        "iqr": float(iqr),
        "upper_fence": float(upper_fence),
        "extreme_upper": float(extreme_upper),
        "outliers_count": len(outliers),
        "extreme_outliers_count": len(extreme_outliers),
    },
    "top_5_high_outliers": [
        {"title": r['title'], "category": r['category'], "amount_inr": r['amount_inr'], "benefit": r['title_benefit']}
        for _, r in merged_df.sort_values('amount_inr', ascending=False).head(5).iterrows()
    ],
    "sample_lakh_schemes": [
        {"title": r['title'], "amount_inr": r['amount_inr'], "benefit_details": str(r['details'])[:80]}
        for _, r in merged_df[merged_df['amount_inr'].isin([500000.0, 1000000.0])].head(5).iterrows()
    ]
}

with open(OUTPUT_DIR / "data_science_summary.json", "w") as f:
    json.dump(summary_stats, f, indent=2)
print("Data Science analysis complete!")
