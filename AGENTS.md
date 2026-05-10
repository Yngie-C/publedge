# AGENTS.md

이 파일은 Hermes Agent, Codex, Claude Code 및 기타 코딩 에이전트가 이 저장소에서 작업할 때 우선적으로 따라야 하는 프로젝트별 지침이자 source of truth입니다.

에이전트는 코드 변경 전에 이 파일을 읽고 따라야 합니다. 더 깊은 디렉터리에 별도의 `AGENTS.md`가 있으면 해당 하위 범위에서는 더 깊은 파일이 이 지침을 우선합니다.

판단이 애매할 때는 다음 원칙을 우선하세요.

- 사용자가 만든 변경사항을 보존하세요.
- 기존 프로젝트 패턴을 먼저 따르세요.
- 변경 diff를 작고 되돌리기 쉽게 유지하세요.
- 가능한 경우 lint, typecheck, build로 검증하세요.

## 프로젝트 개요

Publedge는 누구나 텍스트를 업로드하면 전자책과 오디오북을 만들 수 있는 출판 민주화 플랫폼입니다.

핵심 기능:
- 텍스트/Markdown/DOCX 업로드
- 챕터 구조화 및 전자책 변환
- 웹 전자책 리더
- OpenAI TTS 기반 오디오북 생성
- PDF/EPUB 내보내기
- Tiptap 기반 리치 텍스트 에디터
- Supabase Auth/DB/Storage/Edge Functions 기반 백엔드

## 기술 스택

- Framework: Next.js 16 App Router
- Language: TypeScript 5.9
- UI: React 19
- Styling: Tailwind CSS 4
- State: Zustand 5
- Data Fetching: TanStack Query
- Backend: Supabase Auth, PostgreSQL, Storage, Realtime, Edge Functions
- Editor: Tiptap
- PDF: @react-pdf/renderer, pdf-lib
- TTS: OpenAI TTS API
- i18n: next-intl
- Package manager: npm

## 주요 디렉터리

- `src/app/`: Next.js App Router 페이지와 API routes
- `src/components/`: UI 및 기능별 컴포넌트
- `src/hooks/`: 커스텀 React hooks
- `src/i18n/`: next-intl 메시지와 요청 설정
- `src/lib/`: Supabase, OpenAI, sanitize, PDF/EPUB/TTS 등 핵심 유틸리티
- `src/stores/`: Zustand stores
- `src/types/`: TypeScript 타입 정의
- `supabase/migrations/`: Supabase DB 마이그레이션
- `supabase/functions/`: Supabase Edge Functions
- `content/`: 전자책 원고 및 콘텐츠 문서
- `creator-outreach/`: 크리에이터 아웃리치 관련 문서
- `.claude/`: Claude Code 커스텀 커맨드/프로젝트 메모
- `.omc/`, `.omx/`: 로컬 에이전트/작업 상태. 일반적으로 직접 수정하지 말 것

## 기본 명령어

개발 서버:

```bash
npm run dev
```

Lint:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

TypeScript typecheck:

```bash
npm run typecheck
```

## 작업 전 체크리스트

1. 현재 작업 트리 상태를 확인하세요.

```bash
git status --short
```

2. 사용자가 이미 수정한 파일을 덮어쓰지 마세요.
3. 기존 변경사항이 있으면 그 변경사항을 보존하는 방향으로 작업하세요.
4. 큰 변경 전에는 관련 파일과 README, 기존 구현 패턴을 먼저 확인하세요.
5. 큰 작업이나 맥락 확인이 필요한 작업은 아래 **에이전트 참고 지식 맵**을 먼저 확인하세요.

## 에이전트 참고 지식 맵

Hermes, Codex, Claude Code 및 기타 코딩 에이전트는 프로젝트 맥락이 필요할 때 아래 순서로 참고하세요. 모델 제공자가 GPT, Claude, Ollama-Cloud 기반 오픈소스 모델 중 무엇이든 프로젝트 지식의 source of truth는 저장소 문서입니다.

1. **우선 규칙**: `AGENTS.md`
   - 이 파일이 현재 프로젝트의 코딩 규칙, 보안 규칙, 검증 기준, Git 작업 규칙의 source of truth입니다.
2. **Canonical 장기 지식**: `docs/agent-knowledge/`
   - 새로 발견한 컨벤션, 아키텍처 결정, 반복 워크플로, Hermes/Ollama-Cloud/OMX 운영 지식은 기본적으로 이 디렉터리에 저장하세요.
   - `.claude/`, `.omc/`, `.omx/`에 흩어진 기존 지식 중 앞으로도 유효한 내용은 이 디렉터리에 요약해 승격하세요.
3. **Legacy 참고 자료**: `.claude/projects/`, `.claude/commands/`, `.omc/project-memory.json`, `.omc/plans/`, `.omc/specs/`
   - Claude Code / OMC에서 넘어온 과거 기획, deep interview, 프로젝트 메모, 콘텐츠 리뷰 커맨드 등은 읽기 전용 historical context로 활용하세요.
   - 새 장기 지식은 여기에 추가하지 말고 `docs/agent-knowledge/`에 추가하세요.
4. **OMX 런타임 및 임시 작업 지식**: `.omx/wiki/`, `.omx/project-memory.json`, `.omx/plans/`, `.omx/notepad.md`
   - 존재하는 경우 최신 작업 맥락, 계획, 위키, 노트를 참고할 수 있습니다.
   - 단, `.omx/`는 canonical 장기 지식 저장소가 아니라 런타임/스크래치 공간으로 취급하세요.
5. **수정 금지 기본값**
   - `.omc/`와 `.omx/`의 상태, 세션, 로그, 캐시 파일은 사용자가 명시적으로 요청하지 않는 한 수정하지 마세요.
   - 필요한 지식이 여러 곳에 흩어져 있으면, 임의로 상태 파일을 옮기거나 삭제하지 말고 `docs/agent-knowledge/`에 요약하세요.

## 코딩 규칙

- TypeScript를 엄격하게 사용하세요.
- 새 API route는 입력 검증, 에러 처리, 인증/권한 확인을 포함하세요.
- Supabase 쿼리는 RLS 정책을 고려해서 작성하세요.
- 사용자 입력 HTML/Markdown은 렌더링 전 sanitize 처리를 유지하세요.
- 클라이언트 컴포넌트와 서버 컴포넌트 경계를 명확히 하세요.
- 브라우저 API, localStorage, window, document 사용이 필요하면 Client Component에서만 사용하세요.
- 기존 UI 스타일과 Tailwind 유틸리티 패턴을 따르세요.
- 다국어 사용자 노출 문구는 가능하면 next-intl 메시지 구조를 따르세요.
- 새 타입은 기존 `src/types/` 구조와 가까운 위치에 두세요.
- 중복 로직은 `src/lib/` 또는 커스텀 hook으로 분리하세요.

## 보안 및 데이터 주의사항

- `.env.local` 및 실제 secret 값을 읽거나 출력하거나 커밋하지 마세요.
- `.env*` 파일은 gitignore 대상입니다. 예시가 필요하면 실제 값 없는 `.env.example`만 작성하세요.
- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, 결제 관련 secret은 서버 전용으로만 사용하세요.
- 클라이언트에 노출 가능한 값은 `NEXT_PUBLIC_` 접두사가 있는 값으로 제한하세요.
- 파일 업로드, HTML 렌더링, EPUB/PDF 생성 경로에서는 XSS와 악성 파일 입력을 고려하세요.
- DB schema 변경 시 migration 파일을 추가하고, 기존 migration을 수정하는 방식은 피하세요.

## Supabase 지침

- DB 변경은 `supabase/migrations/`에 새 migration으로 추가하세요.
- 기존 migration은 이미 적용되었을 수 있으므로 가급적 수정하지 마세요.
- 새 테이블에는 RLS 활성화와 필요한 policy를 포함하세요.
- 사용자별 데이터는 `auth.uid()` 기준 접근 제어를 명확히 하세요.
- Storage path 설계 시 사용자 ID/책 ID/챕터 ID 등 충돌 방지 키를 사용하세요.
- Edge Function 변경 시 환경변수와 호출 권한을 함께 점검하세요.

## 콘텐츠 문서 작업 지침

- `content/`의 전자책 원고는 독자 친화적인 한국어 구어체를 유지하세요.
- 기존 문체인 `~이에요`, `~해요` 톤을 우선 유지하세요.
- Claude Code, Hermes, npm, Next.js 등 도구 설명은 가능하면 최신 명령어와 대조하세요.
- 챕터 간 참조, 파일명, 커맨드 이름, 예시 경로가 실제 파일과 일치하는지 확인하세요.
- 콘텐츠 리뷰 작업은 `.claude/commands/review-content.md`의 관점을 참고할 수 있습니다.

## 검증 기준

코드 변경 후 가능한 범위에서 아래를 실행하세요.

```bash
npm run lint
npm run build
```

Typecheck을 함께 실행하세요.

```bash
npm run typecheck
```

검증을 실행하지 못했다면, 최종 응답에 그 이유와 사용자가 직접 실행할 명령어를 명시하세요.

## Git 및 변경 관리

- 사용자가 요청하지 않는 한 commit, push, merge, rebase를 수행하지 마세요.
- 사용자가 만든 변경사항을 되돌리지 마세요.
- 생성/수정/삭제한 파일을 최종 응답에 요약하세요.
- 대규모 리팩터링보다 요청 범위에 맞춘 작고 검증 가능한 변경을 선호하세요.

## Hermes 사용 팁

- 프로젝트 작업 시작 시 `AGENTS.md`를 우선 확인하세요.
- 복잡한 작업은 todo로 나눠 진행하세요.
- 구현 전 필요한 파일을 먼저 읽고, 추측으로 코드를 작성하지 마세요.
- 반복 가능한 절차나 프로젝트 특화 워크플로가 생기면 skill로 저장할지 사용자에게 제안하세요.
- 코드 변경 전후로 `git status --short`를 확인해 의도치 않은 변경을 줄이세요.
