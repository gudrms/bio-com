# ERD (Entity Relationship Diagram)

## 테이블 구조

### 1. counselors (상담사)
| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 상담사 고유 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 이메일 |
| password | VARCHAR(255) | NOT NULL | 비밀번호 (해시) |
| name | VARCHAR(100) | NOT NULL | 이름 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 수정일시 |

### 2. schedules (스케줄)
| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 스케줄 고유 ID |
| counselor_id | UUID | FK → counselors.id | 상담사 ID |
| date | DATE | NOT NULL | 상담 날짜 |
| start_time | TIME | NOT NULL | 시작 시간 |
| end_time | TIME | NOT NULL | 종료 시간 (30분 후) |
| max_capacity | INTEGER | DEFAULT 3 | 최대 예약 가능 인원 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 수정일시 |

### 3. bookings (예약)
| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 예약 고유 ID |
| schedule_id | UUID | FK → schedules.id | 스케줄 ID |
| client_name | VARCHAR(100) | NOT NULL | 신청자 이름 |
| client_email | VARCHAR(255) | NOT NULL | 신청자 이메일 |
| client_phone | VARCHAR(20) | | 신청자 연락처 |
| status | ENUM | DEFAULT 'pending' | 상태 (pending/confirmed/cancelled/completed) |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 수정일시 |

### 4. consultation_records (상담 기록)
| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 기록 고유 ID |
| booking_id | UUID | FK → bookings.id, UNIQUE | 예약 ID |
| notes | TEXT | | 상담 내용 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 수정일시 |

### 5. invitation_links (초대 링크)
| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 링크 고유 ID |
| counselor_id | UUID | FK → counselors.id | 상담사 ID |
| token | VARCHAR(255) | UNIQUE, NOT NULL | 고유 토큰 |
| recipient_email | VARCHAR(255) | NOT NULL | 수신자 이메일 |
| expires_at | TIMESTAMP | NOT NULL | 만료일시 |
| is_used | BOOLEAN | DEFAULT FALSE | 사용 여부 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성일시 |

---

## ERD 다이어그램

```
┌──────────────────┐       ┌──────────────────┐
│   counselors     │       │ invitation_links │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │───┐   │ id (PK)          │
│ email            │   │   │ counselor_id(FK) │───┐
│ password         │   │   │ token            │   │
│ name             │   │   │ recipient_email  │   │
│ created_at       │   │   │ expires_at       │   │
│ updated_at       │   │   │ is_used          │   │
└──────────────────┘   │   │ created_at       │   │
         │             │   └──────────────────┘   │
         │ 1           │                          │
         │             └──────────────────────────┘
         │ N
┌──────────────────┐
│    schedules     │
├──────────────────┤
│ id (PK)          │
│ counselor_id(FK) │
│ date             │
│ start_time       │
│ end_time         │
│ max_capacity     │
│ created_at       │
│ updated_at       │
└──────────────────┘
         │ 1
         │
         │ N (max 3)
┌──────────────────┐       ┌──────────────────────┐
│    bookings      │       │ consultation_records │
├──────────────────┤       ├──────────────────────┤
│ id (PK)          │───────│ id (PK)              │
│ schedule_id (FK) │   1:1 │ booking_id (FK)      │
│ client_name      │       │ notes                │
│ client_email     │       │ created_at           │
│ client_phone     │       │ updated_at           │
│ status           │       └──────────────────────┘
│ created_at       │
│ updated_at       │
└──────────────────┘
```

---

## 관계 정의

| 관계 | 설명 |
|------|------|
| counselors : schedules | 1:N (상담사는 여러 스케줄 보유) |
| counselors : invitation_links | 1:N (상담사는 여러 초대 링크 발송) |
| schedules : bookings | 1:N (스케줄당 최대 3개 예약) |
| bookings : consultation_records | 1:1 (예약당 1개 상담 기록) |

---

## 인덱스 설계

```sql
-- 스케줄 조회 최적화 (날짜 + 상담사)
CREATE INDEX idx_schedules_date_counselor ON schedules(date, counselor_id);

-- 예약 조회 최적화 (스케줄별)
CREATE INDEX idx_bookings_schedule ON bookings(schedule_id);

-- 초대 링크 토큰 조회
CREATE INDEX idx_invitation_token ON invitation_links(token);

-- 예약 상태 조회
CREATE INDEX idx_bookings_status ON bookings(status);
```

---

## 제약조건

### 동시성 제어
- `schedules` + `bookings` 조합에서 동일 schedule_id의 예약 수가 max_capacity(3)를 초과하지 않도록 제어
- 트랜잭션 + 비관적 락 또는 CHECK 제약조건 활용
