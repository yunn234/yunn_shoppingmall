# Shopping Mall Server

Node.js, Express, MongoDB를 사용한 쇼핑몰 서버 프로젝트입니다.

## 프로젝트 구조

```
server/
├── config/
│   └── database.js      # MongoDB 연결 설정
├── routes/
│   └── index.js         # API 라우트
├── server.js            # 메인 서버 파일
├── package.json         # 프로젝트 의존성
└── env.example          # 환경 변수 예시 파일
```

## 설치 방법

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
```bash
cp env.example .env
```

3. `.env` 파일을 열어 MongoDB 연결 정보를 설정하세요.

## 실행 방법

### 개발 모드 (nodemon 사용)
```bash
npm run dev
```

### 프로덕션 모드
```bash
npm start
```

## 환경 변수

- `PORT`: 서버 포트 (기본값: 5001)
- `MONGODB_URI`: MongoDB 연결 URI

## API 엔드포인트

- `GET /`: 서버 상태 확인
- `GET /api/health`: 헬스 체크 (데이터베이스 연결 상태 포함)

## MongoDB 설정

### 로컬 MongoDB 사용
로컬에 MongoDB가 설치되어 있다면 기본 URI를 사용할 수 있습니다:
```
MONGODB_URI=mongodb://localhost:27017/shopping-mall
```

### MongoDB Atlas 사용
MongoDB Atlas를 사용하는 경우, 클러스터 연결 문자열을 사용하세요:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopping-mall?retryWrites=true&w=majority
```
