## 🍳 에그톡 (3대3 소셜 러브게임)

<div align="center"><b>에그톡은 첫 만남이 어색한 남/녀를 위한 3:3 단계별 소개팅 서비스 입니다.</b></div>
<br/>

## 💻 서비스 소개

### 서비스 화면

<div align="center">

|                             메인 화면                             |                           아바타 선택                           |
| :---------------------------------------------------------------: | :-------------------------------------------------------------: |
| <img src="public/static/main_page.png" alt="화면 1" width="350"/> | <img src="public/static/avatar.png" alt="화면 2" width="350"/>  |
|                           **미팅 화면**                           |                          **서로 선택**                          |
|  <img src="public/static/random.gif" alt="화면 1" width="350"/>   |  <img src="public/static/love.gif" alt="화면 2" width="350"/>   |
|                       **미팅 중 1:1 대화**                        |                      **미팅 중 그림 대회**                      |
|  <img src="public/static/oneone.png" alt="화면 1" width="350"/>   | <img src="public/static/drawing.png" alt="화면 2" width="350"/> |
|                           **1:1 통화**                            |                          **친구 채팅**                          |
| <img src="public/static/lastpick.png" alt="화면 1" width="350"/>  |  <img src="public/static/chat.png" alt="화면 2" width="350"/>   |

</div>

### 서비스 소개

![image](https://github.com/user-attachments/assets/eaddeda1-0394-421a-b443-43fdc7c8ae04)

#### 3대3 블라인드 미팅

미팅 중에 마음에 드는 사람과 1:1 대화를 할 수 있습니다.

#### 아이스브레이킹

처음 만나는 유저들간 어색함을 해소할 수 있는 자기 소개, 랜덤 질문, 그림 대회 이벤트를 제공합니다.

#### 최종 선택

최종 매칭이 되면 친구 신청 및 1:1 대화방으로 이동이 가능합니다. 친구가 되면 1:1 채팅을 할 수 있습니다.

## 🧑‍💻 팀원 구성

|        [남홍근](https://github.com/Amborsia)        |        [김성현](https://github.com/sh940701)        |        [김재원](https://github.com/won-N-only)        |        [박진용](https://github.com/Bambamsong)        |        [김인석](https://github.com/ingssg)        |        [이민형](https://github.com/hyeong1)        |
| :-------------------------------------------------: | :-------------------------------------------------: | :---------------------------------------------------: | :---------------------------------------------------: | :-----------------------------------------------: | :------------------------------------------------: |
| ![남홍근](https://github.com/Amborsia.png?size=600) | ![김성현](https://github.com/sh940701.png?size=600) | ![김재원](https://github.com/won-N-only.png?size=600) | ![박진용](https://github.com/Bambamsong.png?size=600) | ![김인석](https://github.com/ingssg.png?size=600) | ![이민형](https://github.com/hyeong1.png?size=600) |
|                         BE                          |                      BE, Infra                      |                        BE, FE                         |                        BE, FE                         |                        FE                         |                         FE                         |

### 🥚 역할 분담 (Front-End)

#### 김인석

미팅 페이지 UI, 미팅 아이스브레이킹 컨텐츠

#### 이민형

메인 페이지 UI, 친구 채팅

#### 김재원

미팅 아이스브레이킹(그림 대회) 컨텐츠

#### 박진용

메인 페이지 내 전체 채팅

## 🔨 기술 스택

### Front-End

<div style="display: flex;">
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/Recoil-3578E5?style=for-the-badge&logo=recoil&logoColor=white" />
<img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white" />
<img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
</div>

### Back-End

<div style="display: flex;">
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
<img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
<img src="https://img.shields.io/badge/OpenVidu-1D74DA?style=for-the-badge&logo=openvidu&logoColor=white" />
<img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
</div>

## ⌨️ 개발 내용

### 사용자의 웹캠에 3D 아바타 합성 후 송출

MindAR 라이브러리에서 제공하는 얼굴 메쉬와 BlendShapes(표정 정보)를 사용했습니다. THree.js 를 통해 1프레임마다 표정 정보를 업데이트하여 사용자의 얼굴 표정을 실시간으로 반영했습니다.

### 백엔드 서버와의 실시간 통신

Socket.io를 활용하여 백엔드 서버로부터 시간 정보를 받아 클라이언트 간 미팅 타이머를 동기화했습니다. 일정 시간마다 백엔드 서버로부터 미팅 이벤트 신호를 수신하여 미팅 컨텐츠를 실행했으며, 메인 페이지에서는 친구 채팅과 전체 채팅 기능을 구현했습니다.

### Dynamic Import를 통한 초기 로딩 속도 개선

미팅 중 소켓 이벤트가 수신되어야 렌더링되는 컴포넌트들은 미리 렌더링 하지 않고, lazy loading을 적용하여 미팅 페이지의 초기 렌더링 속도를 0.8초 단축했습니다.

### 클라이언트별 네크워크 환경에 따른 동적 비디오 스트림 품질 조절

navigator 객체를 통해 클라이언트의 네트워크 연결 유형과 RTT를 체크하여 연결 유형 3G 또는 RTT 150 이하의 환경에서 프레임레이트와 해상도를 낮춰 송출했습니다.

## 📙 시작 가이드

🚨 node 버전 20 기준으로 개발하였습니다.

🚨 npm install 중 mind-ar canvas 오류가 생기면

```
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

위 명령어를 입력해주세요!

```
npm run dev
```

## 📰 포스터

<img src="public\static\poster.png">
