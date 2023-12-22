# Ethers / Truffle / Metamask 을 활용한 Web3 application

## 프로젝트 제작 인원
- 김연우 : web2 기반 application web3로 변경, 게시글 작성 시 토큰 보상 구현

### 개발 환경

- React
- Express.js
- Mysql
- Ethers.js
- Solidity

## 서버 : server.js

### 주요 의존성 : 
- [Express](https://www.npmjs.com/package/express): Node.js를 위한 웹 프레임워크
- [express-session](https://www.npmjs.com/package/express-session): 사용자 세션 관리 미들웨어
- [body-parser](https://www.npmjs.com/package/body-parser): 들어오는 요청 본문을 구문 분석하는 미들웨어
- [ethers](https://www.npmjs.com/package/ethers): 이더리움과 상호 작용하기 위한 라이브러리
- [dotenv](https://www.npmjs.com/package/dotenv): 환경 변수를 .env 파일에서 로드하는 제로 종속성 모듈

### 주요 엔드포인트 :

- `/rewardTokens`: 게시글 작성 시 토큰 보상
- `/admin`: 관리자 계정 접근 시 토큰 발행과 소거

## 클라이언트 : App.js

### 주요 컴포넌트:

- `Mypage`: 마이 페이지, 토큰 발행과 소거
- `Post`: 게시글 작성 폼, 토큰 자동 보상

## DB : Mysql

### Table 구성

- users : name, wallet
- posts : idx, wallet, content
- comments : idx, postId, writer, comment

## 컴파일 방법

- `truffle compile`

## 빌드 방법

- `npm run build`

## 실행 방법

1. 서버 실행: `node server.js`
2. 클라이언트 실행: `npm start`

## 동작 영상

[웹사이트 동작 영상 바로가기](https://youtu.be/TK_M_lgHN4Q)
