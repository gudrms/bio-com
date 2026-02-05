# 상담예약 시스템

상담사가 스케줄을 관리하고, 신청자가 예약할 수 있는 상담예약 시스템입니다.

## 프로젝트 개요

### 주요 기능
- **상담사(관리자)**: 스케줄 등록/수정/삭제, 예약 현황 조회, 상담 이력 관리
- **신청자**: 이메일 링크를 통한 예약 신청

### 비즈니스 플로우
```
상담사 스케줄 설정 → 이메일 링크 발송 → 신청자 예약 신청 → 상담 진행 및 이력 관리
```

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React |
| Backend | NestJS |
| Database | PostgreSQL |
| 인증 | JWT |
| 인프라 | Docker, AWS/GCP |

## 프로젝트 구조

```
/
├── frontend-admin/     # 상담사(관리자) 페이지
├── frontend-client/    # 신청자 페이지
├── backend/            # NestJS 백엔드
├── docs/               # 설계 문서
└── docker-compose.yml
```

## 시작하기

### 사전 요구사항
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+

### 설치 및 실행

1. **저장소 클론**
```bash
git clone [repository-url]
cd consultation-booking
```

2. **환경변수 설정**
```bash
cp .env.example .env
# .env 파일 수정
```

3. **Docker로 실행**
```bash
docker-compose up -d
```

4. **개별 실행 (개발 모드)**
```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (Admin)
cd frontend-admin
npm install
npm run dev

# Frontend (Client)
cd frontend-client
npm install
npm run dev
```

### 접속 URL
- 상담사 페이지: http://localhost:3000
- 신청자 페이지: http://localhost:3001
- API 서버: http://localhost:4000

## API 명세

### 인증
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /auth/login | 로그인 |
| POST | /auth/logout | 로그아웃 |

### 스케줄
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /schedules | 스케줄 목록 조회 |
| POST | /schedules | 스케줄 생성 |
| PUT | /schedules/:id | 스케줄 수정 |
| DELETE | /schedules/:id | 스케줄 삭제 |

### 예약
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /bookings | 예약 목록 조회 |
| POST | /bookings | 예약 신청 |
| GET | /bookings/:id | 예약 상세 조회 |

## 핵심 설계 사항

### 동시성 제어
- 동시간대 최대 3명 예약 제한
- 낙관적/비관적 락을 통한 Race Condition 방지

### 스케줄 단위
- 30분 단위 스케줄 설정

### 보안
- JWT 기반 인증
- 입력값 검증
- SQL Injection 방어

## 문서

- [설계 문서](./docs/design.pdf)
- [API 문서](./docs/api.md)

## 라이선스

MIT License
