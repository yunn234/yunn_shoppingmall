# Shopping Mall Client

Vite와 React를 사용한 쇼핑몰 클라이언트 프로젝트입니다.

## 설치 방법

```bash
npm install
```

## 실행 방법

### 개발 모드
```bash
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

### 프로덕션 빌드
```bash
npm run build
```

### 빌드 미리보기
```bash
npm run preview
```

## 프로젝트 구조

```
client/
├── public/          # 정적 파일
├── src/
│   ├── App.jsx      # 메인 App 컴포넌트
│   ├── App.css      # App 스타일
│   ├── main.jsx     # 진입점
│   └── index.css    # 전역 스타일
├── index.html       # HTML 템플릿
├── vite.config.js   # Vite 설정
└── package.json     # 프로젝트 의존성
```

## 주요 기능

- ⚡️ Vite로 빠른 개발 환경
- ⚛️ React 18
- 🎨 CSS 스타일링
- 🔄 Hot Module Replacement (HMR)
- 📦 프로덕션 최적화 빌드

## API 프록시 설정

`vite.config.js`에서 API 프록시가 설정되어 있습니다. `/api`로 시작하는 요청은 자동으로 `http://localhost:5001`로 프록시됩니다.
