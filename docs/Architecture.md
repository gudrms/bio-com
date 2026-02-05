# 시스템 아키텍처

## 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
├─────────────────────────────┬───────────────────────────────────┤
│   상담사 페이지 (Admin)      │      신청자 페이지 (Client)        │
│   React + Vite              │      React + Vite                 │
│   localhost:3000            │      localhost:3001               │
└─────────────┬───────────────┴───────────────┬───────────────────┘
              │                               │
              │         HTTP/REST             │
              ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend (NestJS)                          │
│                       localhost:4000                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Auth   │  │ Schedule │  │ Booking  │  │  Email   │        │
│  │ Module   │  │  Module  │  │  Module  │  │  Module  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ TypeORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│                       localhost:5432                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 계층 구조 (Controller-Service-Repository)

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Controllers                        │    │
│  │  - HTTP 요청/응답 처리                               │    │
│  │  - 입력값 검증 (ValidationPipe)                      │    │
│  │  - DTO 변환                                          │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Layer                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Services                          │    │
│  │  - 비즈니스 로직 처리                                │    │
│  │  - 트랜잭션 관리                                     │    │
│  │  - 동시성 제어                                       │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Repositories                        │    │
│  │  - 데이터베이스 CRUD                                 │    │
│  │  - 쿼리 빌더                                         │    │
│  │  - Entity 매핑                                       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 모듈 구조

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── common/                    # 공통 모듈
│   │   ├── decorators/
│   │   ├── filters/               # Exception Filters
│   │   ├── guards/                # Auth Guards
│   │   ├── interceptors/
│   │   └── pipes/                 # Validation Pipes
│   │
│   ├── config/                    # 설정
│   │   └── database.config.ts
│   │
│   ├── auth/                      # 인증 모듈
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       └── login.dto.ts
│   │
│   ├── counselors/                # 상담사 모듈
│   │   ├── counselors.module.ts
│   │   ├── counselors.service.ts
│   │   ├── counselors.repository.ts
│   │   └── entities/
│   │       └── counselor.entity.ts
│   │
│   ├── schedules/                 # 스케줄 모듈
│   │   ├── schedules.module.ts
│   │   ├── schedules.controller.ts
│   │   ├── schedules.service.ts
│   │   ├── schedules.repository.ts
│   │   ├── entities/
│   │   │   └── schedule.entity.ts
│   │   └── dto/
│   │       ├── create-schedule.dto.ts
│   │       └── update-schedule.dto.ts
│   │
│   ├── bookings/                  # 예약 모듈
│   │   ├── bookings.module.ts
│   │   ├── bookings.controller.ts
│   │   ├── bookings.service.ts
│   │   ├── bookings.repository.ts
│   │   ├── entities/
│   │   │   └── booking.entity.ts
│   │   └── dto/
│   │       └── create-booking.dto.ts
│   │
│   ├── invitations/               # 초대 링크 모듈
│   │   ├── invitations.module.ts
│   │   ├── invitations.controller.ts
│   │   ├── invitations.service.ts
│   │   └── entities/
│   │       └── invitation.entity.ts
│   │
│   └── email/                     # 이메일 모듈
│       ├── email.module.ts
│       └── email.service.ts
│
└── test/
```

---

## 데이터 흐름

### 예약 생성 플로우

```
신청자 → [POST /bookings] → Controller
                               │
                               ▼
                           Service
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
    토큰 검증            스케줄 조회            예약 수 확인
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Transaction Start │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Pessimistic Lock  │
                    │   (FOR UPDATE)      │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  예약 수 재확인      │
                    │  (< max_capacity?)  │
                    └─────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
         예약 가능                          예약 불가
              │                                 │
              ▼                                 ▼
         예약 생성                          409 Error
              │
              ▼
    ┌─────────────────────┐
    │   Transaction End   │
    └─────────────────────┘
              │
              ▼
         201 Response
```

---

## Trade-off 의사결정

### 1. 모놀리식 vs 마이크로서비스
| 선택 | 모놀리식 |
|------|----------|
| **이유** | 소규모 프로젝트, 빠른 개발, 단순한 배포 |
| **Trade-off** | 확장성 제한 vs 개발 속도 |

### 2. 동시성 제어: 낙관적 락 vs 비관적 락
| 선택 | 비관적 락 (Pessimistic Lock) |
|------|------------------------------|
| **이유** | 동시 예약 충돌 빈도가 높을 수 있음 |
| **Trade-off** | 성능 저하 vs 데이터 정합성 보장 |

### 3. 상태 관리: Redux vs Zustand
| 선택 | Zustand |
|------|---------|
| **이유** | 간단한 상태, 보일러플레이트 최소화 |
| **Trade-off** | 복잡한 상태 관리 어려움 vs 간결한 코드 |
