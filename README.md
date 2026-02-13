# 상담예약 시스템

상담사가 스케줄을 관리하고, 신청자가 이메일 초대 링크를 통해 예약할 수 있는 상담예약 시스템입니다.

## 프로젝트 개요

### 비즈니스 플로우
```
① 상담사 스케줄 설정 → ② 이메일 링크 발송 → ③ 신청자 예약 신청 → ④ 상담 진행 및 이력 관리
```

### 주요 기능
- **상담사(관리자)**: 로그인/로그아웃, 캘린더 기반 스케줄 CRUD, 예약 내역 조회, 상담 기록 작성/수정, 초대 링크 발송
- **신청자(사용자)**: 이메일 초대 링크 접속, 캘린더에서 날짜/시간 선택, 예약 신청 (로그인 불필요)
- **동시성 제어**: 동시간대 최대 3명 예약, 비관적 락(Pessimistic Lock)으로 Race Condition 방지

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React + Vite, TanStack Query, Zustand |
| Backend | NestJS, TypeORM |
| Database | PostgreSQL 15 |
| 인증 | JWT (상담사), 초대 토큰 (신청자) |
| 이메일 | Nodemailer (Gmail SMTP) |
| 인프라 | Docker Compose |

## 프로젝트 구조

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

## 시작하기

### 사전 요구사항
- Docker Desktop (권장) 또는 Node.js 18+ & PostgreSQL 15+

### 실행 방법 A: Docker Compose (권장)

```bash
# 1. 저장소 클론
git clone {저장소 URL}
cd {프로젝트 폴더}

# 2. 환경변수 설정 (.env 파일 생성 - 아래 환경변수 섹션 참고)

# 3. 실행
docker-compose up --build

# 4. 종료
docker-compose down
```

### 실행 방법 B: 로컬 개별 실행

```bash
# PostgreSQL (Docker로 DB만 실행)
docker run -d --name consultation-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=consultation \
  -p 5432:5432 \
  postgres:15-alpine

# Backend
cd backend && npm install && npm run start:dev

# Frontend Admin (새 터미널)
cd frontend-admin && npm install && npm run dev

# Frontend Client (새 터미널)
cd frontend-client && npm install && npm run dev
```

### 환경변수 (.env)

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

### 접속 URL

| 서비스 | URL | 설명 |
|--------|-----|------|
| 상담사 페이지 | http://localhost:3000 | 관리자 화면 |
| 신청자 페이지 | http://localhost:3001 | 예약 신청 화면 |
| 백엔드 API | http://localhost:4000 | REST API |
| Swagger 문서 | http://localhost:4000/api/docs | API 명세 |

### 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 상담사1 | counselor1@example.com | password123 |
| 상담사2 | counselor2@example.com | password123 |

> 서버 최초 실행 시 시드 데이터로 자동 생성됩니다.

## API 목록

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

## 핵심 설계

### 동시성 제어
- 동시간대 최대 3명 예약 제한
- **비관적 락(Pessimistic Lock)** + 트랜잭션으로 Race Condition 방지
- `SELECT FOR UPDATE`로 예약 생성 구간 직렬화

### 보안
- JWT 기반 상담사 인증 (bcrypt 비밀번호 해싱)
- 초대 토큰 기반 신청자 접근 제어 (7일 만료)
- ValidationPipe 전역 적용 (입력값 검증)
- TypeORM 파라미터 바인딩 (SQL Injection 방어)

## 설계 문서

- [통합 설계 문서](./docs/design.md)
- [시스템 아키텍처](./docs/Architecture.md)
- [ERD](./docs/ERD.md)
- [보안](./docs/Security.md)
- [배포](./docs/Deployment.md)
