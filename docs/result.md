# 상담예약 시스템 - 제출 문서

> 이 문서를 참고하여 총 **3개 PDF**를 작성합니다.

## 제출물 체크리스트

| # | 제출물 | 과제 | 소스 | 상태 |
|---|--------|------|------|------|
| 1 | 설계 문서 (PDF) | 과제1 | docs/design.md (Notion → PDF) | ⬜ |
| 2 | 실행 가이드문서 (PDF) | 과제2 | 이 문서의 "문서 2" 섹션 | ⬜ |
| 3 | 스크린샷 및 설명 (PDF) | 과제2 | 이 문서의 "문서 3" 섹션 | ⬜ |
| 4 | GitHub 저장소 | 과제2 | 이미 push 완료 | ✅ |

---

# 📄 문서 1: 설계 문서 (과제1)

> **docs/design.md** 하나로 통합된 설계 문서입니다.
> Notion에 붙여넣기 → PDF 내보내기로 제출하세요.
> (이미 Notion 페이지에 업로드 완료: bio-com 페이지)

### 문서 구성

| 섹션 | 내용 | 요구사항 항목 |
|------|------|---------------|
| 1. 시스템 아키텍처 설계 | 전체 구조도, 계층 구조, 계층 간 데이터 흐름 | 시스템 아키텍처 설계 |
| 2. 동시성 제어 및 트랜잭션 | Race Condition, 비관적 락, 트랜잭션 처리 | 동시성 제어 및 트랜잭션 |
| 3. 데이터베이스 | ERD, 관계 정의, 인덱스 설계, 정규화 | 데이터베이스 |
| 4. 보안 | JWT 인증, 권한 관리, 입력값 검증, SQL Injection 방어 | 보안 |
| 5. 개발 환경 및 배포 | Docker 구성, AWS/GCP 배포 시나리오 | 개발 환경 및 배포 |
| 6. Trade-off 의사결정 요약 | 6개 주요 결정의 선택 이유 및 Trade-off | 평가 핵심 요소 |

### 요구사항 매핑 확인

| 설계 요구사항 | design.md 섹션 | 포함 여부 |
|--------------|----------------|-----------|
| 전체 시스템 구조도 (프론트-백엔드-DB 연결) | 1.1 전체 시스템 구조 | ✅ |
| Controller-Service-Repository 패턴 | 1.2 계층 구조 | ✅ |
| 계층 간 데이터 흐름 | 1.3 계층 간 데이터 흐름 | ✅ |
| 동시 예약시도 처리방안 (Race Condition) | 2.1 ~ 2.2 | ✅ |
| 기본 트랜잭션 처리 방법 | 2.3 ~ 2.4 | ✅ |
| ERD 설계 (테이블 간 관계 정의) | 3.1 ~ 3.2 | ✅ |
| 기본 쿼리 최적화 고려사항 | 3.3 인덱스 설계 + 3.4 정규화 | ✅ |
| JWT 인증 구조 | 4.1 JWT 인증 구조 | ✅ |
| 기본 권한 관리 (관리자/사용자 구분) | 4.2 권한 관리 | ✅ |
| 입력값 검증, SQL Injection 방어 | 4.3 + 4.4 | ✅ |
| Docker 기반 개발 환경 구성 방법 | 5.1 Docker 기반 개발 환경 | ✅ |
| 배포 시나리오 (AWS/GCP 활용) | 5.2 + 5.3 | ✅ |
| Trade-off 의사결정 근거 | 6. Trade-off 의사결정 요약 + 각 섹션 | ✅ |

> **중요**: 평가에서 가장 중요한 요소는 **설계 의사결정의 근거(Trade-off)**입니다.
> 섹션 6에 요약 + 각 섹션 내에 개별 Trade-off가 포함되어 있습니다.

---

# 📄 문서 2: 실행 가이드문서

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 상담예약 시스템 |
| 기술 스택 | React (Vite) + NestJS + PostgreSQL |
| 애플리케이션 구성 | 상담사 페이지, 신청자 페이지, 백엔드 API (총 3개) |
| 핵심 기능 | 스케줄 관리, 이메일 초대, 예약 신청, 동시성 제어(최대 3명), 상담 기록 |

---

## 2. 사전 요구사항

| 소프트웨어 | 버전 | 비고 |
|-----------|------|------|
| Node.js | 18 이상 | https://nodejs.org |
| PostgreSQL | 15 이상 | Docker 사용 시 자동 설치 |
| Docker Desktop | 최신 | Docker로 실행 시 필요 |
| Git | 최신 | 저장소 클론용 |

---

## 3. 실행 방법 A: Docker Compose (권장)

### 3-1. 저장소 클론
```bash
git clone {저장소 URL}
cd {프로젝트 폴더}
```

### 3-2. 환경변수 설정
프로젝트 루트에 `.env` 파일 생성:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=consultation

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Email (SMTP) - Gmail 앱 비밀번호 사용
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App URLs
ADMIN_URL=http://localhost:3000
CLIENT_URL=http://localhost:3001
API_URL=http://localhost:4000
```

> **Gmail 앱 비밀번호 생성 방법**
> 1. Google 계정 → 보안 → 2단계 인증 활성화
> 2. 앱 비밀번호 생성 (메일 선택) → 16자리 코드 발급
> 3. SMTP_PASS에 발급받은 코드 입력

### 3-3. Docker Compose 실행
```bash
docker-compose up --build
```

### 3-4. 접속 확인

| 서비스 | URL | 설명 |
|--------|-----|------|
| 상담사 페이지 | http://localhost:3000 | 관리자 화면 |
| 신청자 페이지 | http://localhost:3001 | 예약 신청 화면 |
| 백엔드 API | http://localhost:4000 | REST API |
| Swagger 문서 | http://localhost:4000/api/docs | API 명세 |

### 3-5. 종료
```bash
docker-compose down
```

---

## 4. 실행 방법 B: 로컬 개별 실행

### 4-1. PostgreSQL 실행
Docker로 DB만 실행하거나 로컬 PostgreSQL 사용:
```bash
# Docker로 DB만 실행
docker run -d --name consultation-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=consultation \
  -p 5432:5432 \
  postgres:15-alpine
```

### 4-2. 백엔드 실행
```bash
cd backend
npm install
# backend/.env 파일 생성 (위 .env 내용과 동일)
npm run start:dev
```
→ http://localhost:4000 에서 실행 확인

### 4-3. 상담사 페이지 실행
```bash
cd frontend-admin
npm install
# .env 파일 생성: VITE_API_URL=http://localhost:4000/api
npm run dev
```
→ http://localhost:3000 에서 실행 확인

### 4-4. 신청자 페이지 실행
```bash
cd frontend-client
npm install
# .env 파일 생성: VITE_API_URL=http://localhost:4000/api
npm run dev
```
→ http://localhost:3001 에서 실행 확인

---

## 5. 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 상담사1 | counselor1@example.com | password123 |
| 상담사2 | counselor2@example.com | password123 |

> 시드 데이터로 자동 생성됩니다. (서버 최초 실행 시 TypeORM synchronize로 테이블 생성 + 시드)

---

## 6. 프로젝트 구조

```
/
├── backend/                 # NestJS 백엔드 (포트 4000)
│   ├── src/
│   │   ├── auth/            # 인증 모듈 (JWT)
│   │   ├── bookings/        # 예약 모듈 (동시성 제어)
│   │   ├── schedules/       # 스케줄 모듈 (CRUD)
│   │   ├── invitations/     # 초대 링크 모듈
│   │   ├── consultation-records/  # 상담 기록 모듈
│   │   ├── email/           # 이메일 발송 모듈
│   │   ├── entities/        # TypeORM 엔티티
│   │   └── common/          # 공통 (필터, 인터셉터)
│   └── Dockerfile
├── frontend-admin/          # React 상담사 페이지 (포트 3000)
│   ├── src/
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── components/      # 공통 컴포넌트
│   │   ├── lib/             # API 클라이언트
│   │   └── stores/          # 상태 관리 (Zustand)
│   └── Dockerfile
├── frontend-client/         # React 신청자 페이지 (포트 3001)
│   ├── src/
│   │   ├── pages/           # 예약 관련 페이지
│   │   └── lib/             # API 클라이언트
│   └── Dockerfile
├── docker-compose.yml       # 개발 환경 구성
├── .env                     # 환경변수
└── docs/                    # 설계 문서
```

---

## 7. API 목록 요약

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /api/auth/login | 상담사 로그인 | - |
| POST | /api/auth/logout | 상담사 로그아웃 | JWT |
| GET | /api/schedules | 스케줄 목록 조회 | JWT |
| POST | /api/schedules | 스케줄 생성 | JWT |
| PUT | /api/schedules/:id | 스케줄 수정 | JWT |
| DELETE | /api/schedules/:id | 스케줄 삭제 | JWT |
| GET | /api/schedules/available | 예약 가능 스케줄 (신청자용) | 토큰 |
| POST | /api/bookings | 예약 신청 | 토큰 |
| GET | /api/bookings | 예약 목록 조회 | JWT |
| GET | /api/bookings/:id | 예약 상세 조회 | JWT |
| POST | /api/bookings/:id/records | 상담 기록 작성 | JWT |
| PUT | /api/bookings/:id/records | 상담 기록 수정 | JWT |
| POST | /api/invitations | 초대 링크 발송 | JWT |
| GET | /api/invitations/validate | 초대 토큰 검증 | - |

---

---

# 📄 문서 3: 스크린샷 및 설명

> 아래 순서대로 각 화면을 스크린샷 찍고, 해당 설명을 함께 PDF에 넣으세요.

---

## 1. 상담사 로그인

**화면**: http://localhost:3000

**스크린샷 포인트**: 로그인 폼 (이메일, 비밀번호 입력 필드, 로그인 버튼)

**설명**:
- 상담사(관리자)가 이메일과 비밀번호로 로그인합니다.
- JWT 토큰 기반 인증으로, 로그인 성공 시 토큰을 발급받아 이후 API 요청에 사용합니다.
- 테스트 계정: counselor1@example.com / password123

---

## 2. 스케줄 관리 (캘린더)

**화면**: 로그인 후 기본 페이지 (스케줄 관리)

**스크린샷 포인트**:
1. 월간 캘린더 뷰 + 스케줄이 있는 날짜에 파란 점 표시
2. 날짜 클릭 시 해당일 스케줄 목록 (시간, 예약 현황 n/3명)
3. "스케줄 추가" 모달 (시간 선택)

**설명**:
- 캘린더를 통해 30분 단위 상담 스케줄을 생성/수정/삭제합니다.
- 각 스케줄은 최대 3명까지 예약 가능하며, 현재 예약 수가 표시됩니다.
- 시간을 선택하면 자동으로 30분 뒤 종료 시간이 계산됩니다. (예: 09:00 → 09:00~09:30)

---

## 3. 초대 링크 발송

**화면**: 사이드바 → 초대 링크

**스크린샷 포인트**:
1. 이메일 입력 필드 + "초대 링크 발송" 버튼
2. 발송 성공 메시지
3. 수신된 이메일 (초대 링크 포함)

**설명**:
- 상담 희망자에게 이메일로 예약 신청 링크를 발송합니다.
- SMTP(Gmail) 연동으로 실제 이메일이 발송됩니다.
- 초대 링크에는 고유 토큰이 포함되며, 7일 후 만료됩니다.

---

## 4. 신청자 예약 페이지

**화면**: http://localhost:3001/booking?token={토큰}

**스크린샷 포인트**:
1. 상담사 이름 표시 + 캘린더에서 날짜 선택
2. 시간대 목록 (예약 가능/마감 표시)
3. 신청자 정보 입력 폼 (이름, 이메일, 연락처)

**설명**:
- 이메일로 받은 링크를 통해 접속하면 해당 상담사의 예약 가능한 스케줄이 표시됩니다.
- 캘린더에서 날짜를 선택하면 해당일의 시간대와 잔여 예약 수가 보입니다.
- 3명이 모두 예약된 시간은 "마감"으로 표시되어 선택할 수 없습니다.

---

## 5. 예약 완료

**화면**: 예약 신청 후 완료 페이지

**스크린샷 포인트**: 예약 완료 메시지 + 예약 정보 요약 (날짜, 시간, 이름)

**설명**:
- 예약 신청이 성공하면 완료 페이지로 이동합니다.
- 예약된 날짜, 시간, 신청자 정보가 요약 표시됩니다.

---

## 6. 예약 관리 (상담사)

**화면**: 사이드바 → 예약 관리

**스크린샷 포인트**:
1. 예약 목록 테이블 (날짜, 시간, 신청자명, 이메일, 상태)
2. 상태 필터 버튼 (전체/확정/완료/취소)

**설명**:
- 상담사가 본인에게 들어온 예약 신청 내역을 조회할 수 있습니다.
- 상태 필터(전체/확정/완료/취소)로 예약을 분류하여 조회할 수 있습니다.

---

## 7. 상담 기록 작성/수정

**화면**: 예약 관리 → 작성/수정 버튼 클릭

**스크린샷 포인트**:
1. "작성" 버튼 클릭 → 상담 기록 입력 모달
2. 저장 후 "수정" 버튼으로 변경된 모습

**설명**:
- 각 예약에 대해 상담 내용을 기록할 수 있습니다.
- 기록이 없는 예약은 "작성" 버튼, 기록이 있는 예약은 "수정" 버튼이 표시됩니다.
- 상담 기록은 예약당 1개씩 1:1로 관리됩니다.

---

## 8. 동시성 제한 (최대 3명)

**화면**: 신청자 페이지에서 마감 표시

**스크린샷 포인트**:
1. 3명 예약 완료된 스케줄 → "마감" 표시 + 선택 불가 (회색 처리)
2. 스케줄 관리에서 예약 3/3명 표시

**설명**:
- 동일 시간대에 최대 3명까지만 예약 가능합니다.
- 비관적 락(Pessimistic Lock) + 트랜잭션으로 동시 요청 시에도 데이터 정합성을 보장합니다.
- 3명이 모두 예약되면 신청자 페이지에서 해당 시간은 자동으로 마감 처리됩니다.

---

## 9. 에러 처리

**화면**: 에러 케이스들

**스크린샷 포인트**:
1. 잘못된 토큰으로 접속 → "유효하지 않은 링크" 페이지
2. 로그아웃 후 보호된 페이지 접근 → 로그인 페이지 리다이렉트

**설명**:
- 유효하지 않거나 만료된 초대 토큰으로 접속 시 안내 페이지가 표시됩니다.
- 인증되지 않은 사용자가 관리자 페이지에 접근하면 로그인 페이지로 리다이렉트됩니다.

---

## 10. Swagger API 문서

**화면**: http://localhost:4000/api/docs

**스크린샷 포인트**: Swagger UI 전체 화면 (API 목록이 보이는 상태)

**설명**:
- NestJS Swagger를 통해 전체 API 명세가 자동 생성됩니다.
- 인증, 스케줄, 예약, 상담기록, 초대링크 API를 그룹별로 확인할 수 있습니다.
- Swagger에서 직접 API를 테스트할 수 있습니다.

---

## 스크린샷 작성 팁

1. **브라우저 전체 화면**으로 캡처 (URL 바 포함)
2. **데이터가 있는 상태**에서 캡처 (빈 화면 X)
3. 각 스크린샷 아래에 위 **설명** 텍스트를 붙여넣기
4. 번호 순서대로 정리하면 자연스러운 사용 흐름이 됩니다
5. 총 10~15장 정도면 충분합니다
