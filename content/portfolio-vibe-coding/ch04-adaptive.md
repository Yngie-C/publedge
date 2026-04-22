# 환경에 적응하기: 모바일 반응형 + 다크모드

Ch3에서 포트폴리오 톤이 내 취향대로 바뀌었어요. 이번 챕터에서는 이 포트폴리오가 **환경**에 맞춰 스스로 변하도록 만들어볼게요. 화면이 좁으면 모바일 레이아웃으로, 눈이 피곤한 시간엔 다크모드로.

---

## 이번 챕터의 목표

- 모바일(작은 화면)에서도 카드와 레이아웃이 예쁘게 보이도록
- 오른쪽 위에 다크모드 토글 버튼 하나 추가하기
- 토글 상태를 새로고침 후에도 기억하게 만들기

---

## '적응'이라는 단어

반응형 레이아웃과 다크모드는 언뜻 별개 기능처럼 보여요. 하나는 화면 너비에 반응하고, 다른 하나는 색상 체계를 바꾸니까요. 그런데 둘 다 같은 질문에서 출발해요. "지금 이 사람이 어떤 환경에서 내 포트폴리오를 보고 있을까?"

좁은 화면이면 카드를 세로로 쌓아줘야 읽기 편하고, 밤늦게 보는 사람에겐 어두운 배경이 눈에 덜 피곤해요. 사용자가 요청하지 않아도 알아서 맞춰주는 것, 그게 이 챕터 전체를 관통하는 단 하나의 철학이에요.

포트폴리오를 보는 상황을 상상해봐요. 면접관이 지하철에서 핸드폰으로 열어볼 수도 있고, 카페에서 노트북 배터리를 아끼려고 어두운 화면 설정으로 볼 수도 있어요. 이 두 상황 모두에서 자연스럽게 적응하는 포트폴리오, 그게 이번 챕터에서 만들 거예요.

기술적으로는 완전히 다른 두 방법을 사용하지만, 독자 입장에서는 그냥 "잘 되는" 경험이에요. 반응형은 CSS의 media query가 화면 너비를 감지해서 레이아웃 규칙을 교체하고, 다크모드는 JavaScript가 사용자 선택을 기억해서 CSS 변수 집합을 통째로 바꿔요. 두 기능 모두 Claude가 코드를 써주고, 여러분은 프롬프트만 잘 전달하면 돼요.

잘 된 포트폴리오는 "기능이 많다"는 게 느껴지지 않아요. 그냥 어디서 봐도 편해요. 이 챕터가 끝나면 그 느낌을 직접 확인하게 될 거예요.

한 가지 더 짚고 넘어갈게요. 이 챕터에서 다루는 두 기능은 사실 많은 실제 웹사이트에서 "당연하게" 갖춰야 할 기본 요소로 여겨져요. 반응형이 안 되는 사이트는 2024년 기준으로 이미 구식처럼 보여요. 다크모드 지원은 "이 사람이 사용자 경험을 신경 쓴다"는 신호예요. 포트폴리오 하나에서 이 두 가지를 모두 갖추는 건 생각보다 큰 차별점이 돼요.

이번 챕터의 두 대화를 돌아보면, 첫 번째는 "화면이 좁을 때 레이아웃"이라는 공간 문제를 다뤘고, 두 번째는 "사용자의 선택을 기억"이라는 상태 문제를 다뤘어요. 공간은 CSS가, 상태는 JavaScript가 담당해요. 이 두 역할 분담은 웹 개발 전반에서 반복되는 패턴이에요. 지금 당장 깊이 이해하지 않아도 괜찮아요. 앞으로 Claude에게 요청할 때 "어떤 문제인지"를 구분하는 감각이 자연스럽게 생겨요.

---

## 지금 내 포트폴리오를 핸드폰에서 보면

코드를 고치기 전에, 지금 상태를 먼저 눈으로 확인해봐요. 실제 핸드폰이 없어도 돼요. 브라우저 개발자 도구에 모바일 시뮬레이터가 내장되어 있거든요.

`index.html`을 크롬에서 열고 **`Cmd + Shift + M`** (맥) 또는 **`Ctrl + Shift + M`** (윈도우)을 누르면 모바일 뷰로 전환돼요. 상단 드롭다운에서 iPhone, Pixel 같은 기기를 선택하거나 직접 너비를 입력해서 바꿀 수 있어요.

<!-- IMAGE: screenshot-ch04-mobile-before.png | Ch3 완성본을 모바일 너비(375px)로 시뮬레이션한 화면. 카드 3장이 가로로 너무 좁게 쪼그라들어 텍스트가 겹쳐 보이는 상태. -->

> **TIP:** 크롬이면 `Cmd/Ctrl + Shift + M`, 사파리는 개발자 메뉴에서 '반응형 디자인 모드'로 들어가요. 실제 핸드폰 없이도 확인돼요.

화면이 좁아지면 Ch3에서 만든 3열 그리드가 그대로 쪼그라들어요. 카드 너비가 100px 정도로 줄어들면서 텍스트가 겹치거나 잘려요. 명함 카드도 사진과 이름이 너무 좁게 붙어서 읽기 불편해요.

이게 반응형 CSS를 추가하지 않은 페이지의 자연스러운 결과예요. 바꿔 말하면, 우리가 Ch3에서 만든 레이아웃은 "데스크톱 전용"이었던 거예요. 이제 이걸 고쳐볼게요.

여기서 중요한 건 "지금 깨져 보인다"는 사실 자체가 나쁜 게 아니라는 거예요. 아직 모바일을 고려하지 않은 것뿐이고, 고치는 건 Claude에게 한 문장 요청하면 돼요. 문제를 발견하고 말로 설명할 수 있으면, 코드를 몰라도 고칠 수 있어요.

개발자 도구 모바일 뷰는 이번 챕터 이후로도 계속 쓰게 될 도구예요. 새로운 섹션을 추가했을 때, 폰트 크기를 바꿨을 때, 이미지를 추가했을 때마다 모바일 뷰로 확인하는 습관을 들이면 나중에 "핸드폰에서 보니까 이상해요"라는 문제가 훨씬 줄어요. 문제를 배포 전에 발견하는 게 배포 후에 발견하는 것보다 항상 나아요.

크롬 개발자 도구에서 너비를 직접 숫자로 입력하는 것 외에도, 상단 드롭다운에서 "iPhone SE", "Galaxy S20" 같은 실제 기기 프리셋을 선택할 수도 있어요. 기기마다 화면 비율과 픽셀 밀도가 달라서 실제 핸드폰에서 보는 것과 조금 차이가 날 수 있지만, 레이아웃이 무너지는지 여부를 확인하기엔 충분해요. 완전히 정확한 테스트가 필요하다면 실제 기기에서 로컬 서버를 열어 확인할 수 있지만, 지금 단계에서는 브라우저 시뮬레이터로 충분해요.

---

## 첫 번째 대화 — 모바일 반응형

아래 프롬프트를 그대로 Claude에게 전달해봐요. 문제를 구체적으로 설명할수록 결과가 정확해요. "핸드폰에서 이상해요"보다 "너비 400px에서 카드 3장이 좁게 붙어 있어요"처럼 눈에 보이는 증상을 그대로 말하면 돼요.

```markdown
지금 포트폴리오를 핸드폰(너비 400px 정도)에서 보면 카드 3장이 너무 좁게 붙어 있어요.
화면 너비가 768px보다 작으면 카드를 세로로 1장씩 쌓이게 바꿔 주세요.
명함 카드도 사진-텍스트가 가로가 아니라 세로로 쌓이게 해주세요.
여백도 모바일에서는 조금 줄여주세요. media query로요.
```

Claude는 기존 `<style>` 블록 맨 아래에 `@media (max-width: 768px) { ... }` 블록을 추가해줘요. 기존 CSS는 전혀 건드리지 않아요. "768px보다 넓으면 원래 스타일, 768px 이하면 이 규칙 추가 적용"이라는 조건문이라고 생각하면 돼요.

추가되는 규칙은 딱 세 가지예요. `body`의 안쪽 여백을 줄여서 좁은 화면에서 공간을 아끼고, 명함 카드의 `flex-direction`을 `column`으로 바꿔서 사진과 이름이 위아래로 쌓이게 해요. 프로젝트 그리드는 `grid-template-columns: 1fr`로 바꿔서 한 줄에 카드 하나만 나오게 돼요. 세 줄의 변경으로 레이아웃이 완전히 달라져요.

media query가 신기한 이유는 기존 코드를 전혀 바꾸지 않는다는 점이에요. 데스크톱용 규칙은 그대로 살아있고, 그 위에 "작은 화면일 때는 이걸 덮어써"라는 규칙이 조건부로 얹히는 구조예요. 충돌 없이 두 버전이 공존해요.

다시 `Cmd + Shift + M`으로 모바일 뷰를 열어봐요. 카드가 세로로 차례차례 쌓이는 모습이 보일 거예요.

<!-- IMAGE: screenshot-ch04-mobile-after.png | 모바일 뷰(375px)에서 명함 카드가 사진·이름 세로 정렬로, 프로젝트 카드 3장이 1열로 쌓여 깔끔하게 보이는 상태. -->

> **NOTE:** `max-width: 768px`이 태블릿 경계로 흔히 쓰여요. 더 세밀하게 하려면 `max-width: 480px`(폰), `max-width: 1024px`(작은 랩탑) 추가 브레이크포인트도 가능해요.

모바일 뷰에서 너비를 300px까지 좁혀봐도, 900px로 넓혀봐도 레이아웃이 자연스럽게 전환되는 걸 확인해봐요. 브레이크포인트 기준인 768px 근처에서 레이아웃이 스르륵 바뀌는 순간이 꽤 기분 좋아요. 데스크톱과 모바일 모두에서 의도대로 보이는 걸 눈으로 확인하면, 만든 사람 입장에서 작은 뿌듯함이 생겨요.

혹시 결과가 마음에 안 들면 바로 이어서 요청해봐요. "모바일에서 명함 카드 사진을 좀 더 작게, 80px 정도로 해줘"처럼 세부 조정도 말로 전달하면 돼요. media query 블록 안에서 `.avatar` 크기를 추가로 덮어쓰면 되는 일이고, Claude가 자연스럽게 처리해줘요.

이 시점에서 한 가지 팁을 드리면, 모바일 뷰와 데스크톱 뷰를 번갈아 가며 확인하는 게 좋아요. 모바일에서 고쳤더니 데스크톱이 이상해지는 경우는 거의 없지만, 눈으로 직접 확인하는 습관이 나중에 더 복잡한 레이아웃을 다룰 때 도움이 돼요. 브라우저 창 너비를 직접 손으로 늘렸다 줄였다 하면서 레이아웃이 자연스럽게 전환되는지 확인하는 것도 좋은 방법이에요.

반응형 CSS의 동작 원리를 조금 더 풀어볼게요. 브라우저는 페이지를 그릴 때 CSS 파일 전체를 읽어요. `@media (max-width: 768px)` 블록을 만나면 "현재 창 너비가 768px 이하일 때만 이 안의 규칙을 적용해"라고 메모해둬요. 창 너비가 바뀔 때마다 이 조건을 다시 판단해서 규칙을 켜거나 꺼요. 그래서 창을 직접 늘렸다 줄이면서 보면 레이아웃이 실시간으로 전환되는 게 보여요.

이걸 이해하면 Claude에게 더 정확한 요청을 할 수 있어요. "768px 이하에서"가 아니라 "480px 이하의 작은 폰에서만 이 스타일 적용해줘"처럼 브레이크포인트를 세분화하는 요청도 자연스럽게 나와요. 지금은 하나의 브레이크포인트로 충분하지만, 나중에 더 다양한 화면 크기를 지원하고 싶을 때 이 개념이 기반이 돼요.

---

## 두 번째 대화 — 다크모드 토글

반응형이 완성됐으면 이번엔 다크모드를 붙여봐요. 이 챕터에서 처음으로 JavaScript가 등장해요. 겁먹지 않아도 돼요. 이해 없이도 작동하고, 나중에 더 알고 싶어지면 그때 파고들면 돼요.

다크모드가 왜 필요할까 싶을 수도 있어요. 하지만 생각해보면, 밤 11시에 침대에서 포트폴리오를 보는 사람한테 흰 배경은 꽤 눈부셔요. 다크모드 하나로 "이 사람은 UX를 신경 쓰는구나"라는 인상을 줄 수 있어요. 기능이 아니라 배려로 읽히거든요.

```markdown
오른쪽 위에 작은 '🌙 / ☀️' 토글 버튼을 하나 만들어 주세요.
누르면 페이지 전체가 다크모드로 전환돼요.
다크모드 색은: 배경 #1b1b1b, 카드 #262626, 텍스트 #f0ebe3, 포인트 #a8b878 정도로.
토글 상태는 새로고침 후에도 기억되게 localStorage에 저장해 주세요.
```

Claude가 추가하는 구조는 세 덩어리예요. 각각 무엇을 하는지 간단히 짚어볼게요.

**CSS 변수 오버라이드.** `[data-theme="dark"]` 셀렉터가 Ch3에서 만들어둔 `:root` 변수를 덮어써요. `<html>` 태그에 `data-theme="dark"`가 붙어 있을 때만 이 규칙이 활성화돼요. `--bg`, `--surface`, `--text` 같은 변수가 한꺼번에 교체되면서 페이지 전체 색이 바뀌어요. 기존 스타일을 전혀 건드리지 않아서 Ch3 디자인이 그대로 보존돼요.

Ch3에서 CSS 변수를 미리 만들어뒀기 때문에 이게 가능해요. 만약 색을 변수 없이 `.card { background: #fffdf8; }` 식으로 직접 써뒀다면, 다크모드로 바꾸려면 파일 곳곳에 흩어진 색 값을 전부 찾아서 바꿔야 해요. 변수 하나만 바꾸면 쓰이는 모든 곳이 한꺼번에 바뀌는 게 CSS 변수의 힘이에요. Ch3에서 미리 잘 만들어뒀으니, 지금 여기서 그 덕을 봐요.

**토글 버튼.** `position: fixed`로 화면에 고정된 둥근 버튼이에요. 스크롤을 아무리 내려도 항상 오른쪽 위에 떠 있어요. `var(--surface)`를 배경색으로 써서 라이트/다크 두 모드 모두에서 카드와 같은 계열 색으로 자동 적응해요. 버튼 스타일이 CSS 변수를 그대로 활용하기 때문에 다크모드가 켜지면 버튼 색도 함께 바뀌어요.

버튼 크기를 `2.5rem × 2.5rem`으로 잡은 건 터치 영역 때문이에요. 손가락으로 누를 때 너무 작으면 자꾸 빗나가거든요. 모바일에서도 편하게 누를 수 있는 최소 크기예요. 이런 세부 결정들도 Claude에게 "모바일에서 터치하기 좋은 크기로 해줘"라고 맥락을 주면 알아서 반영해줘요.

**15줄짜리 Script.** 페이지가 열릴 때 `localStorage`에 저장된 테마를 읽어서 `<html>` 태그에 `data-theme` 속성을 붙여요. 버튼을 누르면 속성을 토글하고, 상태를 다시 `localStorage`에 저장하고, 버튼 이모지를 🌙 ↔ ☀️로 바꿔요. 딱 이 세 가지 동작만 해요. 15줄로 끝나는 이유가 있어요.

`localStorage`는 브라우저에 내장된 작은 메모장이에요. 탭을 닫아도, 컴퓨터를 껐다 켜도 기억이 남아요. 여기서는 `"theme"` 키에 `"dark"` 또는 `"light"` 문자열을 저장해요. 페이지가 열릴 때마다 이 값을 읽어서 토글 상태를 복원하는 거예요.

<!-- IMAGE: screenshot-ch04-darkmode.png | 다크모드 상태(배경 #1b1b1b, 카드 #262626)의 포트폴리오 전체 화면. 오른쪽 위에 ☀️ 토글 버튼 보임. -->

> **WARNING:** localStorage는 '시크릿 모드'나 '쿠키 삭제' 시 초기화돼요. 너무 중요한 설정엔 의존하지 마세요. 여기서는 테마 기억 정도로 충분해요.

---

## 두 기능이 서로 섞이면

반응형과 다크모드는 완전히 독립적으로 작동해요. media query는 화면 너비만 보고, 다크모드는 `data-theme` 속성만 봐요. 그래서 좁은 화면에서 다크모드를 켜면 두 규칙이 충돌 없이 동시에 적용돼요.

CSS가 이렇게 설계된 덕분이에요. 브라우저는 화면을 그릴 때 적용 가능한 규칙을 전부 수집해서 합쳐요. `@media (max-width: 768px)` 안의 규칙과 `[data-theme="dark"]` 안의 규칙이 서로 다른 영역을 담당하기 때문에, 둘 다 활성화되면 각자 역할대로 적용돼요. 기술적으로 아무 충돌이 없어요.

이 조합을 직접 확인해봐요.

- [ ] 모바일 뷰(375px)에서 🌙 버튼을 눌러 다크모드로 전환해봐요.
- [ ] 명함 카드·프로젝트 카드의 텍스트가 어두운 배경에서도 선명하게 읽히는지 확인해요.
- [ ] 페이지를 새로고침한 뒤 다크모드 설정이 유지되는지 체크해요.

토글 버튼이 `position: fixed`라서 좁은 화면에서도 항상 오른쪽 위에 고정돼요. 카드가 세로로 쌓인 모바일 레이아웃 위에 어두운 배경색이 입혀진 화면, 생각보다 꽤 멋있어요. 처음 이 조합이 동작하는 걸 보면 "내가 이걸 만들었다"는 실감이 오기 시작해요.

혹시 다크모드에서 텍스트가 배경에 잘 안 보인다면, 색 대비가 부족한 거예요. Claude에게 "다크모드에서 텍스트 색을 더 밝게 조정해줘"라고 요청하거나, 색 값을 직접 지정해도 돼요. `#f0ebe3` 정도면 충분히 밝아서 대부분의 다크 배경에 잘 보여요.

또 한 가지 확인해볼 게 있어요. 라이트모드에서 다크모드로 전환할 때 색이 갑자기 탁 바뀌는 게 어색하다면, Claude에게 "토글할 때 색이 0.2초 동안 부드럽게 전환되게 해줘"라고 요청해봐요. `body { transition: background-color 0.2s, color 0.2s; }` 한 줄이면 되는 일이에요. 이런 작은 디테일이 쌓이면 포트폴리오의 완성도가 달라져요.

> **TIP:** 다크모드 색은 배경과 텍스트 대비가 4.5:1 이상이면 읽기 편해요. Claude에게 "이 색 조합 대비가 충분한지 확인해줘"라고 물어보면 계산해줘요.

---

## 프롬프트를 더 잘 쓰는 법 — 이번 챕터에서 배운 패턴

이번 챕터에서 Claude에게 보낸 두 프롬프트를 다시 보면 공통된 구조가 있어요.

첫째, **현재 상태를 설명해요.** "지금 핸드폰에서 보면 카드 3장이 좁게 붙어 있어요." 어디서 어떤 문제가 보이는지를 먼저 말해요. Claude는 파일을 보면서 작업하기 때문에 코드를 직접 읽을 수 있어요. 하지만 "어떤 상황에서 어떻게 보이는지"는 여러분만 알아요.

둘째, **원하는 결과를 구체적으로 말해요.** "768px보다 작으면 카드를 1열로" 처럼 숫자와 동작을 함께 주면 결과가 훨씬 정확해요. "좀 더 모바일 친화적으로"처럼 모호하게 말해도 Claude가 나름대로 해석하지만, 원하는 방향과 다를 수 있어요.

셋째, **기술 힌트를 주면 더 좋아요.** "media query로요", "localStorage에 저장해 주세요"처럼 어떤 방식을 써야 할지 힌트를 주면 Claude가 불필요한 라이브러리나 복잡한 방법을 쓰지 않아요. 이 책에서는 순수 HTML/CSS/최소 JS만 쓰는 게 목표이기 때문에, 그 의도를 프롬프트에 담는 게 중요해요.

이 세 가지를 갖춘 프롬프트라면, Claude는 거의 항상 의도한 대로 코드를 써줘요. 반대로 결과가 이상하다면, 이 세 요소 중 하나가 빠졌거나 모호했을 가능성이 높아요. "다시 해줘"보다 "왜 이렇게 됐는지 설명해줘. 내가 원하는 건 ___이야"라고 이어가면 훨씬 빠르게 맞는 결과를 얻을 수 있어요.

Claude와의 대화는 한 번에 완벽한 결과를 내는 과정이 아니에요. 눈으로 보고, 마음에 안 드는 부분을 말로 설명하고, 다시 확인하는 반복이에요. 이번 챕터에서 그 리듬이 자연스러워지기 시작했다면, 다음 챕터부터는 훨씬 편하게 느껴질 거예요.

이 과정에서 Claude가 가끔 예상과 다른 결과를 내기도 해요. "다크모드 토글 버튼을 오른쪽 위에 고정해줘"라고 했는데 왼쪽에 붙는다거나, media query가 적용이 안 되는 것처럼 보일 때도 있어요. 대부분은 캐시 문제이거나 프롬프트가 모호했던 경우예요. 브라우저에서 `Cmd + Shift + R`로 강력 새로고침을 해보고, 그래도 이상하면 "지금 화면에서 버튼이 왼쪽에 붙어 있어요. `position: fixed; top: 1rem; right: 1rem`으로 수정해줘"처럼 코드 값을 직접 지정해서 요청하면 정확하게 고쳐져요.

결과가 마음에 들면 바로 다음으로 넘어가도 되고, 더 다듬고 싶으면 얼마든지 이어서 대화해도 돼요. 포트폴리오는 한 번 만들고 끝나는 게 아니라 계속 업데이트하는 문서예요. 이번에 만든 반응형과 다크모드가 기반이 되어서, 나중에 섹션을 추가하거나 색을 바꿀 때도 같은 구조 안에서 자연스럽게 확장할 수 있어요.

---

## 최종 index.html 확인

Ch3 파일에서 달라진 부분은 딱 네 군데예요. `[data-theme="dark"]` 변수 오버라이드, `.theme-toggle` 버튼 스타일, `@media (max-width: 768px)` 블록, 그리고 버튼 HTML 한 줄과 `<script>` 블록. 나머지 구조와 CSS는 Ch3 그대로예요.

이 파일을 Claude에게 전달할 때 "전체를 다시 써줘"라고 하면 기존 내용이 바뀔 수 있어요. "기존 파일에 추가해줘" 또는 "style 블록 맨 아래에 붙여줘"처럼 어디에 어떻게 추가할지를 지정하면 의도한 대로 반영돼요. Claude는 기존 내용을 지우지 말라는 맥락이 있으면 잘 지켜요.

아래가 Ch4 완성본이에요. 이 파일이 Ch5에서 GitHub에 올릴 최종 파일이기도 해요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>김민지 포트폴리오</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg:#faf7f2; --surface:#fffdf8; --text:#2d2418; --text-muted:#6b5b4e; --accent:#5a6a3e;
      --radius-card:16px; --radius-sm:12px;
      --shadow-sm:0 2px 12px rgba(0,0,0,.05); --shadow-md:0 4px 24px rgba(0,0,0,.08);
    }
    [data-theme="dark"] {
      --bg:#1b1b1b; --surface:#262626; --text:#f0ebe3; --text-muted:#a89b8c; --accent:#a8b878;
      --shadow-sm:0 2px 12px rgba(0,0,0,.3); --shadow-md:0 4px 24px rgba(0,0,0,.4);
    }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { min-height:100vh; display:flex; flex-direction:column; align-items:center;
      background-color:var(--bg); color:var(--text);
      font-family:"Noto Sans KR",-apple-system,sans-serif; padding:3rem 1.5rem; gap:2.5rem; }
    .card { background:var(--surface); border-radius:var(--radius-card); box-shadow:var(--shadow-md);
      padding:3rem 3.5rem; display:flex; align-items:center; gap:2.25rem; max-width:560px; width:100%; }
    .avatar { width:100px; height:100px; border-radius:50%; object-fit:cover;
      flex-shrink:0; border:3px solid rgba(90,106,62,.2); }
    .info__name { font-size:1.6rem; font-weight:700; margin-bottom:.625rem; }
    .tagline { font-size:1rem; color:var(--text-muted); line-height:1.65; }
    .projects { width:100%; max-width:960px; }
    .projects__title { font-size:1.25rem; font-weight:700; margin-bottom:1.25rem; }
    .project-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.25rem; }
    .project-card { background:var(--surface); border-radius:var(--radius-sm);
      box-shadow:var(--shadow-sm); padding:1.75rem 1.5rem; display:flex; flex-direction:column; gap:.75rem; }
    .project-card__title { font-size:1rem; font-weight:700; }
    .project-card__desc { font-size:.9rem; color:var(--text-muted); line-height:1.65; flex:1; }
    .project-card__link { font-size:.875rem; color:var(--accent); text-decoration:none; font-weight:600; }
    .project-card__link:hover { text-decoration:underline; }
    .theme-toggle { position:fixed; top:1rem; right:1rem; width:2.5rem; height:2.5rem;
      border:none; border-radius:50%; background:var(--surface); box-shadow:var(--shadow-sm);
      font-size:1.25rem; cursor:pointer; color:var(--text); }
    @media (max-width: 768px) {
      body { padding:2rem 1rem; gap:1.75rem; }
      .card { flex-direction:column; text-align:center; padding:2rem 1.5rem; gap:1.5rem; }
      .project-grid { grid-template-columns:1fr; }
    }
  </style>
</head>
<body>
  <button class="theme-toggle" aria-label="테마 전환">🌙</button>
  <div class="card">
    <img class="avatar" src="me.jpg" alt="프로필 사진">
    <div class="info">
      <h1 class="info__name">김민지</h1>
      <p class="tagline">데이터로 세상을 더 쉽게 만드는 사람</p>
    </div>
  </div>
  <section class="projects">
    <h2 class="projects__title">프로젝트</h2>
    <div class="project-grid">
      <article class="project-card">
        <h3 class="project-card__title">서울 카페 데이터 분석</h3>
        <p class="project-card__desc">공공데이터 API로 서울시 카페 밀집도를 시각화한 토이 프로젝트예요.</p>
        <a class="project-card__link" href="https://github.com/minji/cafe-map" target="_blank" rel="noopener noreferrer">서울 카페 데이터 분석 보기 →</a>
      </article>
      <article class="project-card">
        <h3 class="project-card__title">뉴스 클론 코딩</h3>
        <p class="project-card__desc">네이버 뉴스 메인 페이지를 HTML/CSS로 클론한 연습 프로젝트예요.</p>
        <a class="project-card__link" href="https://github.com/minji/news-clone" target="_blank" rel="noopener noreferrer">뉴스 클론 코딩 보기 →</a>
      </article>
      <article class="project-card">
        <h3 class="project-card__title">동아리 홈페이지</h3>
        <p class="project-card__desc">데이터 분석 동아리 소개 및 활동 기록을 담은 정적 사이트예요.</p>
        <a class="project-card__link" href="https://minji-club.vercel.app" target="_blank" rel="noopener noreferrer">동아리 홈페이지 보기 →</a>
      </article>
    </div>
  </section>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.querySelector('.theme-toggle');
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        btn.textContent = '☀️';
      }
      btn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('theme', 'light');
          btn.textContent = '🌙';
        } else {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('theme', 'dark');
          btn.textContent = '☀️';
        }
      });
    });
  </script>
</body>
</html>
```

---

## 여기까지 왔다면

포트폴리오가 환경에 적응해요. 모바일에서도 예쁘고, 밤에도 눈이 편해요. 이제 이 파일을 세상에 꺼낼 준비가 된 거예요.

잠깐 돌아봐요. Ch1에서 이름 하나 넣은 명함 페이지로 시작했어요. Ch2에서 프로젝트 카드 3장이 붙었고, Ch3에서 색과 폰트가 내 취향으로 바뀌었어요. 그리고 이번 챕터에서 포트폴리오가 처음으로 "반응"하기 시작했어요. 화면 크기를 감지하고, 사용자의 선택을 기억하고, 그에 맞게 스스로 변해요.

이 변화는 HTML 파일 하나에서 일어난 일이에요. 프레임워크도, 빌드 도구도, 서버도 없어요. 브라우저가 읽을 수 있는 파일 하나가 이 모든 걸 담고 있어요. Claude와 대화 몇 번으로 여기까지 왔다는 게, 직접 겪어보면 생각보다 훨씬 실감나요.

이 시점의 `index.html`은 Ch1의 파일과 비교하면 훨씬 길어졌지만, 구조는 여전히 단순해요. `<head>`에 스타일, `<body>`에 콘텐츠, 맨 아래에 스크립트. 앞으로 어떤 기능을 추가하더라도 이 세 영역 안에서 이루어져요. 파일이 길어진다고 복잡해지는 게 아니에요. 역할이 명확하게 나뉘어 있으면 아무리 길어도 관리할 수 있어요.

다음 챕터에서는 드디어 **공개 URL**을 만들어볼게요. GitHub에 올리고, Vercel에 연결하면 `https://내이름.vercel.app` 같은 주소가 생겨요. 이력서에 바로 붙일 수 있는 진짜 링크요. 지금까지 로컬에서만 보던 포트폴리오가 세상에 나가는 순간이에요.

---

## 현재 프로젝트 상태

```
my-portfolio/
├── index.html   ← media query + 다크모드 토글 + 최소 JS 15줄 추가됨
└── me.jpg
```

---

## 이번 챕터 체크리스트

모든 항목이 체크되면 Ch5로 넘어갈 준비가 된 거예요. 아직 안 된 항목이 있으면 해당 섹션으로 돌아가서 Claude에게 다시 요청해봐요. 체크리스트는 "완료 확인"이 아니라 "빠진 게 없는지 점검"하는 도구예요.

- [ ] 크롬 개발자 도구에서 모바일 뷰(375px)로 포트폴리오 확인했어요
- [ ] `@media (max-width: 768px)` 블록이 `<style>` 안에 추가됐어요
- [ ] 프로젝트 카드 그리드가 모바일에서 1열로 전환돼요
- [ ] 오른쪽 위 토글 버튼을 눌렀을 때 다크모드로 전환돼요
- [ ] `[data-theme="dark"]` CSS 변수 오버라이드가 적용돼요
- [ ] 새로고침 후에도 다크모드 설정이 localStorage에서 복원돼요
- [ ] 모바일 뷰 + 다크모드를 동시에 켜서 레이아웃과 색 대비를 확인했어요

체크리스트를 다 채웠다면, 지금 이 `index.html`을 Ch5에서 그대로 GitHub에 올릴 거예요. 파일을 따로 저장하거나 백업할 필요 없어요. 그 파일 자체가 완성본이에요.
