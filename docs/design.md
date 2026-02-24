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
└──────────────────┘  │    │ created_at       │  │
         │ 1          │    └──────────────────┘  │
         │ N          └──────────────────────────┘
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

### 3.1-A 테이블 컬럼 상세 (실제 엔티티 기반)

**counselors**
| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | NOT NULL (bcrypt) |
| name | VARCHAR(100) | NOT NULL |
| created_at | TIMESTAMP | AUTO |
| updated_at | TIMESTAMP | AUTO |

**schedules**
| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | UUID | PK |
| counselor_id | UUID | FK → counselors |
| date | DATE | NOT NULL |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL |
| max_capacity | INTEGER | DEFAULT 3 |

**bookings**
| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | UUID | PK |
| schedule_id | UUID | FK → schedules |
| client_name | VARCHAR(100) | NOT NULL |
| client_email | VARCHAR(255) | NOT NULL |
| client_phone | VARCHAR(20) | nullable |
| status | ENUM | pending/confirmed/cancelled/completed, DEFAULT confirmed |

**invitation_links**
| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | UUID | PK |
| counselor_id | UUID | FK → counselors |
| token | VARCHAR(255) | UNIQUE, NOT NULL |
| recipient_email | VARCHAR(255) | NOT NULL |
| expires_at | TIMESTAMP | NOT NULL |
| is_used | BOOLEAN | DEFAULT false |

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

**실제 적용 방식** (TypeORM `@Index` 데코레이터):
```typescript
// schedule.entity.ts
@Entity('schedules')
@Index('idx_schedules_date_counselor', ['date', 'counselorId'])
export class Schedule { ... }

// booking.entity.ts
@Entity('bookings')
@Index('idx_bookings_schedule', ['scheduleId'])
@Index('idx_bookings_status', ['status'])
export class Booking { ... }

// invitation-link.entity.ts
@Entity('invitation_links')
@Index('idx_invitation_token', ['token'])
export class InvitationLink { ... }
```
→ TypeORM synchronize 옵션으로 서버 시작 시 자동 생성

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

**JWT Payload 구조** (실제 코드 기반):
```json
{
  "sub": "counselor-uuid",
  "email": "counselor@example.com",
  "role": "counselor"
}
```

### 4.2 권한 관리

| 역할 | 인증 방식 | 권한 |
|------|-----------|------|
| 상담사(관리자) | JWT 토큰 | 스케줄 CRUD, 예약 조회, 상담 기록, 초대 링크 발송 |
| 신청자(사용자) | 초대 토큰 | 예약 신청만 가능 (로그인 불필요) |

- 상담사 API: JwtAuthGuard로 보호
- 신청자 API: 초대 토큰(`crypto.randomBytes(32)`, hex 64자)으로 접근 제어

**초대 토큰 검증 로직** (실제 코드 기반):
1. 토큰 존재 여부 확인 → 없으면 400 `유효하지 않은 토큰`
2. 만료 시간(`expiresAt`) 확인 → 지났으면 400 `만료된 토큰`
3. 사용 여부(`isUsed`) 확인 → 이미 사용됐으면 400 `이미 사용된 토큰`
4. 검증 통과 시 상담사 정보 + 수신자 이메일 반환

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

## 6. Trade-off 의사결정

### 6.1 동시성 제어: 비관적 락 vs 낙관적 락

**선택: 비관적 락 (Pessimistic Lock / SELECT FOR UPDATE)**

상담 예약 시스템의 핵심 제약은 "스케줄당 최대 3명"이며, 이메일 링크를 통해 여러 신청자가 동시에 같은 시간대에 접속할 수 있습니다.

**낙관적 락을 고려한 이유:**
- 읽기 연산이 많고 실제 충돌이 적은 경우에는 락 대기 시간이 없어 처리량이 높음
- version 컬럼 기반으로 구현이 단순하며, 충돌 시 재시도 로직으로 처리 가능

**낙관적 락을 기각한 이유:**
- 스케줄당 3명이라는 낮은 정원에서는 마감 직전 충돌 확률이 급증합니다. 잔여 1석에 2명이 동시 요청하면 둘 다 "1석 남음"으로 읽고 예약을 시도하게 됨
- 충돌 시 재시도 로직이 필요하며, 사용자 경험에서 "예약 실패 → 재시도" 플로우가 발생합니다. 상담 예약이라는 서비스 특성상 한 번에 확정되는 것이 중요
- 재시도 중에 다른 사용자가 먼저 예약을 완료하면 starvation 문제 발생 가능

**비관적 락의 리스크와 대응:**
- **데드락**: 단일 테이블(Schedule)만 락을 걸고, 트랜잭션 내에서 락 순서가 고정되어 있으므로 데드락 가능성이 낮음. PostgreSQL의 `lock_timeout` 설정으로 안전장치를 둘 수 있음
- **성능**: 스케줄당 최대 3건의 예약이므로 트랜잭션이 수십 ms 내에 완료됨. 동시 사용자 수가 수백 명이 아닌 이상 병목이 되지 않음
- **스케일 아웃 한계**: DB 레벨 락이므로 서버를 수평 확장해도 정합성이 보장됨 (애플리케이션 레벨 락과 다름)

### 6.2 아키텍처: 모놀리식 NestJS

**선택: 단일 NestJS 서버 + 모듈 분리**

**마이크로서비스를 고려한 이유:**
- 예약/스케줄/인증을 독립 서비스로 분리하면 각 서비스의 독립 배포와 스케일링이 가능

**마이크로서비스를 기각한 이유:**
- 상담사 수십 명, 신청자 수백 명 수준의 트래픽에서는 서비스 간 통신 오버헤드(네트워크 레이턴시, 직렬화)가 단일 프로세스 내 함수 호출보다 비효율적
- 분산 트랜잭션(Saga 패턴)이 필요해져 동시성 제어 복잡도가 급증
- 인프라 비용: 서비스별 컨테이너, 서비스 디스커버리, API Gateway 등 운영 부담이 과도
- NestJS 모듈 시스템으로 논리적 분리는 충분히 달성 가능하며, 추후 트래픽 증가 시 모듈 단위로 마이크로서비스 전환이 용이

### 6.3 ORM: TypeORM vs Prisma

**선택: TypeORM**

**Prisma를 고려한 이유:**
- Type-safe한 클라이언트 생성, 직관적인 스키마 정의, 우수한 마이그레이션 도구

**TypeORM을 선택한 이유:**
- NestJS와 공식 통합(@nestjs/typeorm)으로 DI 컨테이너와 자연스럽게 연동
- `DataSource.transaction()` + `pessimistic_write` 락을 직접 지원하여 동시성 제어 구현에 적합
- Prisma의 경우 interactive transaction 내에서 비관적 락을 걸려면 `$queryRaw`로 직접 SQL을 작성해야 하며, 이는 ORM의 이점을 상당 부분 상쇄
- 데코레이터 기반 엔티티 정의가 NestJS의 패턴(Controller, Service에서도 데코레이터 사용)과 일관됨

**TypeORM의 한계:**
- 복잡한 서브쿼리나 CTE 작성 시 QueryBuilder의 가독성이 떨어짐
- Prisma 대비 타입 추론이 약해 런타임 에러 가능성이 상대적으로 높음
- 이 프로젝트의 쿼리 복잡도(CRUD + 집계)에서는 TypeORM의 한계가 드러나지 않으므로 수용 가능

### 6.4 프론트엔드 상태 관리: Zustand vs Redux

**선택: Zustand**

**Redux를 고려한 이유:**
- 대규모 팀에서의 상태 추적 용이, Redux DevTools, 미들웨어 생태계

**Zustand를 선택한 이유:**
- 이 프로젝트에서 전역 상태는 인증 토큰 하나뿐입니다. Redux의 action/reducer/store 보일러플레이트는 과도한 추상화
- 서버 상태(스케줄, 예약 목록)는 TanStack React Query로 관리하므로 클라이언트 전역 상태의 범위가 매우 좁음
- Zustand는 번들 사이즈가 ~1KB로 Redux Toolkit(~12KB) 대비 가벼움. 사용자에게 이메일 링크로 배포되는 신청자 페이지에서 초기 로딩 속도가 중요

### 6.5 DB 스키마: 예약 수 캐싱 vs 매번 Count

**선택: 예약 생성 시 매번 COUNT 조회**

**캐싱 방식 (schedules.current_count 컬럼)을 고려한 이유:**
- COUNT 쿼리 없이 단일 행 조회로 잔여석 확인 가능, 읽기 성능이 우수

**매번 COUNT를 선택한 이유:**
- 캐싱 방식은 예약 생성/취소 시 count 컬럼을 동기화해야 하며, 동기화 실패 시 실제 예약 수와 불일치 발생
- 비관적 락 구간에서 COUNT를 수행하므로 정확한 값이 보장됨. 스케줄당 최대 3건이므로 COUNT의 비용이 거의 무시할 수 있음
- 데이터 정합성을 위해 "단일 진실 공급원(Single Source of Truth)" 원칙을 적용

### 6.6 배포 환경: AWS ECS Fargate

**선택: ECS Fargate (컨테이너 기반 서버리스)**

**EC2를 고려한 이유:**
- 서버에 대한 완전한 제어, 예측 가능한 비용 구조

**Fargate를 선택한 이유:**
- Docker 기반으로 이미 개발 환경이 구성되어 있으므로 컨테이너 이미지를 그대로 배포 가능
- 서버 패치, OS 업데이트 등 운영 부담이 없음
- Auto Scaling 설정으로 트래픽 변동에 대응 가능

**비용 Trade-off:**
- Fargate는 EC2 대비 vCPU/메모리 단가가 약 20-30% 높음
- 그러나 상시 운영하지 않는 상담 예약 시스템 특성상, 사용량 기반 과금이 유리할 수 있음
- 초기에 비용을 우선시한다면 EC2 t3.micro + Docker Compose로 시작하고, 트래픽 증가 시 Fargate로 마이그레이션하는 단계적 접근도 가능
