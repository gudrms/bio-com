# 보안 설계

## 1. 인증 (Authentication)

### JWT 기반 인증 구조

```
┌─────────┐     POST /auth/login      ┌─────────┐
│  Client │ ─────────────────────────▶│ Server  │
│         │     {email, password}     │         │
└─────────┘                           └─────────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │ 비밀번호    │
                                    │ 검증(bcrypt)│
                                    └─────────────┘
                                           │
                                           ▼
┌─────────┐     {accessToken}         ┌─────────┐
│  Client │ ◀─────────────────────────│ Server  │
│         │                           │         │
└─────────┘                           └─────────┘
     │
     │ 저장 (메모리/localStorage)
     ▼
┌─────────┐     Authorization: Bearer  ┌─────────┐
│  Client │ ──────────────────────────▶│ Server  │
│         │     {accessToken}          │         │
└─────────┘                            └─────────┘
```

### JWT 토큰 구조

```json
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "sub": "user-uuid",
  "email": "counselor@example.com",
  "role": "counselor",
  "iat": 1738745600,
  "exp": 1738832000
}
```

### 토큰 설정
| 항목 | 값 | 설명 |
|------|------|------|
| Algorithm | HS256 | HMAC SHA-256 |
| Access Token 만료 | 24시간 | 상담사 편의성 고려 |
| Secret Key | 환경변수 | .env에서 관리 |

---

## 2. 인가 (Authorization)

### 권한 구분

| 역할 | 권한 |
|------|------|
| **counselor** | 스케줄 CRUD, 예약 조회, 상담 기록, 초대 링크 발송 |
| **client** | 예약 신청 (토큰 기반, 로그인 불필요) |

### Guard 적용

```typescript
// NestJS Guard 예시
@Controller('schedules')
@UseGuards(JwtAuthGuard)  // 모든 엔드포인트에 인증 필요
export class SchedulesController {

  @Get()
  @Roles('counselor')     // 상담사만 접근 가능
  findAll() { ... }
}
```

---

## 3. 입력값 검증

### ValidationPipe 적용

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,        // DTO에 정의되지 않은 속성 제거
  forbidNonWhitelisted: true,  // 정의되지 않은 속성 시 에러
  transform: true,        // 자동 타입 변환
}));
```

### DTO 검증 예시

```typescript
// create-booking.dto.ts
import { IsUUID, IsEmail, IsString, IsOptional, Matches } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  scheduleId: string;

  @IsString()
  @Length(2, 50)
  clientName: string;

  @IsEmail()
  clientEmail: string;

  @IsOptional()
  @Matches(/^01[0-9]-\d{3,4}-\d{4}$/)
  clientPhone?: string;
}
```

---

## 4. SQL Injection 방어

### TypeORM 파라미터 바인딩

```typescript
// ❌ 위험한 방식
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ 안전한 방식 (파라미터 바인딩)
const user = await this.userRepository.findOne({
  where: { email }
});

// ✅ QueryBuilder 사용 시
const schedules = await this.scheduleRepository
  .createQueryBuilder('schedule')
  .where('schedule.date = :date', { date })
  .andWhere('schedule.counselorId = :counselorId', { counselorId })
  .getMany();
```

---

## 5. XSS 방어

### 입력 데이터 이스케이프

```typescript
// 프론트엔드 - React 기본 이스케이프
// JSX에서 자동 이스케이프 적용
<div>{userInput}</div>  // 안전

// 백엔드 - 필요시 sanitize
import * as sanitizeHtml from 'sanitize-html';

const sanitizedNotes = sanitizeHtml(notes, {
  allowedTags: [],
  allowedAttributes: {}
});
```

---

## 6. 초대 링크 보안

### 토큰 생성

```typescript
import { randomBytes } from 'crypto';

// 32바이트 랜덤 토큰 생성
const token = randomBytes(32).toString('hex');
```

### 토큰 검증

```typescript
async validateInvitationToken(token: string): Promise<Invitation> {
  const invitation = await this.invitationRepository.findOne({
    where: { token }
  });

  if (!invitation) {
    throw new BadRequestException('INVALID_TOKEN');
  }

  if (invitation.expiresAt < new Date()) {
    throw new BadRequestException('TOKEN_EXPIRED');
  }

  if (invitation.isUsed) {
    throw new BadRequestException('TOKEN_ALREADY_USED');
  }

  return invitation;
}
```

---

## 7. 보안 헤더 설정

### Helmet 적용

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet());
```

### CORS 설정

```typescript
// main.ts
app.enableCors({
  origin: [
    'http://localhost:3000',  // Admin
    'http://localhost:3001',  // Client
  ],
  credentials: true,
});
```

---

## 8. 환경변수 관리

### .env.example

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=consultation

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App
APP_PORT=4000
ADMIN_URL=http://localhost:3000
CLIENT_URL=http://localhost:3001
```

---

## 보안 체크리스트

- [ ] JWT Secret Key 충분히 복잡하게 설정
- [ ] 비밀번호 bcrypt 해싱 (salt rounds: 10)
- [ ] ValidationPipe 전역 적용
- [ ] TypeORM 파라미터 바인딩 사용
- [ ] Helmet 미들웨어 적용
- [ ] CORS 허용 도메인 제한
- [ ] 환경변수로 민감 정보 관리
- [ ] 초대 토큰 만료 시간 설정 (7일)
- [ ] Rate Limiting 적용 (선택)
