# 타워 디펜스 백엔드 API 명세서

- 날짜: 2026-09-15
- 설계 근거: `docs/superpowers/specs/2026-09-15-backend-api-design.md`
- Base URL: `/api` (예시 기준, 실제 배포 URL은 환경별로 설정)
- 인증 방식: `Authorization: Bearer <JWT>` 헤더 (명시된 엔드포인트만 필요)
- Content-Type: 모든 요청/응답은 `application/json` (OAuth 리다이렉트 제외)

## 공통 에러 응답 형식

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "인증 토큰이 없거나 만료되었습니다."
  }
}
```

| HTTP 상태 | code | 설명 |
|---|---|---|
| 400 | `INVALID_REQUEST` | 요청 형식/값이 유효하지 않음 |
| 401 | `UNAUTHORIZED` | 토큰 없음/만료/위조 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |

---

## 1. 인증 (Auth)

### 1.1 `GET /auth/google`

Google OAuth 로그인 시작. 브라우저를 이 URL로 이동시키면 Google 로그인
화면으로 302 리다이렉트된다.

- 인증: 불필요
- 요청: 없음
- 응답: `302 Found`, `Location: https://accounts.google.com/o/oauth2/v2/auth?...`

### 1.2 `GET /auth/google/callback`

Google이 로그인 완료 후 호출하는 콜백. 서버가 code를 교환해 사용자를
생성/조회하고 JWT를 발급한 뒤, 프론트엔드로 리다이렉트한다.

- 인증: 불필요
- 쿼리 파라미터: `code` (string, Google이 전달), `state` (string, CSRF 방지용)
- 응답: `302 Found`,
  `Location: <FRONTEND_URL>/auth/callback#token=<JWT>`
  (JWT는 URL fragment로 전달해 서버 로그에 남지 않도록 한다)
- 에러: code 교환 실패 시 `302 Found`,
  `Location: <FRONTEND_URL>/auth/callback?error=oauth_failed`

### 1.3 `GET /auth/me`

현재 로그인한 사용자 정보 조회.

- 인증: **필요**
- 요청: 없음
- 응답 `200 OK`

```json
{
  "id": 42,
  "email": "player@example.com",
  "displayName": "홍길동",
  "createdAt": "2026-09-15T09:00:00.000Z"
}
```

- 에러: `401 UNAUTHORIZED`

---

## 2. 세이브 (Saves)

세이브는 사용자당 슬롯 1개만 지원한다 (MVP 스코프, `slot`은 항상 `1`).

### 2.1 `GET /saves`

내 세이브 슬롯 목록 조회 (상세 상태 없이 메타데이터만).

- 인증: **필요**
- 응답 `200 OK`

```json
{
  "saves": [
    { "slot": 1, "mapId": "map-1", "updatedAt": "2026-09-15T10:00:00.000Z" }
  ]
}
```

빈 배열이면 세이브가 없는 것.

### 2.2 `GET /saves/:slot`

특정 슬롯의 전체 게임 상태 조회.

- 인증: **필요**
- 경로 파라미터: `slot` (integer, 현재는 `1`만 유효)
- 응답 `200 OK`

```json
{
  "slot": 1,
  "mapId": "map-1",
  "state": { "gold": 250, "lives": 15, "wave": 4, "towers": [] },
  "updatedAt": "2026-09-15T10:00:00.000Z"
}
```

- 에러: `404 NOT_FOUND` (해당 슬롯에 세이브 없음), `401 UNAUTHORIZED`

### 2.3 `PUT /saves/:slot`

슬롯 upsert. 기존 값을 전체 덮어쓴다 (부분 업데이트 없음).

- 인증: **필요**
- 경로 파라미터: `slot` (integer)
- 요청 본문:

```json
{
  "mapId": "map-1",
  "state": { "gold": 250, "lives": 15, "wave": 4, "towers": [] }
}
```

- 응답 `200 OK`

```json
{ "slot": 1, "mapId": "map-1", "updatedAt": "2026-09-15T10:05:00.000Z" }
```

- 에러: `400 INVALID_REQUEST` (`mapId`/`state` 누락), `401 UNAUTHORIZED`

### 2.4 `DELETE /saves/:slot`

슬롯 삭제.

- 인증: **필요**
- 응답: `204 No Content`
- 에러: `404 NOT_FOUND`, `401 UNAUTHORIZED`

---

## 3. 리더보드 (Leaderboard)

### 3.1 `GET /leaderboard/:mapId`

맵별 상위 기록 조회 (공개, 인증 불필요). 사용자당 최고 기록만 반환하고
클리어 타임(짧은 순)으로 정렬한다.

- 인증: 불필요
- 경로 파라미터: `mapId` (string)
- 쿼리 파라미터: `limit` (integer, 기본 20, 최대 100), `offset` (integer, 기본 0)
- 응답 `200 OK`

```json
{
  "mapId": "map-1",
  "entries": [
    {
      "displayName": "홍길동",
      "clearTimeMs": 245000,
      "waveReached": 20,
      "createdAt": "2026-09-15T11:00:00.000Z"
    }
  ]
}
```

### 3.2 `POST /leaderboard/:mapId`

기록 제출.

- 인증: **필요**
- 경로 파라미터: `mapId` (string)
- 요청 본문:

```json
{ "clearTimeMs": 245000, "waveReached": 20 }
```

- 검증: `clearTimeMs > 0` 그리고 `waveReached > 0`이어야 함. (리플레이
  검증 등 부정행위 방지는 스코프 밖 — 설계 문서 9절 참고)
- 응답 `201 Created`

```json
{
  "id": 1001,
  "mapId": "map-1",
  "clearTimeMs": 245000,
  "waveReached": 20,
  "createdAt": "2026-09-15T11:00:00.000Z"
}
```

- 에러: `400 INVALID_REQUEST` (값 검증 실패), `401 UNAUTHORIZED`

---

## 4. 엔드포인트 요약

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| GET | `/auth/google` | - | OAuth 로그인 시작 |
| GET | `/auth/google/callback` | - | OAuth 콜백, JWT 발급 |
| GET | `/auth/me` | ✅ | 내 정보 조회 |
| GET | `/saves` | ✅ | 세이브 목록 |
| GET | `/saves/:slot` | ✅ | 세이브 상세 |
| PUT | `/saves/:slot` | ✅ | 세이브 upsert |
| DELETE | `/saves/:slot` | ✅ | 세이브 삭제 |
| GET | `/leaderboard/:mapId` | - | 리더보드 조회 |
| POST | `/leaderboard/:mapId` | ✅ | 기록 제출 |
