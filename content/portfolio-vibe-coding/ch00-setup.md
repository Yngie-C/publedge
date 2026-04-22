# 준비: 터미널 공포 풀기 + 도구 설치

이 책을 시작하기 전에 딱 하나만 확인할게요. "나 이런 거 만들 수 있겠구나!" 하는 감이 오면, 설치하면서 생기는 작은 번거로움쯤은 아무것도 아니게 되거든요.

## 이 책에서 만들 것

이 책을 끝까지 따라오면 챕터마다 내 포트폴리오가 눈에 보이게 진화해요.

```
빈 폴더 → 명함 1페이지 → 명함+카드 3장 → 다른 톤 → 반응형+다크모드 → 공개 URL
```

<!-- IMAGE: diagram-chapter-progression.png
Ch0~Ch5 포트폴리오 진화 매트릭스. 6단계 수평 플로우차트. 각 단계에 챕터 번호와 종료 시점 결과물 표시.
-->

이 책을 끝내면 구체적으로 이런 걸 갖게 돼요.

1. **나만의 명함 페이지** — 이름, 한 줄 소개, 사진이 담긴 깔끔한 프로필 페이지.
2. **프로젝트 카드 그리드** — 내가 만든 것들을 카드 형태로 나란히 보여주는 섹션.
3. **공개 URL + GitHub 레포** — `https://내이름.vercel.app` 주소로 누구나 볼 수 있는 실제 사이트.

자, 이제 첫 번째 관문인 설치를 함께 해봐요.

---

## 터미널 열기

"터미널이 뭐예요?" 라고 물어보셔도 전혀 이상하지 않아요. 터미널은 **컴퓨터에게 글로 명령하는 창**이에요. 마우스 클릭 대신 텍스트로 지시하는 것뿐이에요.

> **TIP:** 터미널이 처음엔 무섭게 느껴질 수 있어요. 그래도 괜찮아요. 이 책에서 실제로 쓸 명령어는 손가락으로 꼽을 만큼 적어요. 낯설어도 하나씩 따라오면 금방 익숙해져요.

### macOS

키보드에서 `Cmd(⌘) + Space`를 눌러 Spotlight 검색창을 열고, "터미널"이라고 입력한 뒤 엔터를 눌러요. 까만 창이 뜨면 성공이에요.

<!-- IMAGE: screenshot-ch00-terminal-open.png
macOS Spotlight 검색창에서 "터미널"을 검색하는 화면. 터미널 앱이 결과에 나타난 상태.
-->

### Windows

키보드에서 `Win` 키를 누르고 "Windows Terminal" 또는 "명령 프롬프트"를 검색해서 열어요. Windows 11이라면 기본으로 Windows Terminal이 설치되어 있을 거예요.

> **TIP:** Windows 사용자라면 "명령 프롬프트"보다 "Windows Terminal"을 추천해요. 글자가 더 예쁘고 기능도 많거든요. Microsoft Store에서 무료로 설치할 수 있어요.

---

## Node.js 설치하기

Claude Code는 **Node.js** 위에서 돌아가요. JavaScript를 컴퓨터에서 실행할 수 있게 해주는 엔진 같은 거예요. Claude Code를 쓰기 위해 JavaScript를 알 필요는 전혀 없어요. 그냥 엔진을 설치한다고 생각하면 돼요.

1. 브라우저에서 [nodejs.org](https://nodejs.org)에 접속해요.
2. 초록색 **LTS** 버튼을 클릭해서 설치 파일을 다운로드해요.
3. 다운로드된 파일을 실행하고 기본 옵션 그대로 "다음(Next)"을 눌러 설치를 완료해요.

터미널을 새로 열고 버전을 확인해봐요.

```bash
node --version
```

```bash
npm --version
```

아래처럼 버전 숫자가 나오면 정상이에요.

```
v20.11.0
10.2.4
```

<!-- IMAGE: screenshot-ch00-node-version.png
터미널에서 `node --version` 실행 결과. `v20.x.x` 버전 번호가 출력된 상태.
-->

> **WARNING:** Node.js는 **버전 18 이상**이 필요해요. 만약 `v16.x.x` 같이 낮은 버전이 나온다면, nodejs.org에서 최신 LTS를 다시 설치해주세요.

---

## Claude Code 설치하기

Node.js가 준비됐으면 Claude Code 설치는 명령어 한 줄로 끝나요.

```bash
npm install -g @anthropic-ai/claude-code
```

`-g`는 "이 컴퓨터 전체에 설치해줘"라는 뜻이에요. 어디서든 `claude` 명령어를 쓸 수 있게 돼요.

```bash
claude --version
```

버전 번호가 출력되면 성공이에요.

> **NOTE:** macOS에서 `EACCES: permission denied` 오류가 나타나면 앞에 `sudo`를 붙여서 실행해요.
>
> ```bash
> sudo npm install -g @anthropic-ai/claude-code
> ```
>
> 비밀번호를 입력하라고 하면 Mac 로그인 비밀번호를 입력해요. (입력해도 화면에 아무것도 안 보이는 게 정상이에요.)

> **NOTE:** Windows에서 권한 오류가 나면, Windows Terminal을 **관리자 권한으로 실행**해보세요. 검색창에서 "Windows Terminal" → 마우스 오른쪽 버튼 → "관리자 권한으로 실행"을 선택하면 돼요.

---

## Claude 계정 로그인하기

Claude Code는 Claude의 두뇌를 빌려서 동작해요. Claude 계정이 필요해요.

Claude Code를 사용하려면 **Claude Pro 또는 Max 플랜** 구독이 필요해요.

- **Claude Pro**: 월 $20 — 개인 포트폴리오를 만들기에 충분해요.
- **Claude Max**: 월 $100 — 하루 종일 집중적으로 쓸 때 적합해요.

아직 계정이 없다면 [claude.ai](https://claude.ai)에서 가입하고 Pro 플랜을 구독해요.

> **WARNING:** 구독료는 매월 자동으로 결제돼요. 포트폴리오 작업이 마무리됐다면 구독 해지를 잊지 마세요. claude.ai → 설정 → 구독 관리에서 언제든지 해지할 수 있어요.

`claude` 명령을 처음 실행하면 자동으로 브라우저가 열려 로그인 페이지로 이동해요. 계정 정보로 로그인하면 터미널에 아래 메시지가 나타나요.

```
인증 완료! Claude Code를 사용할 준비가 됐습니다.
```

만약 브라우저가 자동으로 열리지 않으면 터미널에서 아래 명령을 실행해요.

```bash
claude auth login
```

> **NOTE:** Pro 또는 Max 구독이 있으면 별도로 API 키를 입력할 필요가 없어요. `claude auth login`으로 계정 인증만 하면 바로 사용할 수 있어요.

---

## GitHub 계정 준비하기

포트폴리오를 인터넷에 공개하려면 **GitHub**이 필요해요. 내 포트폴리오 파일을 올려두는 창고로 쓸 거예요.

1. [github.com](https://github.com)에 접속해요.
2. 오른쪽 위 **Sign up** 버튼을 클릭해요.
3. 사용자명(username), 이메일 주소, 비밀번호를 입력해요.
4. 이메일로 인증 링크가 와요. 클릭하면 가입 완료예요.

> **TIP:** 사용자명은 나중에 공개 URL에도 노출돼요. 깔끔하고 기억하기 쉬운 영문 이름으로 정하는 걸 추천해요.

<!-- IMAGE: screenshot-ch00-github-signup.png
GitHub 가입 폼 화면. 사용자명·이메일·비밀번호 입력 필드가 보이는 상태.
-->

---

## Vercel 계정 준비하기

**Vercel**은 내 포트폴리오를 실제 인터넷에 올려주는 서비스예요. GitHub에 올린 파일을 가져다가 `https://내이름.vercel.app` 주소로 배포해줘요.

1. [vercel.com](https://vercel.com)에 접속해요.
2. **Sign Up** 버튼을 클릭해요.
3. **"Continue with GitHub"** 버튼을 선택해요. GitHub 계정으로 연동하면 나중에 포트폴리오를 가져올 때 훨씬 편리해요.
4. Hobby 플랜(무료)을 그대로 선택하면 돼요.

> **NOTE:** Vercel은 신용카드 없이 가입할 수 있어요. Hobby 플랜은 완전 무료고, 이 책의 포트폴리오 배포에는 충분해요.

<!-- IMAGE: screenshot-ch00-vercel-signup.png
Vercel 가입 화면. "Continue with GitHub" 버튼이 강조된 상태.
-->

---

## 프로젝트 폴더 만들기

이제 포트폴리오가 살 집을 만들어줄 거예요. 폴더를 만들고, 그 안으로 들어가서 Claude Code를 실행하는 게 이번 단계예요.

```bash
mkdir my-portfolio
```

```bash
cd my-portfolio
```

터미널 프롬프트에 `my-portfolio`라는 이름이 보이면 제대로 들어간 거예요.

```bash
claude
```

잠시 기다리면 Claude Code가 실행되면서 대화창이 나타나요. 아래처럼 입력해요.

```
안녕하세요
```

Claude가 인사를 돌려주면 완벽해요! 설치가 전부 잘 된 거예요.

> **TIP:** Claude Code 대화창을 종료하려면 `/exit`를 입력하거나 `Ctrl + C`를 누르면 돼요.

---

## 여기까지 왔다면

축하해요! 솔직히 말하면, 이 챕터가 이 책에서 가장 까다로운 부분이에요. 처음 환경을 갖추는 일이라 손이 많이 가거든요. 그걸 해냈으니 이제 진짜 재밌는 부분만 남은 거예요.

다음 챕터에서는 **빈 폴더에서 대화 한 번으로 명함 페이지**를 만들어볼 거예요. 설치에 시간이 걸렸던 것과 달리, 결과가 나오는 속도는 깜짝 놀랄 만큼 빠를 거예요.

혹시 설치 도중 여기서 다루지 않은 오류가 났다면, 책 맨 뒤 **부록 A(트러블슈팅 가이드)**를 참고해요.

---

## 현재 프로젝트 상태

이 챕터를 마친 후 내 폴더 구조는 이렇게 생겼어요.

```
my-portfolio/
  (빈 폴더 — Claude Code 실행만 확인)
```

아직 파일이 아무것도 없는 게 맞아요. 다음 챕터부터 하나씩 채워나갈 거예요.

---

## 이번 챕터 체크리스트

아래 항목을 모두 확인했다면, 다음 챕터로 넘어갈 준비가 된 거예요!

- [ ] Node.js 설치 확인 (`node --version`으로 버전 번호 출력)
- [ ] Claude Code 설치 확인 (`claude --version`으로 버전 번호 출력)
- [ ] Claude 계정 로그인 완료 (`claude` 실행 또는 `claude auth login`)
- [ ] GitHub 계정 생성 완료
- [ ] Vercel 계정 생성 완료 (GitHub 연동 권장)
- [ ] 프로젝트 폴더 생성 (`my-portfolio`)
- [ ] Claude Code 실행 후 대화 테스트 ("안녕하세요" 입력 후 응답 확인)
