# 개발 환경 및 배포

## 1. Docker 기반 개발 환경

### 프로젝트 구조

```
/
├── frontend-admin/
│   ├── Dockerfile
│   └── ...
├── frontend-client/
│   ├── Dockerfile
│   └── ...
├── backend/
│   ├── Dockerfile
│   └── ...
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env
```

### docker-compose.yml (개발용)

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: consultation-db
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_DATABASE}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - consultation-network

  # Backend (NestJS)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: consultation-backend
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_DATABASE=${DB_DATABASE}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "4000:4000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
    networks:
      - consultation-network

  # Frontend Admin (React)
  frontend-admin:
    build:
      context: ./frontend-admin
      dockerfile: Dockerfile.dev
    container_name: consultation-admin
    environment:
      - VITE_API_URL=http://localhost:4000
    ports:
      - "3000:3000"
    volumes:
      - ./frontend-admin:/app
      - /app/node_modules
    networks:
      - consultation-network

  # Frontend Client (React)
  frontend-client:
    build:
      context: ./frontend-client
      dockerfile: Dockerfile.dev
    container_name: consultation-client
    environment:
      - VITE_API_URL=http://localhost:4000
    ports:
      - "3001:3001"
    volumes:
      - ./frontend-client:/app
      - /app/node_modules
    networks:
      - consultation-network

volumes:
  postgres_data:

networks:
  consultation-network:
    driver: bridge
```

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["node", "dist/main"]
```

### Frontend Dockerfile

```dockerfile
# frontend-admin/Dockerfile (frontend-client도 동일)
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 2. 실행 방법

### 개발 환경 실행

```bash
# 1. 환경변수 설정
cp .env.example .env

# 2. Docker Compose 실행
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f

# 4. 종료
docker-compose down
```

### 개별 서비스 실행 (Docker 없이)

```bash
# Database (PostgreSQL 설치 필요)
# postgresql 서비스 시작

# Backend
cd backend
npm install
npm run start:dev

# Frontend Admin
cd frontend-admin
npm install
npm run dev

# Frontend Client
cd frontend-client
npm install
npm run dev
```

---

## 3. AWS 배포 시나리오

### 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐                                           │
│   │   Route 53  │ ─── DNS                                   │
│   └──────┬──────┘                                           │
│          │                                                  │
│          ▼                                                  │
│   ┌─────────────┐                                           │
│   │ CloudFront  │ ─── CDN                                   │
│   └──────┬──────┘                                           │
│          │                                                  │
│   ┌──────┴──────────────────────┐                           │
│   │                             │                           │
│   ▼                             ▼                           │
│ ┌─────────┐              ┌─────────────┐                    │
│ │   S3    │              │     ALB     │                    │
│ │ (Static)│              │(API Gateway)│                    │
│ └─────────┘              └──────┬──────┘                    │
│   Frontend                      │                           │
│                                 ▼                           │
│                          ┌─────────────┐                    │
│                          │    ECS      │                    │
│                          │  (Fargate)  │                    │
│                          └──────┬──────┘                    │
│                                 │                           │
│                                 ▼                           │
│                          ┌─────────────┐                    │
│                          │     RDS     │                    │
│                          │ (PostgreSQL)│                    │
│                          └─────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 배포 단계

1. **ECR에 Docker 이미지 푸시**
```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin {account-id}.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 빌드 및 푸시
docker build -t consultation-backend ./backend
docker tag consultation-backend:latest {ecr-uri}:latest
docker push {ecr-uri}:latest
```

2. **RDS 인스턴스 생성**
   - Engine: PostgreSQL 15
   - Instance: db.t3.micro (개발/테스트)
   - Multi-AZ: No (비용 절감)

3. **ECS Fargate 서비스 생성**
   - Task Definition 작성
   - 환경변수 (Secrets Manager 활용)

4. **S3 + CloudFront로 Frontend 배포**
```bash
# Frontend 빌드
npm run build

# S3 업로드
aws s3 sync dist/ s3://{bucket-name} --delete

# CloudFront 캐시 무효화
aws cloudfront create-invalidation --distribution-id {id} --paths "/*"
```

---

## 4. GCP 배포 시나리오 (대안)

### Cloud Run 활용

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/consultation-backend', './backend']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/consultation-backend']

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'consultation-backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/consultation-backend'
      - '--region'
      - 'asia-northeast3'
      - '--platform'
      - 'managed'
```

---

## 5. 환경별 설정

| 환경 | DB | Backend | Frontend |
|------|----|---------|---------|
| **Local** | localhost:5432 | localhost:4000 | localhost:3000/3001 |
| **Docker** | postgres:5432 | backend:4000 | - |
| **AWS** | RDS endpoint | ECS/ALB | S3 + CloudFront |
| **GCP** | Cloud SQL | Cloud Run | Firebase Hosting |

---

## Trade-off 의사결정

### AWS vs GCP
| 선택 | AWS |
|------|-----|
| **이유** | 더 넓은 서비스 범위, 한국 리전 안정성 |
| **Trade-off** | 비용 vs 기능 |

### ECS Fargate vs EC2
| 선택 | ECS Fargate |
|------|-------------|
| **이유** | 서버 관리 불필요, 자동 스케일링 |
| **Trade-off** | 비용 증가 vs 관리 편의성 |
