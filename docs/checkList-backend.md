# Backend 체크리스트 (NestJS)

## 1. 프로젝트 설정

- [x] NestJS 프로젝트 초기화
- [x] TypeORM 설치 및 설정
- [x] JWT 패키지 설치
- [x] Swagger 설치
- [x] class-validator, class-transformer 설치
- [x] bcrypt 설치
- [x] Dockerfile 작성
- [ ] TypeORM 데이터베이스 연결 설정
- [ ] 환경변수 설정 (ConfigModule)

## 2. 엔티티 (Entity)

- [ ] Counselor (상담사) 엔티티
- [ ] Schedule (스케줄) 엔티티
- [ ] Booking (예약) 엔티티
- [ ] ConsultationRecord (상담기록) 엔티티
- [ ] InvitationLink (초대링크) 엔티티

## 3. 인증 모듈 (Auth)

- [ ] AuthModule 생성
- [ ] AuthController
  - [ ] POST /auth/login
  - [ ] POST /auth/logout
- [ ] AuthService
  - [ ] 로그인 로직 (비밀번호 검증)
  - [ ] JWT 토큰 발급
- [ ] JwtStrategy (Passport)
- [ ] JwtAuthGuard
- [ ] LoginDto, TokenResponseDto

## 4. 상담사 모듈 (Counselors)

- [ ] CounselorsModule 생성
- [ ] CounselorsService
- [ ] CounselorsRepository
- [ ] 초기 상담사 시드 데이터

## 5. 스케줄 모듈 (Schedules)

- [ ] SchedulesModule 생성
- [ ] SchedulesController
  - [ ] GET /schedules (목록 조회)
  - [ ] POST /schedules (생성)
  - [ ] PUT /schedules/:id (수정)
  - [ ] DELETE /schedules/:id (삭제)
  - [ ] GET /schedules/available (예약 가능 스케줄 - 신청자용)
- [ ] SchedulesService
  - [ ] 30분 단위 검증
  - [ ] 스케줄 중복 체크
- [ ] SchedulesRepository
- [ ] CreateScheduleDto, UpdateScheduleDto

## 6. 예약 모듈 (Bookings)

- [ ] BookingsModule 생성
- [ ] BookingsController
  - [ ] GET /bookings (목록 조회 - 상담사용)
  - [ ] POST /bookings (예약 신청 - 신청자용)
  - [ ] GET /bookings/:id (상세 조회)
- [ ] BookingsService
  - [ ] 동시성 제어 (비관적 락)
  - [ ] 최대 3명 예약 검증
  - [ ] 트랜잭션 처리
- [ ] BookingsRepository
- [ ] CreateBookingDto

## 7. 상담기록 모듈 (ConsultationRecords)

- [ ] POST /bookings/:bookingId/records (기록 작성)
- [ ] PUT /bookings/:bookingId/records (기록 수정)
- [ ] ConsultationRecordsService

## 8. 초대링크 모듈 (Invitations)

- [ ] InvitationsModule 생성
- [ ] InvitationsController
  - [ ] POST /invitations (링크 생성 및 이메일 발송)
  - [ ] GET /invitations/validate (토큰 검증)
- [ ] InvitationsService
  - [ ] 토큰 생성 (crypto)
  - [ ] 만료 시간 설정
- [ ] 이메일 발송 서비스 연동

## 9. 이메일 모듈 (Email)

- [ ] EmailModule 생성
- [ ] EmailService
  - [ ] nodemailer 설정
  - [ ] 초대 이메일 템플릿

## 10. 공통 (Common)

- [ ] GlobalExceptionFilter
- [ ] ResponseInterceptor
- [ ] ValidationPipe 전역 설정
- [ ] Swagger 문서 설정

## 11. 테스트

- [ ] 단위 테스트 (선택)
- [ ] E2E 테스트 (선택)

---

## 진행률

| 카테고리 | 완료 | 전체 | 진행률 |
|----------|------|------|--------|
| 프로젝트 설정 | 7 | 9 | 78% |
| 엔티티 | 0 | 5 | 0% |
| 인증 모듈 | 0 | 7 | 0% |
| 스케줄 모듈 | 0 | 8 | 0% |
| 예약 모듈 | 0 | 8 | 0% |
| 기타 모듈 | 0 | 10 | 0% |
| **전체** | **7** | **47** | **15%** |
