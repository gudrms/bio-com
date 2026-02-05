# API 명세서

## Base URL
```
http://localhost:4000/api
```

## 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "요청이 성공적으로 처리되었습니다."
}
```

### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

---

## 1. 인증 API

### POST /auth/login
상담사 로그인

**Request**
```json
{
  "email": "counselor@example.com",
  "password": "password123"
}
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "counselor@example.com",
      "name": "홍길동"
    }
  }
}
```

### POST /auth/logout
상담사 로그아웃

**Headers**
```
Authorization: Bearer {accessToken}
```

**Response (200)**
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

---

## 2. 스케줄 API

### GET /schedules
스케줄 목록 조회

**Headers**
```
Authorization: Bearer {accessToken}
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| startDate | string | N | 조회 시작일 (YYYY-MM-DD) |
| endDate | string | N | 조회 종료일 (YYYY-MM-DD) |

**Response (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "2025-02-10",
      "startTime": "09:00",
      "endTime": "09:30",
      "maxCapacity": 3,
      "currentBookings": 1
    }
  ]
}
```

### POST /schedules
스케줄 생성

**Headers**
```
Authorization: Bearer {accessToken}
```

**Request**
```json
{
  "date": "2025-02-10",
  "startTime": "09:00"
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "date": "2025-02-10",
    "startTime": "09:00",
    "endTime": "09:30",
    "maxCapacity": 3
  }
}
```

### PUT /schedules/:id
스케줄 수정

**Headers**
```
Authorization: Bearer {accessToken}
```

**Request**
```json
{
  "date": "2025-02-11",
  "startTime": "10:00"
}
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "date": "2025-02-11",
    "startTime": "10:00",
    "endTime": "10:30",
    "maxCapacity": 3
  }
}
```

### DELETE /schedules/:id
스케줄 삭제

**Headers**
```
Authorization: Bearer {accessToken}
```

**Response (200)**
```json
{
  "success": true,
  "message": "스케줄이 삭제되었습니다."
}
```

---

## 3. 예약 API

### GET /schedules/available
예약 가능한 스케줄 조회 (신청자용)

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| token | string | Y | 초대 링크 토큰 |
| date | string | N | 조회 날짜 (YYYY-MM-DD) |

**Response (200)**
```json
{
  "success": true,
  "data": {
    "counselor": {
      "name": "홍길동"
    },
    "schedules": [
      {
        "id": "uuid",
        "date": "2025-02-10",
        "startTime": "09:00",
        "endTime": "09:30",
        "available": true,
        "remainingSlots": 2
      }
    ]
  }
}
```

### POST /bookings
예약 신청

**Request**
```json
{
  "scheduleId": "uuid",
  "token": "invitation-token",
  "clientName": "김철수",
  "clientEmail": "client@example.com",
  "clientPhone": "010-1234-5678"
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "scheduleId": "uuid",
    "clientName": "김철수",
    "status": "confirmed"
  },
  "message": "예약이 완료되었습니다."
}
```

**Error Response (409)**
```json
{
  "success": false,
  "error": {
    "code": "SCHEDULE_FULL",
    "message": "해당 시간대 예약이 마감되었습니다."
  }
}
```

### GET /bookings
예약 목록 조회 (상담사용)

**Headers**
```
Authorization: Bearer {accessToken}
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| scheduleId | string | N | 특정 스케줄의 예약만 조회 |
| status | string | N | 상태 필터 (pending/confirmed/completed) |

**Response (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "schedule": {
        "date": "2025-02-10",
        "startTime": "09:00"
      },
      "clientName": "김철수",
      "clientEmail": "client@example.com",
      "clientPhone": "010-1234-5678",
      "status": "confirmed",
      "createdAt": "2025-02-05T10:00:00Z"
    }
  ]
}
```

---

## 4. 상담 기록 API

### POST /bookings/:bookingId/records
상담 기록 작성

**Headers**
```
Authorization: Bearer {accessToken}
```

**Request**
```json
{
  "notes": "상담 내용 기록..."
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "bookingId": "uuid",
    "notes": "상담 내용 기록...",
    "createdAt": "2025-02-10T09:30:00Z"
  }
}
```

### PUT /bookings/:bookingId/records
상담 기록 수정

**Headers**
```
Authorization: Bearer {accessToken}
```

**Request**
```json
{
  "notes": "수정된 상담 내용..."
}
```

---

## 5. 초대 링크 API

### POST /invitations
초대 링크 생성 및 이메일 발송

**Headers**
```
Authorization: Bearer {accessToken}
```

**Request**
```json
{
  "recipientEmail": "client@example.com"
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "token": "abc123xyz",
    "link": "http://localhost:3001/booking?token=abc123xyz",
    "expiresAt": "2025-02-12T00:00:00Z"
  },
  "message": "초대 링크가 이메일로 발송되었습니다."
}
```

---

## 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| UNAUTHORIZED | 401 | 인증 필요 |
| FORBIDDEN | 403 | 권한 없음 |
| NOT_FOUND | 404 | 리소스 없음 |
| SCHEDULE_FULL | 409 | 예약 마감 |
| INVALID_TOKEN | 400 | 유효하지 않은 토큰 |
| TOKEN_EXPIRED | 400 | 만료된 토큰 |
| VALIDATION_ERROR | 400 | 입력값 검증 실패 |
