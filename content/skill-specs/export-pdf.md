# /export-pdf Skill Specification

## 용도
검토 완료된 자소서를 PDF 파일로 변환하는 Claude Code 커스텀 커맨드.

## 파일 위치
`.claude/commands/export-pdf.md`

## Skill 파일 내용

아래가 `.claude/commands/export-pdf.md`에 들어갈 실제 프롬프트 내용이에요:

---

$ARGUMENTS 에 자소서 markdown 파일 경로가 주어집니다.

### 작업
1. `output/pdf/` 폴더가 없으면 생성하세요.
2. 해당 파일을 `md-to-pdf` 명령어로 PDF로 변환하세요:

```bash
md-to-pdf {파일경로} --dest output/pdf/
```

3. `md-to-pdf`가 설치되어 있지 않다면 사용자에게 안내하세요:
   "md-to-pdf가 설치되어 있지 않아요. `npm install -g md-to-pdf`로 설치해주세요."

4. 변환이 완료되면 PDF 파일 경로를 알려주세요.

### 대안
md-to-pdf가 작동하지 않는 경우, 브라우저에서 직접 PDF로 저장하는 방법을 안내하세요:
- 마크다운 파일을 열고 내용을 복사
- 브라우저에서 Ctrl+P (macOS: Cmd+P) → "PDF로 저장" 선택

---

## 사용 예시

```
/export-pdf output/resume-techcorp-backend.md
```

## 입력 요구사항
- `/generate-resume` 또는 `/review-resume` 이후 수정된 자소서 마크다운 파일
- `md-to-pdf` npm 패키지 설치 (`npm install -g md-to-pdf`)

## 출력물
- `output/pdf/{파일명}.pdf` — 최종 PDF 파일

## 설계 의도
- **md-to-pdf 선택 이유**: npm으로 한 줄 설치 (Claude Code 설치와 동일한 방법). Pandoc+LaTeX는 수 GB 설치가 필요하고 초보자에게 너무 무거워요
- **브라우저 폴백**: md-to-pdf 설치가 안 될 때도 PDF를 만들 수 있는 무설치 대안
- **Claude의 명령어 실행**: 이 스킬은 Claude에게 터미널 명령어(`md-to-pdf`)를 실행하도록 요청해요. Claude Code는 사용자 승인 하에 터미널 명령어를 실행할 수 있어요

## 주의사항
- md-to-pdf는 첫 실행 시 Chromium을 자동 다운로드해요 (~300MB)
- 한글 폰트가 시스템에 설치되어 있어야 한글이 정상 출력돼요
- `--dest` 플래그의 정확한 문법은 md-to-pdf 버전에 따라 다를 수 있어요. 실행 시 Claude가 자동으로 확인해줘요
