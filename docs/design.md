# 상담예약 시스템 설계 문서

---

## 1. 시스템 아키텍처 설계

### 1.1 전체 시스템 구조

```
┌─────────────────────────────┬───────────────────────────────┐
│   상담사 페이지 (Admin)      │      신청자 페이지 (Client)    │
│   React + Vite              │      React + Vite              │
│   localhost:3000            │      localhost:3001             │
└─────────────┬───────────────┴───────────────┬────────────────┘
              │           HTTP/REST           │
              ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (NestJS)                         │
│                     localhost:4000                           │
├─────────────────────────────────────────────────────────────┤
│  ┌────────┐  ┌──────────┐  ┌─────────┐  ┌───────┐          │
│  │  Auth  │  │ Schedule │  │ Booking │  │ Email │          │
│  │ Module │  │  Module  │  │  Module │  │ Module│          │
│  └────────┘  └──────────┘  └─────────┘  └───────┘          │
└─────────────────────────┬───────────────────────────────────┘
                          │ TypeORM
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│                  localhost:5432                              │
└─────────────────────────────────────────────────────────────┘
```

- 3개 애플리케이션으로 구성: 상담사 페이지(관리자), 신청자 페이지(사용자), 백엔드(API)
- 프론트엔드 2개는 각각 독립적으로 빌드/배포 가능
- 백엔드는 RESTful API로 두 프론트엔드에 공통 서비스 제공

### 1.2 계층 구조 (Controller-Service-Repository)

```
┌─────────────────────────────────────────────┐
│            Presentation Layer               │
│  Controllers - HTTP 요청/응답, 입력값 검증   │
└──────────────────────┬──────────────────────┘
                       ▼
┌─────────────────────────────────────────────┐
│             Business Layer                  │
│  Services - 비즈니스 로직, 트랜잭션, 동시성  │
└──────────────────────┬──────────────────────┘
                       ▼
┌─────────────────────────────────────────────┐
│            Data Access Layer                │
│  Repositories - DB CRUD, 쿼리, Entity 매핑  │
└─────────────────────────────────────────────┘
```

- **Controller**: HTTP 요청 수신, DTO 기반 입력값 검증(ValidationPipe), 응답 포맷팅
- **Service**: 핵심 비즈니스 로직 처리, 트랜잭션 관리, 동시성 제어
- **Repository**: TypeORM을 통한 데이터 접근, 쿼리 빌더 활용

### 1.3 계층 간 데이터 흐름

```
[Client] HTTP Request (JSON)
    │
    ▼
[Controller] DTO 변환 + ValidationPipe 검증
    │          → 실패 시 400 Bad Request 즉시 반환
    ▼
[Service] 비즈니스 로직 처리
    │       → 인증/권한 확인 (Guard에서 선처리)
    │       → 트랜잭션 범위 내 데이터 조작
    ▼
[Repository] TypeORM Entity ↔ DB 쿼리 실행
    │
    ▼
[PostgreSQL] SQL 실행 + 결과 반환
    │
    ▼
[Service] Entity → 응답 객체 변환
    │
    ▼
[Controller] 표준 응답 포맷 { success, data, message } 반환
    │
    ▼
[Client] HTTP Response (JSON)
```

- 각 계층은 자신의 책임만 담당하며, 상위 계층이 하위 계층에만 의존 (단방향 의존)
- Controller는 Service를, Service는 Repository를 주입받아 사용 (NestJS DI)
- 에러 발생 시 NestJS ExceptionFilter가 일관된 에러 응답 포맷으로 변환

---

## 2. 동시성 제어 및 트랜잭션

### 2.1 문제 정의 (Race Condition)

동일 스케줄에 최대 3명까지 예약 가능한 제약이 있으며, 동시에 여러 사용자가 같은 스케줄에 예약을 시도할 수 있습니다.

**Race Condition 시나리오**: 2명이 남은 스케줄에 3명이 동시 요청할 경우, 각각 "현재 2명" → "여유 있음"으로 판단하여 3명 모두 예약이 생성될 위험이 있습니다. 이를 방지하기 위해 비관적 락(Pessimistic Lock)으로 예약 생성 구간을 직렬화하여, 한 번에 하나의 트랜잭션만 예약 수를 확인하고 생성할 수 있도록 합니다.

### 2.2 예약 생성 플로우

```
신청자 → [POST /bookings] → Controller → Service
                                           │
                                    Transaction Start
                                           │
                                    Pessimistic Lock
                                    (SELECT FOR UPDATE)
                                           │
                                    현재 예약 수 조회
                                    (취소 제외 카운트)
                                           │
                                ┌──────────┴──────────┐
                                ▼                     ▼
                           < 3명                  >= 3명
                                │                     │
                           예약 생성              409 Error
                                │              (예약 마감)
                         Transaction End
                                │
                          201 Response
```

### 2.3 비관적 락 선택 근거

| 항목 | 낙관적 락 | 비관적 락 (선택) |
|------|-----------|-----------------|
| 방식 | 버전 체크 후 충돌 시 재시도 | DB 행 잠금으로 순차 처리 |
| 장점 | 읽기 성능 우수 | 데이터 정합성 확실 |
| 단점 | 충돌 빈도 높으면 재시도 비용 | 잠금 대기 시간 발생 |
| **선택 이유** | - | 예약 충돌 가능성이 높고, 정합성이 더 중요 |

### 2.4 트랜잭션 처리

- TypeORM의 `DataSource.transaction()` 사용
- 스케줄 조회 시 `pessimistic_write` 락으로 다른 트랜잭션 대기
- 예약 수 확인 → 예약 생성까지 원자적 처리

---

## 3. 데이터베이스

### 3.1 ERD

```
┌──────────────────┐       ┌──────────────────┐
│   counselors     │       │ invitation_links │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │──┐    │ id (PK)          │
│ email (UNIQUE)   │  │    │ counselor_id(FK) │──┐
│ password         │  │    │ token (UNIQUE)   │  │
│ name             │  │    │ recipient_email  │  │
│ created_at       │  │    │ expires_at       │  │
│ updated_at       │  │    │ is_used          │  │
└──────────────────┘  │    └──────────────────┘  │
         │ 1          └──────────────────────────┘
         │ N
┌──────────────────┐
│    schedules     │
├──────────────────┤
│ id (PK)          │
│ counselor_id(FK) │
│ date             │
│ start_time       │
│ end_time         │
│ max_capacity (3) │
└──────────────────┘
         │ 1
         │ N (max 3)
┌──────────────────┐       ┌──────────────────────┐
│    bookings      │       │ consultation_records │
├──────────────────┤       ├──────────────────────┤
│ id (PK)          │───────│ id (PK)              │
│ schedule_id (FK) │  1:1  │ booking_id (FK, UQ)  │
│ client_name      │       │ notes                │
│ client_email     │       │ created_at           │
│ client_phone     │       │ updated_at           │
│ status (ENUM)    │       └──────────────────────┘
│ created_at       │
│ updated_at       │
└──────────────────┘
```

### 3.2 관계 정의

| 관계 | 설명 |
|------|------|
| counselors → schedules | 1:N (상담사는 여러 스케줄 보유) |
| counselors → invitation_links | 1:N (상담사는 여러 초대 링크 발송) |
| schedules → bookings | 1:N (스케줄당 최대 3개 예약) |
| bookings → consultation_records | 1:1 (예약당 1개 상담 기록) |

### 3.3 인덱스 설계

| 인덱스 | 대상 | 목적 |
|--------|------|------|
| idx_schedules_date_counselor | schedules(date, counselor_id) | 날짜별 스케줄 조회 최적화 |
| idx_bookings_schedule | bookings(schedule_id) | 스케줄별 예약 조회 |
| idx_bookings_status | bookings(status) | 상태별 필터링 |
| idx_invitation_token | invitation_links(token) | 토큰 검증 조회 |

### 3.4 정규화

- 상담 기록을 bookings 테이블에 포함하지 않고 별도 테이블(consultation_records)로 분리 → 3NF 충족
- 예약 수를 스케줄에 캐싱하지 않고 매번 count 조회 → 데이터 일관성 우선 (비관적 락으로 성능 보완)

---

## 4. 보안

### 4.1 JWT 인증 구조

```
[로그인 요청] → 비밀번호 검증(bcrypt) → JWT 토큰 발급
                                          │
[이후 요청] → Authorization: Bearer {token} → JwtAuthGuard 검증
```

| 항목 | 설정 |
|------|------|
| 알고리즘 | HS256 |
| Access Token 만료 | 24시간 |
| 비밀번호 해싱 | bcrypt (salt rounds: 10) |
| Secret Key | 환경변수(.env)로 관리 |

### 4.2 권한 관리

| 역할 | 인증 방식 | 권한 |
|------|-----------|------|
| 상담사(관리자) | JWT 토큰 | 스케줄 CRUD, 예약 조회, 상담 기록, 초대 링크 발송 |
| 신청자(사용자) | 초대 토큰 | 예약 신청만 가능 (로그인 불필요) |

- 상담사 API: JwtAuthGuard로 보호
- 신청자 API: 초대 토큰(crypto 32바이트 랜덤)으로 접근 제어, 7일 만료

### 4.3 입력값 검증

- NestJS ValidationPipe 전역 적용
- `whitelist: true` → DTO에 정의되지 않은 속성 자동 제거
- `forbidNonWhitelisted: true` → 정의되지 않은 속성 포함 시 에러
- class-validator 데코레이터로 타입/형식 검증 (@IsEmail, @IsUUID, @Length 등)

### 4.4 SQL Injection 방어

- TypeORM의 파라미터 바인딩 사용으로 원천 차단
- QueryBuilder 사용 시에도 `:param` 바인딩 방식 적용
- Raw SQL 직접 작성 금지

### 4.5 기타 보안

- CORS: 허용 도메인 제한 (localhost:3000, localhost:3001만 허용)
- React JSX 자동 이스케이프로 XSS 방어
- 환경변수(.env)로 민감 정보 관리 (DB 비밀번호, JWT Secret, SMTP 비밀번호)

---

## 5. 개발 환경 및 배포

### 5.1 Docker 기반 개발 환경

```
docker-compose.yml
├── postgres (PostgreSQL 15)     → :5432
├── backend (NestJS)             → :4000
├── frontend-admin (React/Vite)  → :3000
└── frontend-client (React/Vite) → :3001
```

- `docker-compose up --build` 한 번으로 전체 환경 실행
- 볼륨 마운트로 코드 변경 시 핫 리로드 지원
- PostgreSQL healthcheck로 DB 준비 완료 후 백엔드 시작

### 5.2 AWS 배포 시나리오

```
┌─────────────────────────────────────────────────┐
│                   AWS Cloud                      │
│                                                  │
│   Route 53 (DNS)                                │
│       │                                          │
│   CloudFront (CDN)                              │
│       │                                          │
│   ┌───┴────────────────────┐                    │
│   ▼                        ▼                    │
│  S3 (Frontend)      ALB (Load Balancer)         │
│  - admin 빌드        - API 라우팅               │
│  - client 빌드            │                     │
│                      ECS Fargate                │
│                      - NestJS 컨테이너          │
│                            │                     │
│                       RDS PostgreSQL             │
└─────────────────────────────────────────────────┘
```

**배포 흐름**:
1. Frontend → `npm run build` → S3 업로드 → CloudFront 캐시 무효화
2. Backend → Docker 이미지 빌드 → ECR 푸시 → ECS Fargate 서비스 업데이트
3. Database → RDS PostgreSQL (db.t3.micro)

### 5.3 GCP 배포 시나리오 (대안)

| 구성 요소 | GCP 서비스 |
|-----------|-----------|
| Frontend | Firebase Hosting |
| Backend | Cloud Run (컨테이너) |
| Database | Cloud SQL (PostgreSQL) |
| CI/CD | Cloud Build |

---

## 6. Trade-off 의사결정 요약

| 결정 | 선택 | 이유 | Trade-off |
|------|------|------|-----------|
| 아키텍처 | 모놀리식 | 소규모 프로젝트, 빠른 개발 | 확장성 제한 ↔ 개발 속도 |
| 동시성 제어 | 비관적 락 | 예약 충돌 빈도 높음, 정합성 중요 | 잠금 대기 ↔ 데이터 정합성 |
| 상태 관리 | Zustand | 간단한 상태, 보일러플레이트 최소화 | 복잡한 상태 관리 ↔ 간결한 코드 |
| ORM | TypeORM | NestJS 공식 지원, 데코레이터 기반 | 복잡한 쿼리 한계 ↔ 개발 편의성 |
| 배포 | ECS Fargate | 서버 관리 불필요, 자동 스케일링 | 비용 증가 ↔ 운영 편의성 |
| 클라우드 | AWS | 한국 리전 안정성, 넓은 서비스 | 학습 곡선 ↔ 생태계 |
