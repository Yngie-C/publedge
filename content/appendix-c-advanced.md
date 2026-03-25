# 부록 C: 더 알아보기

이 부록에서는 Claude Code의 고급 기능을 간략히 소개해요. 기본 파이프라인(Ch 0~6)만으로도 충분하지만, 더 깊이 활용하고 싶다면 참고하세요.

> **NOTE:** 여기서 소개하는 기능들은 "있으면 좋은 것"이지, 자소서 파이프라인에 꼭 필요한 건 아니에요. 가볍게 읽고 흥미가 생기면 공식 문서에서 더 파고드는 걸 권장해요.

---

## Hooks: 자동화의 다음 단계

### Hooks가 뭔가요?

Claude Code가 특정 작업을 수행할 때 자동으로 실행되는 스크립트예요. 쉽게 말하면 "Claude가 일할 때 옆에서 조용히 감시하고 보조해주는 비서" 같은 존재예요.

예를 들어 Claude가 파일을 저장할 때마다 자동으로 백업 폴더에 복사하거나, 작업이 끝날 때마다 로그를 남기는 식으로 활용할 수 있어요.

### 어떤 종류가 있나요?

Hook에는 크게 두 가지 타이밍이 있어요.

- **PreToolUse**: Claude가 도구를 사용하기 **전**에 실행돼요
- **PostToolUse**: Claude가 도구를 사용한 **후**에 실행돼요

설정은 `.claude/settings.json`에 추가하는 방식이에요.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "echo '파일이 저장됐어요!' >> ~/claude-log.txt"
          }
        ]
      }
    ]
  }
}
```

### 자소서 파이프라인에서 활용 아이디어

- 자소서 파일이 저장될 때마다 자동으로 글자 수를 체크해서 로그 남기기
- JD 폴더에 새 파일이 추가되면 자동으로 분석 커맨드 실행
- 작업 완료 후 자동으로 Git 커밋 메시지 생성

> **TIP:** Hooks는 반복적인 수작업을 없애주는 데 특히 유용해요. 다만 설정이 잘못되면 예상치 못한 동작을 할 수 있으니, 처음엔 간단한 것부터 시작해보세요.

### 더 알아보기

Claude Code 공식 문서의 **Hooks** 섹션을 참고하세요. 매처(matcher) 조건과 실행 가능한 커맨드 유형이 자세히 설명되어 있어요.

---

## MCP: 외부 도구 연결

### MCP가 뭔가요?

MCP는 **Model Context Protocol**의 약자예요. Claude Code를 노션, 슬랙, Google Sheets 같은 외부 서비스와 연결할 수 있게 해주는 프로토콜이에요.

비유하자면 "Claude Code에 새로운 기능 플러그인을 꽂는 것"이에요. 기본 Claude Code가 파일 시스템과 터미널을 다룰 수 있다면, MCP를 통해 외부 서비스에도 접근할 수 있게 돼요.

### 자소서 파이프라인에서 활용 아이디어

MCP가 연결되면 자소서 작업 흐름을 훨씬 넓게 확장할 수 있어요.

- **노션 MCP**: 완성된 자소서를 노션 데이터베이스에 자동으로 저장하고 정리
- **Google Sheets MCP**: JD 분석 결과를 스프레드시트로 시각화
- **Slack MCP**: 자소서 생성이 완료되면 채널에 알림 전송

### 설정 방법 (간략)

MCP 서버 설정은 `.claude/settings.json`에 추가해요.

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "NOTION_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

> **NOTE:** MCP 설정은 이 책의 범위를 넘어요. 각 MCP 서버마다 설치 방법과 인증 방식이 달라서, 관심 있는 서버의 공식 문서를 따로 확인하는 게 좋아요. Anthropic의 MCP 공식 문서(`modelcontextprotocol.io`)에 다양한 서버 목록이 정리되어 있어요.

---

## Cron: 주기적 실행

### Cron이 뭔가요?

Cron은 "매일 아침 9시에 이 작업을 실행해줘"처럼 컴퓨터에 작업을 예약하는 기능이에요. macOS와 Linux에 기본으로 내장되어 있어요.

Claude Code에는 `-p`(print mode) 옵션이 있어서, 대화 없이 한 번에 결과를 출력하고 종료하는 **비대화형 실행**이 가능해요. 이 모드와 Cron을 조합하면 자동화 파이프라인을 만들 수 있어요.

### 자소서 파이프라인에서 활용 아이디어

- 매일 아침 `jd/` 폴더에 새 파일이 있는지 체크
- 매주 월요일에 쌓인 JD들을 일괄 분석해서 요약본 생성
- 정해진 시간마다 자소서 진행 현황을 리포트로 출력

### 간단한 Cron 사용법

macOS/Linux에서는 터미널에서 `crontab -e`를 입력해 편집해요.

```bash
# Cron 형식: 분 시 일 월 요일 명령어
# 매일 오전 9시에 실행하는 예시
0 9 * * * /usr/local/bin/claude -p "jd 폴더 확인하고 새 파일 분석해줘" >> ~/cron-log.txt 2>&1
```

```bash
# 매주 월요일 오전 8시에 실행
0 8 * * 1 /usr/local/bin/claude -p "이번 주 자소서 현황 요약해줘"
```

Windows 사용자는 **작업 스케줄러(Task Scheduler)**를 이용하면 돼요. 검색창에 "작업 스케줄러"를 입력하면 GUI로 설정할 수 있어요.

> **NOTE:** Cron으로 Claude Code를 실행하려면 인증 토큰이 유효한 상태여야 해요. 토큰이 만료됐다면 `claude auth login`으로 재인증이 필요해요. 완전 자동화를 원한다면 API 키 방식(`ANTHROPIC_API_KEY` 환경 변수)을 사용하는 게 더 안정적이에요.

---

## Claude Code 버전 호환성

### 이 책의 기준 버전

이 책은 **Claude Code v1.x (2026년 3월)** 기준으로 작성됐어요. Claude Code는 빠르게 발전하고 있어서, 일부 명령어나 화면 구성이 달라져 있을 수 있어요.

### 변하지 않는 것들

핵심 개념과 철학은 버전이 올라가도 크게 바뀌지 않아요.

- `CLAUDE.md`로 프로젝트 컨텍스트를 제공하는 방식
- `.claude/commands/`로 커스텀 커맨드를 만드는 방식
- 자연어로 Claude에게 요청하는 방식
- 프롬프트 엔지니어링의 핵심 원리 (역할 지정, 구조화된 출력, 검증 단계)

이 책의 핵심 내용은 위 개념들을 중심으로 구성되어 있으니, 버전 차이에 크게 영향받지 않을 거예요.

### 변할 수 있는 것들

- 인증 방식 (현재: `claude auth login` OAuth 방식)
- 설치 명령어 및 패키지명
- 세부적인 UI/UX 및 출력 형식
- 일부 옵션 플래그 이름

### 최신 정보 확인

버전 차이가 있다면 아래에서 최신 정보를 확인하세요.

- Claude Code 공식 문서: `docs.anthropic.com`
- Claude Code GitHub: `github.com/anthropics/claude-code`
- Anthropic 블로그: `anthropic.com/blog`

---

## 더 배우고 싶다면

자소서 파이프라인을 넘어 Claude Code를 더 깊이 활용하고 싶다면 아래 자료들을 추천해요.

| 자료 | 주소 |
|------|------|
| Anthropic 공식 문서 | `docs.anthropic.com` |
| Claude Code GitHub | `github.com/anthropics/claude-code` |
| 프롬프트 엔지니어링 가이드 | `docs.anthropic.com/en/docs/build-with-claude/prompt-engineering` |
| MCP 공식 문서 | `modelcontextprotocol.io` |

> **TIP:** 가장 좋은 학습법은 직접 써보는 거예요. 이 책의 자소서 파이프라인을 자신의 상황에 맞게 수정해보세요. 커맨드 이름을 바꿔보거나, 출력 형식을 원하는 대로 조정하거나, 새로운 단계를 추가해보는 과정에서 Claude Code에 대한 이해가 자연스럽게 깊어질 거예요.

---

*부록 C 끝. 자소서 파이프라인 구축을 완성한 여러분을 응원해요!*
