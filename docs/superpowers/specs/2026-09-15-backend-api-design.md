# 타워 디펜스 백엔드 API — 설계 문서

- 날짜: 2026-09-15
- 상태: 승인됨 (구현 계획 단계로 진행)

## 1. 개요

현재 타워 디펜스 게임은 `localStorage`만 사용하는 순수 프론트엔드로 동작한다
(`2026-09-07-classic-tower-defense-design.md` 8절 참고). 이번 설계는 그
장기 로드맵이었던 백엔드 연동을 구체화한다.

**목표**
- Google OAuth 기반 계정/인증
- 세이브/로드를 서버와 동기화 (기존 `LocalStorageSaveService`를 대체하는
  `RemoteSaveService` 추가)
- 맵별 리더보드(클리어 타임, 도달 웨이브) 제출/조회

**비목표**
- 멀티플레이어, 실시간 통신(WebSocket)
- 리프레시 토큰, 세밀한 권한 체계 (MVP는 단순 재로그인으로 충분)
- 프론트엔드 UI(로그인 화면, 리더보드 화면) 구현 — 이번 문서는 API와 그
  API를 호출하는 서비스 계층까지만 다룬다

## 2. 기술 스택

- Node.js + Express + TypeScript
- DB: SQLite(로컬 개발) → PostgreSQL(운영)로 교체 가능한 스키마로 설계
  (raw SQL 또는 가벼운 쿼리 빌더 사용, ORM 락인 지양)
- 인증: Google OAuth 2.0 (authorization code flow) + 자체 발급 JWT
- 테스트: Vitest + supertest, in-memory SQLite

## 3. 아키텍처

### 3.1 인증 흐름

1. 클라이언트가 `GET /auth/google`로 이동 → Google 로그인 화면으로 리다이렉트.
2. Google이 `GET /auth/google/callback?code=...`로 콜백.
3. 서버가 code를 Google과 교환해 사용자 프로필(email, sub)을 얻고,
   `users` 테이블에서 `google_sub`로 조회하거나 새로 생성.
4. 서버가 자체 JWT(짧은 만료, 예: 7일)를 발급해 클라이언트로 반환한다.
5. 클라이언트는 이후 모든 API 호출에 `Authorization: Bearer <jwt>` 헤더를
   붙인다. 만료되면 재로그인(3.1의 1번부터 다시)만 지원한다 — 리프레시
   토큰은 이번 스코프에 넣지 않는다.

### 3.2 계층 구조

- **routes**: Express 라우터, 요청 파싱/응답만 담당.
- **services**: `AuthService`, `SaveService`(서버 측), `LeaderboardService` —
  비즈니스 로직과 DB 접근.
- **db**: 스키마 정의 + 마이그레이션, SQLite/PostgreSQL 공통 SQL만 사용.
- 프론트엔드 쪽은 기존 `SaveService` 인터페이스(3.4절, 클라이언트 설계
  문서)를 그대로 따르는 `RemoteSaveService` 구현체와, 새로 추가하는
  `LeaderboardService`(클라이언트) 인터페이스로 이 API를 호출한다.

## 4. 데이터 모델

### 4.1 `users`

| 필드 | 타입 | 설명 |
|---|---|---|
| id | INTEGER PK | |
| google_sub | TEXT UNIQUE | Google 계정 고유 ID |
| email | TEXT | |
| display_name | TEXT | |
| created_at | TIMESTAMP | |

### 4.2 `saves`

| 필드 | 타입 | 설명 |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users.id | |
| slot | INTEGER | 세이브 슬롯 번호 (MVP: 슬롯 1개, `slot = 1` 고정) |
| map_id | TEXT | |
| state_json | TEXT | 엔진 상태 직렬화(JSON) |
| updated_at | TIMESTAMP | |

`UNIQUE(user_id, slot)` 제약으로 슬롯당 최신 상태 1개만 유지한다.

### 4.3 `leaderboard_entries`

| 필드 | 타입 | 설명 |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users.id | |
| map_id | TEXT | |
| clear_time_ms | INTEGER | |
| wave_reached | INTEGER | |
| created_at | TIMESTAMP | |

한 유저가 같은 맵에 여러 기록을 남길 수 있다 (조회 시 맵당 최고 기록만
필터링).

## 5. REST 엔드포인트

| 메서드/경로 | 인증 | 설명 |
|---|---|---|
| `GET /auth/google` | - | Google OAuth 리다이렉트 시작 |
| `GET /auth/google/callback` | - | OAuth 콜백, JWT 발급 후 프론트로 리다이렉트 |
| `GET /auth/me` | 필요 | 현재 로그인한 사용자 정보 |
| `GET /saves` | 필요 | 내 세이브 슬롯 목록 |
| `GET /saves/:slot` | 필요 | 슬롯 상세 (state_json 포함) |
| `PUT /saves/:slot` | 필요 | 슬롯 upsert (전체 state_json 덮어쓰기) |
| `DELETE /saves/:slot` | 필요 | 슬롯 삭제 |
| `GET /leaderboard/:mapId?limit=&offset=` | - | 맵별 상위 기록 조회 (공개) |
| `POST /leaderboard/:mapId` | 필요 | 기록 제출 |

## 6. 프론트엔드 서비스 계약

### 6.1 `RemoteSaveService` (기존 `SaveService` 인터페이스 구현)

```ts
interface SaveService {
  save(slot: number, state: SerializedGameState): Promise<void>;
  load(slot: number): Promise<SerializedGameState | null>;
  delete(slot: number): Promise<void>;
}
```

`RemoteSaveService`는 위 인터페이스를 `PUT/GET/DELETE /saves/:slot` 호출로
구현한다. 네트워크 실패나 401은 예외로 던지지 않고 `LocalStorageSaveService`
와 동일하게 `load()`가 `null`을 반환하도록 감싸, 호출부(Vue 레이어)가
"저장된 게임 없음"과 "네트워크 오류"를 이번 스코프에서는 구분하지 않는다
(구분이 필요해지면 후속 작업에서 에러 타입을 확장).

### 6.2 `LeaderboardService` (신규)

```ts
interface LeaderboardService {
  submit(mapId: string, clearTimeMs: number, waveReached: number): Promise<void>;
  fetchTop(mapId: string, limit?: number): Promise<LeaderboardEntry[]>;
}
```

엔진이 발행하는 `game-victory` 이벤트를 Vue 레이어가 구독해
`LeaderboardService.submit(...)`을 호출한다. 엔진 자신은 네트워크나 인증을
전혀 알지 못한다 — 기존 설계의 "엔진은 순수 TypeScript, 부수효과는 Vue
레이어" 원칙(클라이언트 설계 문서 3.2절)을 그대로 유지한다.

## 7. 에러 처리

- JWT 누락/만료 → `401 Unauthorized`, 클라이언트는 로그인 화면으로 유도.
- 존재하지 않는 슬롯 `GET /saves/:slot` → `404`, `RemoteSaveService.load()`는
  이를 `null`로 변환.
- 리더보드 제출 값 검증: `clear_time_ms <= 0` 또는 `wave_reached <= 0`이면
  `400`으로 거부 (클라이언트 조작 방지를 위한 최소한의 서버 측 sanity
  check일 뿐, 이번 스코프에서는 리플레이 검증 등 부정행위 방지는 다루지
  않는다).
- 세이브 동시 쓰기 충돌은 다루지 않는다 (한 사용자가 여러 탭에서 동시에
  플레이하는 상황은 비목표) — 마지막 `PUT` 요청이 그대로 덮어쓴다.

## 8. 테스트 전략

- 백엔드: Vitest + supertest, 요청마다 in-memory SQLite로 초기화해 격리.
  - 인증: OAuth 콜백은 Google 응답을 목(mock)으로 대체해 사용자 생성/조회,
    JWT 발급을 검증.
  - saves/leaderboard 라우트: CRUD 및 인증 실패 케이스.
- 프론트엔드: `RemoteSaveService`/`LeaderboardService`는 `fetch`를 목으로
  대체해 기존 `LocalStorageSaveService` 테스트와 동일한 수준으로 검증.
  엔진/렌더러 테스트는 이 변경의 영향을 받지 않는다.

## 9. 스코프 밖 (Out of Scope)

- 리프레시 토큰, 로그아웃 시 서버 측 토큰 무효화(블랙리스트)
- 세이브 슬롯 다중화(현재 슬롯 1개 고정)
- 리더보드 부정행위 방지(리플레이 검증, 서버 측 재시뮬레이션 등)
- 로그인/리더보드 화면 등 프론트엔드 UI 구현
