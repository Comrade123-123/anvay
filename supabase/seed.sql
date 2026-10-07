-- Demo data: the student and records the app currently shows. Safe to run more than once.
-- Demo student signs in with phone 9876543210 (any OTP flow is handled by the API; the demo OTP is 123456).

-- Re-running this file first clears the demo student's list data so nothing is duplicated.
delete from chat_messages  where student_id = '00000000-0000-4000-8000-000000000001';
delete from deadlines      where student_id = '00000000-0000-4000-8000-000000000001';
delete from grievances     where student_id = '00000000-0000-4000-8000-000000000001';
delete from notifications  where student_id = '00000000-0000-4000-8000-000000000001';
delete from payments       where student_id = '00000000-0000-4000-8000-000000000001';
delete from documents      where student_id = '00000000-0000-4000-8000-000000000001';

-- ----------------------------------------------------------------- schemes
insert into schemes (code, title, title_hi, category, amount_text, amount_value, summary, rules, documents, deadline) values
  ('PRE-ST-0910', 'Pre-Matric Scholarship for ST', 'प्री-मैट्रिक छात्रवृत्ति योजना', 'pre', '₹3,500/yr', 3500,
   'Class 9 & 10 in Govt schools · Family income up to ₹2.5 Lakh',
   '{"category":"ST","levels":["class9","class10"],"max_income":250000}',
   array['Aadhaar Card','ST Caste Certificate','Income Certificate','School Bonafide'], '2026-11-15'),
  ('PM-ST', 'Post-Matric Scholarship for ST Students', 'पोस्ट-मैट्रिक छात्रवृत्ति योजना', 'post', '₹18,500', 18500,
   'Centrally sponsored scheme for ST students after Class 10',
   '{"category":"ST","levels":["class11","class12","ug","pg"],"max_income":250000}',
   array['Aadhaar Card','ST Caste Certificate','Income Certificate','Marksheet','Admission Letter'], '2026-12-31'),
  ('TC-ST-HE', 'National Top Class Education Scholarship', 'राष्ट्रीय शीर्ष श्रेणी शिक्षा छात्रवृत्ति', 'higher', '₹1,25,000/yr', 200000,
   'Top 250 institutes (IIT, IIM, AIIMS) · Full tuition + living allowance',
   '{"category":"ST","levels":["ug","pg"],"max_income":800000,"institute_tier":"top"}',
   array['Aadhaar Card','ST Caste Certificate','Income Certificate','Marksheet','Admission Letter'], '2026-10-31'),
  ('NFST-PHD', 'National Fellowship (NFST)', 'राष्ट्रीय जनजातीय अध्येतावृत्ति योजना', 'fellowship', '₹38,000/mo', 38000,
   'M.Phil & Ph.D scholars · NET qualified or direct selection',
   '{"category":"ST","levels":["mphil","phd"],"requires":"pg_degree"}',
   array['Aadhaar Card','ST Caste Certificate','PG Degree','Research Proposal'], '2027-01-20'),
  ('NOS-ST', 'National Overseas Scholarship', 'राष्ट्रीय प्रवासी छात्रवृत्ति', 'overseas', 'Up to ₹20 Lakh', 2000000,
   'Masters & PhD abroad',
   '{"category":"ST","levels":["pg","phd"],"max_income":800000}',
   array['Aadhaar Card','ST Caste Certificate','Income Certificate','Admission Letter (Abroad)'], '2027-02-28')
on conflict (code) do nothing;

-- ---------------------------------------------------------------- student
insert into students (id, phone, name, name_hi, apaar_id, category, gender, dob, district, state, institute, course,
                      income_annual, ekyc_done, language, bank_name, account_last4, ifsc, aadhaar_seeded, npci_mapped)
values ('00000000-0000-4000-8000-000000000001', '9876543210', 'Ramesh Kumar Munda', 'रमेश कुमार मुंडा',
        'MOTA/PM/2026/JH/004512', 'ST', 'Male', '2003-08-14', 'Khunti', 'Jharkhand',
        'IIT Kharagpur', 'B.Tech, Computer Science & Engg', 540000, true, 'en',
        'State Bank of India', '4417', 'SBIN0001420', true, true)
on conflict (id) do nothing;

-- ------------------------------------------------- active application + stages
insert into applications (id, application_no, student_id, scheme_code, status, current_stage, residency, expected_amount, submitted_at)
values ('00000000-0000-4000-8000-0000000000a1', 'MOTA/PM/2026/JH/004512', '00000000-0000-4000-8000-000000000001',
        'PM-ST', 'in_review', 4, 'hostel', 18500, '2026-09-15 10:00+05:30')
on conflict (id) do nothing;

insert into application_stages (application_id, stage_no, title, title_hi, state, occurred_at, detail, desk, eta) values
  ('00000000-0000-4000-8000-0000000000a1', 1, 'Application Submitted', 'आवेदन प्रस्तुत', 'done', '2026-09-15 10:00+05:30',
   'Online Portal / DigiLocker e-Sign · 15/09/2026', null, null),
  ('00000000-0000-4000-8000-0000000000a1', 2, 'Auto-Verified', 'स्वतः सत्यापित', 'done', '2026-09-16 09:30+05:30',
   'State Scholarship Portal · 16/09/2026', null, null),
  ('00000000-0000-4000-8000-0000000000a1', 3, 'Institute Confirmed', 'संस्थान द्वारा पुष्टि', 'done', '2026-09-18 12:15+05:30',
   'Institute Nodal Officer · 18/09/2026', null, null),
  ('00000000-0000-4000-8000-0000000000a1', 4, 'District Review', 'जिला समीक्षा', 'current', null,
   'District Welfare Officer, Ranchi · 22/09/2026', 'Desk 04 (Shri V. Markam)', 'ETA ~3 Days'),
  ('00000000-0000-4000-8000-0000000000a1', 5, 'State Sanction', 'राज्य स्वीकृति', 'upcoming', null,
   'State Tribal Welfare Commissioner, Ranchi · Expected 05/10/2026', null, null),
  ('00000000-0000-4000-8000-0000000000a1', 6, 'PFMS DBT Bank Credit', 'प्रत्यक्ष लाभ अंतरण', 'upcoming', null,
   'PFMS Treasury Nodal Officer · Expected 18/10/2026', null, null)
on conflict (application_id, stage_no) do nothing;

-- --------------------------------------------------------------- documents
insert into documents (student_id, kind, title, title_hi, issuer, status, verified_at, expires_on) values
  ('00000000-0000-4000-8000-000000000001', 'aadhaar',   'Aadhaar Card', 'आधार कार्ड', 'UIDAI', 'verified', '2026-09-10', null),
  ('00000000-0000-4000-8000-000000000001', 'st_caste',  'ST Caste Certificate', 'जाति प्रमाण पत्र', 'e-District Jharkhand', 'verified', '2026-09-10', null),
  ('00000000-0000-4000-8000-000000000001', 'income',    'Annual Income Certificate', 'आय प्रमाण पत्र', 'Tehsil Office, Khunti', 'verified', '2026-09-10', '2026-10-20'),
  ('00000000-0000-4000-8000-000000000001', 'residence', 'Permanent Resident Certificate', 'मूल निवास प्रमाण पत्र', 'Revenue Dept., Govt. of Jharkhand', 'verified', '2026-09-10', null),
  ('00000000-0000-4000-8000-000000000001', 'marksheet', 'Class 10 & 12 Marksheets', 'अंकसूची', 'CBSE / National Academic Depository (NAD)', 'verified', '2026-09-10', null),
  ('00000000-0000-4000-8000-000000000001', 'bonafide',  'Bonafide Student Certificate', 'अध्ययन प्रमाण पत्र', 'IIT Kharagpur Academic Registry', 'verified', '2026-09-12', null),
  ('00000000-0000-4000-8000-000000000001', 'admission', 'Admission Letter (IIT Kharagpur)', 'प्रवेश पत्र', 'IIT Kharagpur', 'rejected', null, null);

update documents set problems = array['blurry'] where kind = 'admission'
  and student_id = '00000000-0000-4000-8000-000000000001' and problems = '{}';

-- ---------------------------------------------------------------- payments
insert into payments (student_id, application_id, label, source, amount, status, fy, paid_on, reference, failure_reason, failure_ref) values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1',
   'Post-Matric Scholarship (AY 2025-26)', 'MOTA CENTRAL SECTOR', 18500, 'credited', '2025-26', '2025-10-18', 'PFMS-JH-2025-77412', null, null),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1',
   'Maintenance Allowance (Installment 2)', 'STATE SHARE COMPONENT', 9250, 'processing', '2025-26', '2026-01-12', null, null, null),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1',
   'Book Grant (Installment 1)', 'MOTA CENTRAL SECTOR', 3000, 'failed', '2025-26', '2025-12-02', null,
   'Secondary bank account is not mapped with the NPCI DBT mapper', 'NPCI-ERR-4091');

-- ----------------------------------------------------------- notifications
insert into notifications (student_id, category, tone, icon, title, body, link_label, link_to, unread, created_at) values
  ('00000000-0000-4000-8000-000000000001', 'payments', 'green', 'cash-multiple', '₹9,250 credited',
   'Post-Matric instalment credited to SBI ••••4417', 'View payment', 'dbt', true, '2026-09-29 10:12+05:30'),
  ('00000000-0000-4000-8000-000000000001', 'applications', 'blue', 'check-decagram-outline', 'Institute verified your application',
   'IIT Kharagpur confirmed your enrollment for 2026-27', null, null, true, '2026-09-29 09:05+05:30'),
  ('00000000-0000-4000-8000-000000000001', 'deadlines', 'amber', 'calendar-check', 'Top Class application closes in 32 days',
   'Deadline 31/10/2026. You are eligible.', 'Apply now', 'schemes', true, '2026-09-28 18:30+05:30'),
  ('00000000-0000-4000-8000-000000000001', 'applications', 'red', 'file-alert-outline', 'Admission letter needs re-upload',
   'The scan was blurry. Retake it in good light.', 'Re-upload now', 'wallet', false, '2026-09-27 11:00+05:30'),
  ('00000000-0000-4000-8000-000000000001', 'general', 'blue', 'forum-outline', 'JAGO replied to your question',
   'Your documents list for Top Class is ready', null, null, false, '2026-09-27 10:45+05:30');

-- -------------------------------------------------------------- grievances
insert into grievances (ticket_no, student_id, application_id, category, title, description, status, assigned_to, progress, due_on, resolved_on, created_at) values
  ('GRV/2026/00412', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1',
   'Payment not received', 'Instalment 1 not credited',
   'Second instalment for academic year 2026-27 has not been credited despite institute verification.',
   'in_progress', 'District Welfare Officer, Ranchi', 60, '2026-10-06', null, '2026-09-29 11:00+05:30'),
  ('GRV/2026/00288', '00000000-0000-4000-8000-000000000001', null,
   'Name / details mismatch', 'Name mismatch in certificate', 'Name on the caste certificate did not match Aadhaar.',
   'resolved', 'Institute Nodal Officer', 100, '2026-09-22', '2026-09-18', '2026-09-14 15:00+05:30');

-- --------------------------------------------------------------- deadlines
insert into deadlines (student_id, kind, title, subtitle, due_on, link_to) values
  ('00000000-0000-4000-8000-000000000001', 'action',   'Re-upload income certificate', 'Post-Matric 2026-27 · Action needed', '2026-10-05', 'wallet'),
  ('00000000-0000-4000-8000-000000000001', 'deadline', 'Income certificate expires', 'Renew at e-District, Jharkhand', '2026-10-20', null),
  ('00000000-0000-4000-8000-000000000001', 'deadline', 'Top Class application closes', 'Ministry of Tribal Affairs', '2026-10-31', 'scheme'),
  ('00000000-0000-4000-8000-000000000001', 'renewal',  'Post-Matric renewal opens', 'Renewal for 2027-28', '2026-11-15', null),
  ('00000000-0000-4000-8000-000000000001', 'payment',  'Expected instalment credit', '₹9,250 to SBI ••••4417', '2026-12-01', 'dbt');

-- ------------------------------------------------------------ chat history
insert into chat_messages (student_id, role, kind, body, created_at) values
  ('00000000-0000-4000-8000-000000000001', 'bot', 'text', 'नमस्ते रमेश! मैं JAGO हूँ, आपका छात्रवृत्ति सहायक। मैं आपकी छात्रवृत्ति में कैसे मदद करूँ?', '2026-09-29 10:42+05:30');
