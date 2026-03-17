# NUM Stud API - Observed Auth and Endpoint Inventory

Generated: 2026-02-25

This document combines:
- live network capture during login/session bootstrap
- endpoint extraction from `stud-sisi-student.postman_collection.json`

Sensitive values (passwords, cookies, tokens, SIH, personal data) are intentionally redacted.

## 1) Observed login/auth flow

1. `GET https://auth.num.edu.mn/oauth2/account/auth` -> login page
2. `POST https://auth.num.edu.mn/oauth2/account/auth` -> `302`
3. `GET https://auth.num.edu.mn/oauth2/account/auth2?auth_type=...` -> second auth step
4. `POST https://auth.num.edu.mn/oauth2/account/auth2` -> `302`
5. `GET/POST https://auth.num.edu.mn/oauth2/account/login?ReturnUrl=...` -> `302`
6. `GET https://auth.num.edu.mn/oauth2/OAuth/Authorize?client_id=...&redirect_uri=...&state=...&scope=...&response_type=...` -> `302`
7. `GET https://auth.num.edu.mn/resource/Me` -> authenticated profile context
8. `GET https://phost.num.edu.mn/students/AccessByMe` -> student image/jpeg

## 2) Observed API bootstrap calls (live capture)

- `POST https://stud-api.num.edu.mn/main/info?sih=<redacted>` (200 JSON)
- `POST https://stud-api.num.edu.mn/main/menulist?sih=<redacted>` (200 JSON)

Notes:
- `sih` is required on many `stud/main/*` endpoints.
- Frontend commonly uses `application/x-www-form-urlencoded` for POST.

## 3) Endpoint inventory (from Postman collection)

### Auth/profile
- `GET {{auth_base}}/resource/Me`
- `GET {{auth_base}}/oauth2/account/logout`
- `GET {{phost_base}}/students/AccessByMe`
- `GET {{phost_base}}/journal`

### Main/home
- `POST {{support2_base}}/stud/main/GetStudCurrentCourses?sih={{sih}}`
- `POST {{support2_base}}/stud/main/StudNews?sih={{sih}}&curid={{curId}}`
- `POST {{support2_base}}/stud/main/getManagementStatus?sih={{sih}}`
- `POST {{support2_base}}/stud/main/info?sih={{sih}}`
- `POST {{support2_base}}/stud/main/info?sih={{sih}}&curID={{curId}}`
- `POST {{support2_base}}/stud/main/menulist?sih={{sih}}`
- `POST {{support2_base}}/stud/main/curriculumGroup?sih={{sih}}&curID={{curId}}`
- `POST {{support2_base}}/stud/main/upperEnglish?sih={{sih}}&curID={{curId}}`
- `POST {{support2_base}}/stud/main/gpa?sih={{sih}}&curID={{curId}}`
- `POST {{support2_base}}/stud/main/transcripts?sih={{sih}}&curID={{curId}}`
- `POST {{support2_base}}/stud/main/transcriptStatistic?sih={{sih}}&curID={{curId}}`
- `POST {{support2_base}}/stud/main/resultwords`
- `POST {{support2_base}}/stud/main/RequestStatus?sih={{sih}}&curID={{curId}}`
- `GET {{support2_base}}/stud/main/getManuals`
- `POST {{support2_base}}/stud/main/docs`
- `POST {{support2_base}}/stud/main/currentyr`
- `POST {{support2_base}}/stud/main/getPaymentSemesters`

### Schedule/balance/card
- `POST {{support2_base}}/stud/Schedule/CourseSchedule?sih={{sih}}`
- `POST {{support2_base}}/stud/Schedule/ExamSchedule?sih={{sih}}`
- `POST {{support2_base}}/stud/BalanceAccount/StudBalance?sih={{sih}}&curid={{curId}}&year={{year}}&sem={{sem}}`
- `POST {{support2_base}}/stud/BalanceAccount/bankAccounts?sih={{sih}}`
- `POST {{support2_base}}/stud/BalanceAccount/befUldegdel?sih={{sih}}&year={{year}}&sem={{sem}}`
- `POST {{support2_base}}/stud/BalanceAccount/lastUldegdel?sih={{sih}}`
- `GET {{support2_base}}/stud/card/list?sih={{sih}}`

### Student success/top menus
- `POST {{support2_base}}/stud/studsuccess/get/suc1`
- `POST {{support2_base}}/stud/studsuccess/get/suc2`
- `POST {{support2_base}}/stud/studsuccess/get/suc3`
- `POST {{support2_base}}/stud/studsuccess/get/suc4`
- `POST {{support2_base}}/stud/studsuccess/get/suc5`
- `POST {{support2_base}}/stud/topMenus/units?unitid={{unitId}}`
- `POST {{support2_base}}/stud/topMenus/courses?unitid={{unitId}}`
- `POST {{support2_base}}/stud/topMenus/TopSchedules?empid={{empId}}&roomid={{roomId}}&courseid={{courseId}}&unitid={{unitId}}`

### E-journal / teacher-side student views
- `GET {{teach_sisi_base}}/stud/getComponents`
- `GET {{teach_sisi_base}}/stud/getJournal?priv_hash={{sih}}&acid={{acid}}`
- `GET {{teach_sisi_base}}/stud/studAssessmentPartition?priv_hash={{sih}}&acid={{acid}}`
- `POST {{stud_ejournal_base}}/stud/file?dnum={{daalID}}&cid={{courseid}}&tid=0&sessionid={{session}}`

### Notification/report/tree endpoints
- `GET {{tree_base}}/comnity/notification/GetReciveNotification?app=13`
- `GET {{tree_base}}/comnity/Notification/ChangeState?session={{session}}`
- `GET {{tree_base}}/comnity/Notification/ChangeStateApp?session={{session}}`
- `POST {{tree_base}}/comnity/Mail/Report`
- `GET {{tree_base}}/comnity/Report/Types`

### Misc
- `POST {{support2_base}}/cache/cacheget`

## 4) Variables/bases used by collection

- `support2_base = https://support2.num.edu.mn/prod/api`
- `tree_base = https://tree.num.edu.mn`
- `phost_base = https://phost.num.edu.mn`
- `auth_base = https://auth.num.edu.mn`
- `teach_sisi_base = https://teach-sisi.num.edu.mn/api`
- `stud_ejournal_base = https://sisi.num.edu.mn/stud-ejournal`

## 5) MCP implementation notes

- Keep `sih` as a required auth/session parameter for student endpoints.
- Model endpoints by domain+route group (`main`, `Schedule`, `BalanceAccount`, `topMenus`, etc.).
- Add per-route parameter validation (`curId`, `year`, `sem`, `unitId`, `acid`, `session`, etc.).
- Add rate limiting and retry for production-safe probing.
