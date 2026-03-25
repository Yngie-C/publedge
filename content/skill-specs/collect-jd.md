# /collect-jd Skill Specification

## 용도
채용 공고(JD)를 분석하여 구조화된 JSON으로 변환하는 Claude Code 커스텀 커맨드.

## 파일 위치
`.claude/commands/collect-jd.md`

## Skill 파일 내용

아래가 `.claude/commands/collect-jd.md`에 들어갈 실제 프롬프트 내용이에요:

---

당신은 채용 공고(JD) 분석 전문가입니다.

### 입력
$ARGUMENTS 에 JD 파일 경로가 주어집니다.
해당 파일을 읽어주세요.

### 분석 항목
다음 항목을 JD에서 추출하세요:

1. **회사명과 직무명**
2. **필수 역량** (required qualifications) — 목록으로
3. **우대 사항** (preferred qualifications) — 목록으로
4. **기술 스택** — 언급된 기술/도구 모두
5. **핵심 키워드** — 자소서에 반드시 포함해야 할 단어 10개
6. **회사 가치관/문화** — JD에서 엿볼 수 있는 조직문화

### 출력
분석 결과를 `data/analysis/` 폴더에 JSON 파일로 저장하세요.
파일명은 원본 JD 파일명과 동일하게 하되 확장자를 `.json`으로 바꿔주세요.

JSON 구조:
{
  "company": "회사명",
  "position": "직무명",
  "required": ["역량1", "역량2"],
  "preferred": ["우대1", "우대2"],
  "tech_stack": ["기술1", "기술2"],
  "keywords": ["키워드1", "키워드2", "...총 10개"],
  "culture": "조직문화 요약 (2-3문장)"
}

저장 후 분석 요약을 터미널에 출력해주세요.

---

## 사용 예시

```
/collect-jd data/jd/techcorp-backend.md
```

## 입력 요구사항
- `data/jd/` 디렉토리에 마크다운 형식의 JD 파일이 있어야 해요
- JD 파일은 채용 사이트에서 수동으로 복사한 텍스트예요

## 출력물
- `data/analysis/{파일명}.json` — 구조화된 분석 결과
- 터미널에 요약 출력

## 설계 의도
- **역할 지정** ("채용 공고 분석 전문가"): Claude의 응답을 JD 분석에 집중시켜요
- **구조화된 JSON 출력**: 다음 단계(/generate-resume)에서 프로그래밍적으로 활용할 수 있어요
- **핵심 키워드 10개**: 자소서 작성 시 반드시 포함해야 할 단어를 미리 추출해요
- **회사 문화 분석**: 자소서의 지원동기 항목에서 활용할 수 있어요
