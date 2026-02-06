# Backend 체크리스트 (NestJS)

## 1. 프로젝트 설정

- [x] NestJS 프로젝트 초기화
- [x] TypeORM 설치 및 설정
- [x] JWT 패키지 설치
- [x] Swagger 설치
- [x] class-validator, class-transformer 설치
- [x] bcrypt 설치
- [x] Dockerfile 작성
- [x] TypeORM 데이터베이스 연결 설정
- [x] 환경변수 설정 (ConfigModule)

## 2. 엔티티 (Entity)

- [x] Counselor (상담사) 엔티티
- [x] Schedule (스케줄) 엔티티
- [x] Booking (예약) 엔티티
- [x] ConsultationRecord (상담기록) 엔티티
- [x] InvitationLink (초대링크) 엔티티

## 3. 인증 모듈 (Auth)

- [x] AuthModule 생성
- [x] AuthController
  - [x] POST /auth/login
  - [x] POST /auth/logout
- [x] AuthService
  - [x] 로그인 로직 (비밀번호 검증)
  - [x] JWT 토큰 발급
- [x] JwtStrategy (Passport)
- [x] JwtAuthGuard
- [x] LoginDto, TokenResponseDto

## 4. 상담사 모듈 (Counselors)

- [x] CounselorsModule 생성
- [x] CounselorsService
- [x] CounselorsRepository
- [x] 초기 상담사 시드 데이터

## 5. 스케줄 모듈 (Schedules)

- [x] SchedulesModule 생성
- [x] SchedulesController
  - [x] GET /schedules (목록 조회)
  - [x] POST /schedules (생성)
  - [x] PUT /schedules/:id (수정)
  - [x] DELETE /schedules/:id (삭제)
  - [x] GET /schedules/available (예약 가능 스케줄 - 신청자용)
- [x] SchedulesService
  - [x] 30분 단위 검증
  - [x] 스케줄 중복 체크
- [x] SchedulesRepository
- [x] CreateScheduleDto, UpdateScheduleDto

## 6. 예약 모듈 (Bookings)

- [x] BookingsModule 생성
- [x] BookingsController
  - [x] GET /bookings (목록 조회 - 상담사용)
  - [x] POST /bookings (예약 신청 - 신청자용)
  - [x] GET /bookings/:id (상세 조회)
- [x] BookingsService
  - [x] 동시성 제어 (비관적 락)
  - [x] 최대 3명 예약 검증
  - [x] 트랜잭션 처리
- [x] BookingsRepository
- [x] CreateBookingDto

## 7. 상담기록 모듈 (ConsultationRecords)

- [x] POST /bookings/:bookingId/records (기록 작성)
- [x] PUT /bookings/:bookingId/records (기록 수정)
- [x] ConsultationRecordsService

## 8. 초대링크 모듈 (Invitations)

- [x] InvitationsModule 생성
- [x] InvitationsController
  - [x] POST /invitations (링크 생성 및 이메일 발송)
  - [x] GET /invitations/validate (토큰 검증)
- [x] InvitationsService
  - [x] 토큰 생성 (crypto)
  - [x] 만료 시간 설정
- [x] 이메일 발송 서비스 연동 (InvitationsService에서 EmailService 호출)

## 9. 이메일 모듈 (Email)

- [x] EmailModule 생성
- [x] EmailService
  - [x] nodemailer 설정
  - [x] 초대 이메일 템플릿

## 10. 공통 (Common)

- [x] GlobalExceptionFilter
- [x] ResponseInterceptor
- [x] ValidationPipe 전역 설정
- [x] Swagger 문서 설정

## 11. 테스트

- [ ] 단위 테스트 (선택)
- [ ] E2E 테스트 (선택)

---

## 진행률

| 카테고리 | 완료 | 전체 | 진행률 |
|----------|------|------|--------|
| 프로젝트 설정 | 9 | 9 | 100% |
| 엔티티 | 5 | 5 | 100% |
| 인증 모듈 | 7 | 7 | 100% |
| 스케줄 모듈 | 8 | 8 | 100% |
| 예약 모듈 | 8 | 8 | 100% |
| 기타 모듈 | 10 | 10 | 100% |
| **전체** | **47** | **47** | **100%** |
