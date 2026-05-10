# Publedge TODO

Publedge 개선을 위한 실행 TODO입니다. 우선순위는 “MVP 안정화 → 핵심 차별점 강화 → 출시/운영 준비” 순서로 잡았습니다.

## 우선순위 요약

### P0 — 바로 하면 좋은 기본 정리

- [x] `package.json`에 `typecheck` 스크립트 추가
  - 예: `"typecheck": "tsc --noEmit"`
  - 검증: `npm run typecheck`

- [x] `.env.example` 생성
  - 실제 secret 없이 필요한 환경변수 이름만 문서화
  - 후보 변수:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
    - `SUPABASE_SECRET_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `OPENAI_API_KEY`
    - `TOSS_CLIENT_KEY`
    - `TOSS_SECRET_KEY`
    - `NEXT_PUBLIC_SITE_URL`

- [x] README 최신화
  - Supabase migration 직접 실행/관리 내용은 제외
  - 현재 라우트 구조 업데이트
  - 환경변수 이름은 `.env.example` 기준으로 관리
  - 로컬 개발/빌드/검증 체크리스트 추가

- [x] 기본 검증 루틴 정리
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`

## P1 — MVP 핵심 플로우 안정화

목표: 사용자가 “콘텐츠 생성 → 업로드/작성 → 편집 → 미리보기 → 공개”까지 막히지 않고 진행할 수 있게 만들기.

- [ ] `/create` 페이지 개선
  - 현재 단계와 다음 행동이 더 명확히 보이도록 UX 개선
  - “직접 작성하기”와 “파일 업로드”의 차이 설명 추가
  - 가격, 언어, 설명 입력의 도움말 보강

- [ ] 업로드 후 챕터 분리 결과 검수 UX 강화
  - TXT/Markdown/DOCX 업로드 후 생성된 챕터 목록 확인
  - 챕터 제목 수정
  - 챕터 병합/분리 후보 검토
  - 업로드 실패 시 사용자 친화적 에러 메시지 제공

- [ ] 공개 전 체크리스트 추가
  - 제목 있음
  - 설명 있음
  - 커버 있음
  - 챕터 1개 이상
  - 가격 설정 확인
  - 공개 범위 확인
  - 미리보기 확인 완료

- [ ] `/create/preview/[bookId]`를 출판 전 최종 검수 화면으로 강화
  - 독자에게 보이는 형태 미리보기
  - 공개/비공개/가격 상태 표시
  - 누락 항목 안내
  - “공개하기” CTA 추가 또는 강화

- [ ] 랜딩/탐색 빈 상태 UX 개선
  - 콘텐츠가 없어도 서비스 가치가 보이게 샘플 카드/CTA 추가
  - “첫 콘텐츠 만들기” CTA 추가
  - “Publedge로 만들 수 있는 것” 예시 섹션 추가

## P1 — TTS 오디오북 안정화

목표: 서버리스 환경에서도 오디오북 생성이 중간에 끊기지 않게 만들기.

현재 관찰:
- `src/app/api/tts/generate/route.ts`에서 `processAudiobookAsync(...)`를 fire-and-forget으로 실행하고 있음
- Vercel 같은 서버리스 환경에서는 응답 이후 런타임이 종료되어 작업이 중단될 위험이 있음

- [ ] TTS 구조 설계 정리
  - Next.js API route는 “작업 등록”까지만 담당
  - Supabase DB에 `pending` audiobook/audio_chapters 생성
  - Supabase Edge Function 또는 queue worker가 실제 TTS 처리

- [ ] `supabase/functions/tts-worker/index.ts` 역할 확정
  - pending 작업 조회
  - 챕터별 TTS 생성
  - Storage 업로드
  - audio_chapters 상태 업데이트
  - 실패 시 retry_count/error_message 기록

- [ ] TTS 상태 모델 정리
  - `pending`
  - `processing`
  - `completed`
  - `partial_failed`
  - `failed`
  - `cancelled` 후보 검토

- [ ] TTS 진행률 UI 연결
  - `TTSProgressPanel`이 실제 `audio_chapters` 상태를 반영하도록 확인
  - 실패한 챕터 재시도 버튼 추가
  - 완료 후 오디오북 플레이어로 이동 CTA 추가

- [ ] TTS 비용/제한 UX 추가
  - 예상 글자 수
  - 예상 비용
  - 예상 생성 시간
  - 동시 생성 제한 안내

## P1 — 에디터/이미지 업로드 개선

목표: 장문 콘텐츠와 이미지가 들어가도 안정적으로 저장/렌더링되게 만들기.

현재 관찰:
- `src/components/editor/RichTextEditor.tsx`에서 이미지를 base64 data URL로 본문에 삽입함
- 장문 콘텐츠에서는 DB row 크기, 렌더링 성능, EPUB/PDF 생성 문제가 생길 수 있음

- [ ] 이미지 업로드 endpoint 추가
  - 후보: `src/app/api/upload/image/route.ts`
  - JPEG/PNG/WebP/GIF 허용 여부 결정
  - 파일 크기 제한
  - 인증 필수

- [ ] Supabase Storage 기반 이미지 저장
  - 경로 예: `books/{bookId}/chapters/{chapterId}/images/{imageId}.webp`
  - 본문 HTML에는 Storage URL만 저장
  - 삭제/교체 정책 검토

- [ ] 에디터 이미지 삽입 로직 변경
  - base64 대신 업로드 후 URL 삽입
  - 업로드 중 loading 상태 표시
  - 실패 시 에러 안내

- [ ] PDF/EPUB 생성 시 원격 이미지 처리 확인
  - 이미지가 export 결과에 포함되는지 검증
  - CORS/서명 URL 만료 문제 확인

## P2 — 테스트 기반 마련

목표: 핵심 변환/보안/권한 로직을 안전하게 바꿀 수 있게 만들기.

- [ ] 테스트 프레임워크 선택
  - 후보: Vitest + React Testing Library
  - E2E 후보: Playwright

- [ ] `src/lib/sanitize.ts` 테스트 추가
  - script 태그 제거
  - 이벤트 핸들러 제거
  - 허용 태그 유지
  - checkbox input만 허용되는지 확인

- [ ] `src/lib/access-control.ts` 테스트 추가
  - owner 접근
  - 무료 공개 책 접근
  - 비공개/미발행 책 차단
  - 구매자 접근
  - 비구매자 차단

- [ ] 업로드 파서 테스트를 위해 로직 분리
  - 현재 `src/app/api/upload/route.ts` 내부의 파싱/챕터 분리 로직을 `src/lib/upload-parser.ts` 등으로 이동 검토
  - TXT/Markdown/DOCX 챕터 분리 테스트
  - 빈 파일/지원하지 않는 확장자/대용량 파일 테스트

- [ ] TTS 텍스트 처리 테스트 추가
  - HTML → 순수 텍스트 추출
  - 문장 경계 분할
  - 너무 긴 챕터 chunking
  - 실패 retry 로직

- [ ] 최소 E2E 테스트 추가
  - 회원가입/로그인은 mock 또는 테스트 계정 전략 필요
  - 콘텐츠 생성
  - 업로드
  - 편집
  - 미리보기
  - 공개

## P2 — 권한/결제/판매 플로우 정리

목표: 무료/유료 콘텐츠 접근과 구매 경험을 명확하게 만들기.

- [ ] `src/lib/access-control.ts` 확장
  - 현재: `owner`, `purchased`, `free`, `none`
  - 후보 추가: `collaborator`, `subscriber`, `preview`, `admin`, `expired`, `unpublished`

- [ ] 권한 함수 세분화
  - 책 읽기 권한
  - 책 수정 권한
  - 오디오 생성 권한
  - 리뷰 작성 권한
  - 구매 콘텐츠 접근 권한

- [ ] 유료 콘텐츠 미리보기 정책 정하기
  - 첫 챕터 무료 공개 여부
  - 일부 문단 미리보기 여부
  - 오디오북 미리듣기 여부

- [ ] 결제 플로우 점검
  - 결제 요청
  - 결제 승인
  - 구매 내역 생성
  - 중복 결제 방지
  - 실패/취소 처리
  - 테스트 결제 문서화

- [ ] 크리에이터 판매 대시보드 개선
  - 판매 수
  - 매출
  - 인기 콘텐츠
  - 구매 전환율

## P2 — 인터랙티브 템플릿을 차별점으로 강화

목표: Publedge를 “읽기만 하는 전자책”이 아니라 “독자가 직접 참여하는 전자책” 플랫폼으로 포지셔닝하기.

현재 구현된 템플릿 후보:
- Checklist
- Callout
- Reflection
- Toggle
- ColumnList
- SMART Goal
- Before/After
- Scale
- Quadrant
- OKR
- HabitTracker
- WOOP

- [ ] 템플릿별 사용 예시 콘텐츠 만들기
  - 크리에이터가 언제 쓰면 좋은지 설명
  - 독자에게 어떻게 보이는지 예시 제공

- [ ] SlashCommand 삽입 UX 개선
  - 템플릿 검색
  - 카테고리 분류
  - 미리보기
  - 최근 사용 템플릿

- [ ] 독자 입력 저장/복원 정책 정리
  - localStorage만 사용할지
  - 로그인 사용자는 DB 저장할지
  - 기기 간 동기화 여부

- [ ] 독자 작성 내용 내보내기
  - PDF 출력
  - Markdown 다운로드
  - 개인 노트 저장

- [ ] 템플릿 포함 리더/PDF/EPUB 품질 검증
  - 모바일 리더
  - 다크/라이트 테마
  - PDF 출력
  - EPUB 출력

## P3 — 운영 안정성/관측 가능성

목표: 실패 원인을 빠르게 파악하고 사용자에게 적절히 안내할 수 있게 만들기.

- [ ] API 응답 형식 통일
  - 성공: `{ data }`
  - 실패: `{ error, code, requestId? }`

- [ ] request id 추가 검토
  - API route별 로그 추적 가능하게 하기

- [ ] 주요 이벤트 로그 테이블 검토
  - TTS job 로그
  - 결제 이벤트 로그
  - 업로드 실패 로그
  - AI 기능 사용 로그

- [ ] 사용자 메시지와 내부 로그 메시지 분리
  - 사용자에게는 친절한 한국어 메시지
  - 내부에는 디버깅 가능한 상세 메시지

- [ ] 관리자용 상태 확인 페이지 검토
  - 최근 TTS 실패
  - 결제 실패
  - 업로드 실패
  - OpenAI/Supabase 오류

## P3 — 출시 준비/콘텐츠 확보

목표: 실제 사용자가 들어왔을 때 비어 보이지 않고, 초기 피드백을 받을 수 있게 만들기.

- [ ] 샘플 콘텐츠 3~5개 준비
  - 무료 전자책
  - 오디오북 포함 콘텐츠
  - 인터랙티브 템플릿 포함 콘텐츠
  - 유료 콘텐츠 예시

- [ ] 크리에이터 온보딩 문서 작성
  - 원고 준비 방법
  - 업로드 방법
  - 가격 설정 방법
  - 오디오북 생성 방법
  - 공개 후 공유 방법

- [ ] `creator-outreach/` 문서와 제품 실험 연결
  - 초기 크리에이터 후보 목록
  - 제안 메시지
  - 피드백 질문지
  - 성공 기준

- [ ] 베타 출시 체크리스트 작성
  - Vercel 배포
  - Supabase env 설정
  - Storage bucket/policy 확인
  - OpenAI/Toss 키 확인
  - 테스트 결제 확인
  - 샘플 콘텐츠 확인

## 추천 4주 로드맵

### 1주차 — MVP 기본 정리

- [ ] `typecheck` 스크립트 추가
- [ ] `.env.example` 생성
- [ ] README 최신화
- [ ] 생성/업로드/편집/미리보기/공개 플로우 QA
- [ ] 랜딩/탐색 빈 상태 개선

### 2주차 — TTS 안정화

- [ ] TTS 작업 등록/worker 구조로 전환 계획 확정
- [ ] Supabase Edge Function worker 정리
- [ ] TTS retry/status/progress 모델 정리
- [ ] TTS 진행률 UI 연결
- [ ] 실패 재시도 UX 추가

### 3주차 — 크리에이터 경험 강화

- [ ] 공개 전 체크리스트 추가
- [ ] 커버/설명/가격 설정 UX 개선
- [ ] 이미지 업로드 Storage화
- [ ] PDF/EPUB 품질 점검
- [ ] 인터랙티브 템플릿 삽입 UX 개선

### 4주차 — 출시 준비

- [ ] 결제 플로우 테스트
- [ ] 권한/access-control 정리
- [ ] 최소 E2E 테스트 추가
- [ ] 샘플 콘텐츠 등록
- [ ] 크리에이터 온보딩 문서 작성
- [ ] 배포 체크리스트 작성

## 다음 액션 추천

가장 먼저 진행하기 좋은 작은 작업:

1. `package.json`에 `typecheck` 추가
2. `.env.example` 생성
3. README의 migration/env/route 최신화
4. 랜딩 빈 상태와 CTA 개선
5. TTS 구조 개선 계획서 작성

Hermes로 이어서 실행한다면 다음 순서를 추천합니다.

```text
1. P0 기본 정리부터 처리
2. lint/typecheck/build로 검증
3. MVP 핵심 플로우 QA
4. TTS worker 구조 개선 계획 작성
5. 구현 작업을 작은 단위로 나누어 진행
```
