# NIRMAN synthetic dataset v1

> **SYNTHETIC DATA: for demonstration and pipeline testing only.** Every location assignment, project history, contractor record, milestone, quality input, holiday designation, weather value and outcome in this folder is synthetic or derived from synthetic data. None of it is verified real-world information, and model results on it are not evidence of real-world predictive accuracy.

## Contents

The dataset covers 225 projects and 30 contractors, using the existing IDs (`P0xxx`, `CTR-xx`). There are 8,789 monthly snapshots from 2012-10 to 2026-09. The data cutoff is 2026-09-01.

| File | Rows | What it is |
|---|---|---|
| `nirman_project_monthly_snapshots_with_contractor_features.csv` | 8,789 | **Notebook `PANEL_FILE`.** Same columns and values as v4 `db_fact_snapshots`, plus `milestone_on_time_rate` |
| `nirman_project_prediction_targets.csv` | 17,578 | **Notebook `TARGET_FILE`.** Same schema as `db_fact_targets` |
| `nirman_project_features.csv` | 225 | **Notebook `PROJ_FILE`.** State, district, city, `city_district`, sector, executing agency, plan and budget |
| `nirman_contract_register.csv` | 225 | Contract ID, award/start/end dates, value, actual completion, delay, final cost, status |
| `nirman_contractors.csv` | 30 | Generated name ("Contractor NN"), registration year and class, home state, `insufficient_history_flag` |
| `nirman_milestones.csv` | 1,808 | Milestone due date, completion date, on-time flag |
| `nirman_quality_inputs.csv` | 8,789 | `material_test_pass_pct`, `site_inspection_score`, `rework_pct` |
| `nirman_state_holiday_calendar.csv` | 20,128 | v4 festival rows with corrected dates (`date_v4_original` kept), `applies_in_state`, `correction_note`, `is_official_holiday` and impact windows |
| `nirman_monsoon_normals.csv` | 36 | Corrected SW-monsoon onset/withdrawal normals per state (v4 values kept alongside) |
| `nirman_weather_state_month.csv` | 6,480 | Per-year SW monsoon onset/withdrawal and rainfall % of normal |
| `nirman_calendar_features.csv` | 8,789 | `db_fact_calendar_features` columns plus impact-window flags and lagged weather |
| `SYNTHETIC_METADATA.json` | | Machine-readable synthetic label and provenance for every file |

**Usage:** put the three notebook files in the working directory of `NIRMAN_AI_MVP_v5`. Its future-risk cell (4.1b) then loads the panel, targets and project states without code changes.

## Column names

The data files carry no per-row synthetic flags. The synthetic status of the whole dataset is recorded here and in `SYNTHETIC_METADATA.json`, and applies to every file.

Removed flag columns:
- `location_source` (project features).
- `calendar_state_source` (calendar features).
- `holiday_list_source` (holiday calendar).
- `is_synthetic` and `is_observed_weather` (weather).

Renamed columns:

| Old name | New name |
|---|---|
| `is_official_holiday_synthetic` | `is_official_holiday` |
| `sw_monsoon_onset_date_synthetic` | `sw_monsoon_onset_date` |
| `sw_monsoon_withdrawal_date_synthetic` | `sw_monsoon_withdrawal_date` |
| `sw_monsoon_days_in_month_synthetic_obs` | `sw_monsoon_days_in_month_yearly` |
| `rainfall_pct_of_normal_synthetic` | `rainfall_pct_of_normal` |
| `sw_monsoon_days_prev_month_synthetic_obs` | `sw_monsoon_days_prev_month` |
| `rainfall_pct_of_normal_prev_month_synthetic` | `rainfall_pct_of_normal_prev_month` |

Contractor names are "Contractor NN". No values changed.

**The weather, holiday designations, locations, histories and outcomes are all generated, not observed.**

## How values were generated

The random seed is 20260928.

**Locations**
- Each project keeps its v4 state, which is itself synthetic.
- District and city are drawn from 2–3 real districts of that state, so every district and city belongs to exactly one state.
- Sector and executing agency are sampled as pairs from the PAIMANA baseline.

**Contracts**
- Each contract is awarded 20–95 days before the project starts.
- Start date, end date and value follow the plan.
- Actual completion, delay and final cost are taken from the panel's completion snapshot.

**Milestones**
- Each due or completion date falls in the month the panel's `milestones_planned` or `milestones_completed` count reaches that milestone. The counts reproduce exactly.
- Milestones not yet due at the cutoff are spread out up to the planned end.

**`milestone_on_time_rate`**
- This is the % of milestones due by the snapshot date that were completed on or before their due date.
- It uses only dates at or before the snapshot, and is blank when no milestone is due.
- The original `milestone_success_rate` is unchanged.

**Quality**
- The inputs satisfy `quality_score = 0.4·material_test_pass_pct + 0.4·site_inspection_score + 0.2·(100 − 5·rework_pct)` to within 0.05.

**Holidays**
- Statutory national holidays, 13 central-list festivals and all state-specific festivals are flagged as official (rule-based designation).
- Impact windows are 2 days before and 4 after for major multi-day festivals, and 0/1 for other holidays (`rule_v1`).

**Weather**
- Monsoon onset (±7 days) and withdrawal (±10 days) are jittered around the corrected normals in `nirman_monsoon_normals.csv`.
- Rainfall is expressed as % of normal.
- It is attached to snapshots with a **one-month lag**, so a month's weather is used only after that month has ended.

**Targets**
- Window is (t, t + H months].
- **Delay** = the planned completion date falls in the window and the project has not finished by that date.
- **Cost** = cumulative spend exceeds 1.1 × budget at a snapshot in the window.
- Labels whose outcome falls after the cutoff are left blank (`not_observable_yet`). Completion snapshots are `terminal_snapshot`.

## Real-world correctness checks and corrections

These checks cover the attributes that describe real places, dates and organisations. The project assignments themselves remain synthetic.

**Locations**
- Every district was checked against its state, and every city against its district, using current official names.
- Two names were updated:
  - Vijayawada is in **NTR** district (formed April 2022 from Krishna).
  - Port Blair is now **Sri Vijaya Puram** (renamed September 2024).
- **Jammu and Kashmir** is flagged as a union territory (it has been one since 31 Oct 2019; v4 had it as a state).

**Sector and agency**
- Agencies are placed only where they operate:
  - SECL: Chhattisgarh and Madhya Pradesh.
  - MCL: Odisha.
  - Coal: coal-bearing states only.
  - SAIL: steel-plant states.
  - NHPC: hydro states.
  - ONGC: producing states.
- Metro projects are placed only in metro cities, and there are no railway projects in Andaman & Nicobar or Ladakh.
- DGCA (a regulator, not a builder) is excluded as an executing agency.

**Festivals**

3,087 v4 rows are marked `applies_in_state = 0`, and 533 dates were corrected. Every change is recorded in `correction_note`.

Regional festivals are restricted to the states that actually observe them:

| Festival | Kept only in |
|---|---|
| Chhath | BR, JH, UP, DL |
| Bohag Bihu | AS, AR |
| Kali Puja | AS, OD, TR, WB |
| Rath Yatra | OD, WB, GJ |
| Karva Chauth | Northern states |
| Durga Puja | Removed from HP, MZ, NL |
| Saraswati Puja | Eastern states |
| Sarhul | JH, CT, OD |
| Gudi Padwa / Ugadi | Western and southern states |

Dates corrected:
- Raja → 14–15 June (was stored in July, Nov–Dec).
- Ganga Sagar Mela → 14 January (Makar Sankranti).
- Bathukamma → the day before Navratri (was stored in February).
- Holika Dahan → the eve of Holi.
- Ten 2023–2025 dates → the central holiday list: Diwali, Holi, Eid al-Fitr, Dussehra, Janmashtami and Guru Nanak Jayanti.

Excluded:
- Losar and Kharchi Puja: they were stored on wrong fixed or lunar dates.
- Nanda Devi Raj Jat outside 2014: it is held about every 12 years, not annually.
- Duplicate Ugadi and Losar entries.

**Monsoon normals**
- v4's onset dates for the north-east were off by about 7 weeks (mid-April instead of early June).
- v4 had Kerala's withdrawal on 30 July, and north-west India's before 17 September.
- They are replaced with the **IMD 2020 new normals**. Anchor dates were checked against IMD: Kerala 1 Jun, Chennai 4 Jun, Guwahati/Dimapur 4 Jun, Imphal 5 Jun, Kolkata/Mumbai 11 Jun and Delhi 27 Jun. North-west withdrawal starts 17 Sep, and east/north-east/central withdrawal is around 15 Oct.
- Other states are interpolated from IMD's isochrone map (±5 days).
- All monsoon calendar features were recomputed from the corrected normals.

**Festival features**
- Festival features are recomputed from the corrected, applicable, de-duplicated calendar.

## Validation (69/69 checks pass)

- **Originals:** the original database files are unchanged.
- **Alignment:**
  - Panel values are identical to v4.
  - Targets match v4 on all 17,578 rows.
  - The schemas match the existing tables.
- **Keys:** no duplicate keys in any file; all foreign keys resolve.
- **Contractors:** contractor assignment is consistent across files.
- **Locations:** every district and city maps to exactly one state.
- **Chronology:**
  - Award < start < planned end.
  - Completion falls after start and on or before the cutoff.
  - Snapshots run month by month with no gaps.
  - No negative costs or remaining budgets.
- **Reconciliation:**
  - Milestone counts reproduce the panel exactly.
  - Quality inputs reproduce `quality_score`.
  - Holiday counts recompute exactly.
- **Leakage:**
  - The on-time rate uses only milestones visible at each snapshot.
  - Weather is lagged by one month.
  - The panel has no outcome columns.
  - Unknown labels stay blank.
- **Real-world references:** 20 checks covering state/district/city, union-territory status, agency locations, fixed and statutory holiday dates, 13 festival dates against 2023–2025 central lists, regional festival states, duplicates, and IMD monsoon anchors.
- **Notebook dry-run:** cell 4.1b was run up to model fitting, with no training. It loaded 8,789 snapshots and 15,280 labelled rows, attached the 16-column calendar block with no nulls (re-run after the corrections), built the 3 contractor columns, and assembled every comparison arm.

## Limitations and cautions

- **The labels are not new outcomes.** They are the same as v4, which are synthetic. 125 projects are still ongoing, and labels whose window ends after the cutoff remain blank. Future outcomes were deliberately not invented.
- **The contract register holds final outcomes** (actual completion, delay, final cost). Never join it to snapshots as features.
- **`nirman_contractors.csv` is measured at the cutoff.** Do not join its counts to earlier snapshots; use the as-of `contractor_*` columns in the panel instead.
- **Contractor history is thin.** 8 of 30 contractors have fewer than 3 completed projects (`insufficient_history_flag = 1`).
- **Weather is SW monsoon only.** There is no synthetic NE-monsoon series.
- **Remaining festival uncertainty.** Dates outside the spot-checked 2023–2025 central-list festivals are still astronomical computations (±1 day). State holiday designations are synthetic, not taken from state gazettes.
- **The PAIMANA baseline file is not covered and was not changed.**
- **The notebook's own contractor block in cell 4.1b has known issues** (rolling windows ordered by project rather than time). These are not addressed here, because the notebook was not to be modified.
