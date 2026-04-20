# 감성 업그레이드: 색·폰트·여백

명함 아래에 프로젝트 카드 3장이 깔렸어요. 구조는 탄탄하고, 링크도 잘 열리고, 내용도 들어갔죠. 그런데 전체적인 분위기가 조금 딱딱하죠? 이번 챕터에서는 같은 구조에 '내가 고른 톤'을 입혀볼게요.

## 이번 챕터의 목표

- 취향을 말로 설명하는 **취향 프롬프트**를 작성하고 2회 이상 루프 돌리기
- **레퍼런스 이미지**를 대화창에 첨부해서 "이런 느낌으로"를 눈으로 보여주기
- CSS 변수(`:root`)를 활용해 색·폰트·여백을 **내 스타일**로 바꾸기

---

## 지금 톤이 어떻게 느껴지세요?

지금 화면을 보면 배경은 밝은 회색(`#f5f5f5`), 카드는 흰색, 텍스트는 거의 검정에 가까운 색이에요. 시스템 폰트에 무난한 그림자. 나쁜 건 아니에요. 오히려 깔끔하고 읽기 편하죠.

근데 '나답다'는 느낌은 없어요.

포트폴리오는 결국 나를 소개하는 공간이에요. 디폴트 회색이 나쁜 게 아니라, 내 취향이 담기지 않은 게 아쉬운 거예요. 처음부터 완벽한 디자인을 목표로 삼지 않아도 돼요. "조금 더 따뜻하게", "조금 더 차분하게" — 이 정도 방향감각만 있으면 충분해요.

디자이너가 아니어도 괜찮아요. '이 색이 좋아요', '좀 더 따뜻한 느낌으로', '차분하고 고급스러운 인상으로' — 이 정도만 말할 수 있으면 Claude가 나머지를 해줘요. 이번 챕터는 그 대화를 두 번 해보는 연습이에요.

---

## 첫 번째 취향 루프 — '더 부드럽고 모던하게'

처음 프롬프트는 방향만 잡아줘도 충분해요. 완벽한 색상 코드를 몰라도 되고, 디자인 용어를 알 필요도 없어요. 느낌을 말해주면 돼요.

"부드럽고 모던한 느낌"이라는 말은 사람마다 다르게 해석해요. Claude도 마찬가지예요. 그래서 첫 응답이 기대와 다를 수 있어요. 그게 자연스러운 거예요. 첫 루프는 방향을 잡는 시도고, 두 번째 루프에서 조정하면 돼요.

```markdown
지금 포트폴리오 톤이 조금 딱딱하게 느껴져요.
전체적으로 더 부드럽고 모던한 느낌으로 바꿔 주세요.
구조나 내용은 그대로 두고, 색·폰트·여백만 조정해 주세요.
CSS 변수(:root)로 색을 정의하고, 여백은 rem 단위로 써주세요.
```

Claude는 이 프롬프트를 받으면 보통 이렇게 처리해요.

- `:root {}` 블록을 `<style>` 맨 위에 만들고, `--bg`, `--surface`, `--text`, `--accent` 같은 변수를 정의해요
- 배경을 크림 계열(`#faf8f5` 같은)로, 카드를 아이보리(`#fffdf8`)로 바꿔요
- 여백을 `px` 대신 `rem` 단위로 다듬어요
- Google Fonts 링크를 `<head>`에 추가해줄 때도 있어요 — "Noto Sans KR"이나 "Pretendard" 같은 한글 폰트

응답이 오면 `index.html`에 붙여 넣고 브라우저를 새로고침해요. 같은 페이지인데 인상이 달라지는 순간이에요.

Claude가 처음에 너무 과감하게 바꿀 때도 있어요. 배경이 갑자기 진한 파란색이 되거나, 폰트 크기가 커지는 경우도 있어요. 그럴 땐 당황하지 말고 "조금 더 차분하게", "배경만 원래대로 돌려줘"처럼 이어서 말하면 돼요. 이 대화 자체가 루프예요.

<!-- IMAGE: screenshot-ch03-first-tone.png
1차 취향 프롬프트 이후 브라우저 결과. 배경이 크림 계열로 바뀌고 전체 분위기가 부드러워진 모습.
-->

> **TIP:** `:root {}`로 CSS 변수를 정의해달라고 명시하면, 나중에 색을 바꾸고 싶을 때 변수 값 한 줄만 수정하면 전체가 바뀌어요. "배경색만 바꿔줘"라고 다시 말할 필요 없이, `--bg` 값 하나로 끝나요.

---

## 두 번째 취향 루프 — 방향 조정

처음 결과가 딱 마음에 들 수도 있고, "좋아지긴 했는데 뭔가 아직"이라는 느낌이 들 수도 있어요. 두 번째 루프는 그 '뭔가'를 말하는 연습이에요.

어떤 방향으로 바꿀지 막막하다면, 아래 네 가지 중 하나를 골라보세요.

- **파스텔** — 연한 핑크·민트·라벤더. 따뜻하고 귀여운 인상
- **모노톤** — 흑·백·회색 + 포인트 색 하나. 차분하고 고급스러운 인상
- **뉴트로** — 베이지·브라운·올리브. 아날로그 감성, 따뜻하고 차분한 인상
- **미니멀** — 흰 배경에 텍스트 중심. 깔끔하고 군더더기 없는 인상

예를 들어 처음 결과가 파스텔이라 너무 귀여웠다면, 이렇게 말해요.

```markdown
좋아지긴 했는데 너무 귀여운 느낌이에요.
좀 더 차분한 모노톤(흑·백·회색+포인트 하나)으로 다시 해주세요.
포인트 색은 딥 블루(#1e3a8a 같은) 정도로 주면 좋겠어요.
```

Claude는 이전에 정의한 CSS 변수 값만 바꿔서 돌려줘요. 구조를 건드리지 않기 때문에 결과가 깔끔해요.

두 번 해도 여전히 마음에 안 들 수 있어요. 세 번, 네 번 해도 괜찮아요. 실제 디자이너들도 시안을 여러 번 반복해요. 루프를 돌리는 게 정답이에요.

> **NOTE:** 톤이 마음에 안 들면 '이건 빼고 저건 유지'처럼 **구체적으로** 말해요. '그냥 예쁘게 해줘'는 Claude도 막막해해요. "배경은 지금 것 유지하고 포인트 색만 초록 계열로 바꿔줘" 같은 식으로 범위를 좁혀주면 원하는 방향으로 빠르게 수렴해요.

---

## 레퍼런스 이미지 첨부하기

말로 설명하기 어려운 취향이 있어요. '이 느낌인데 말로 뭐라 해야 할지 모르겠어' 싶을 때, 이미지를 직접 보여주는 게 빠를 때가 있어요.

Claude Code 대화창은 이미지 첨부를 지원해요. 방법은 두 가지예요.

- 핀터레스트, 드리블, Behance 같은 곳에서 마음에 드는 포트폴리오 화면을 캡처해서 저장해두고, 대화창에 **드래그&드롭**해요
- 또는 이미지를 클립보드에 복사한 뒤, 대화창에서 **Ctrl+V(또는 Cmd+V)**로 붙여 넣어요

이미지가 첨부되면 프롬프트를 이렇게 써요.

```markdown
첨부한 이미지의 색 팔레트와 여백 감각을 참고해서,
내 포트폴리오를 이 톤에 가깝게 맞춰주세요.
폰트는 시스템 폰트 스택 유지하고, 색과 여백만 바꿔요.
```

Claude는 이미지를 분석해서 주요 색상과 여백 리듬을 읽어내고, 그걸 CSS 변수에 반영해줘요. 정확히 일치하지 않아도 괜찮아요. 방향을 잡는 참고 자료로 쓰는 거니까요.

이미지 첨부는 Claude Code에서만 되는 건 아니에요. 하지만 Claude Code는 이미지를 보고 코드까지 바로 수정해주기 때문에, 보여주고 → 수정받고 → 확인하는 사이클이 한 화면에서 끝나요. 별도 도구를 쓸 필요가 없어요.

한 장보다 두 장이 더 효과적일 때도 있어요. "이 배경 색감"을 담은 이미지 하나, "이 카드 레이아웃 여백 감각"을 담은 이미지 하나를 같이 첨부하면 Claude가 더 구체적으로 방향을 잡아줘요.

<!-- IMAGE: screenshot-ch03-reference-paste.png
레퍼런스 이미지가 Claude Code 대화창에 첨부된 모습. 이미지 썸네일이 메시지 입력창 위에 붙어 있는 화면.
-->

> **WARNING:** 저작권이 있는 디자인 이미지는 내 포트폴리오에 직접 복사하지 않아요. 첨부는 오직 '이런 톤과 감성을 참고해줘'라는 용도로만 써요. 내 코드에 들어가는 색상 코드와 스타일은 Claude가 새로 만들어준 거예요.

---

## CSS 화이트리스트 — 모던 톤의 재료

Claude가 생성하는 CSS에서 핵심 재료를 이해해두면, 나중에 조금씩 직접 손보기도 쉬워요. 모던하고 깔끔한 톤을 만들 때 쓰는 재료는 크게 네 가지예요.

이 재료들을 미리 프롬프트에 언급해두면, Claude가 처음부터 올바른 방식으로 코드를 작성해줘요. "CSS 변수로 색을 관리하고, 여백은 rem으로, 그림자는 부드럽게" — 이 한 줄이 결과물의 품질을 크게 바꿔요.

### CSS 변수

`<style>` 맨 위에 `:root {}` 블록을 두고 `--bg`, `--surface`, `--text`, `--accent`, `--radius`, `--shadow-sm` 같은 변수를 정의해요. 이후 각 셀렉터에서 하드코딩된 색 대신 `var(--bg)`, `var(--accent)` 형태로 불러 써요. 색을 바꾸고 싶으면 이 블록 값만 수정하면 전체가 한 번에 바뀌어요.

### 시스템 폰트 스택

`font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard Variable", sans-serif;`

별도 설치 없이 운영체제 기본 폰트를 써요. 한글 폰트를 더하고 싶으면 `<head>`에 Noto Sans KR Google Fonts 링크를 추가하고, `font-family` 앞쪽에 `"Noto Sans KR",`을 붙이면 돼요.

### rem 여백과 부드러운 그림자

여백은 `px` 대신 `rem`을 써요. `padding: 2rem 1.5rem;`, `gap: 1.25rem;` 같은 표기가 기준이에요. 브라우저 기본 폰트 크기 기준으로 계산되기 때문에 나중에 반응형으로 넓힐 때도 자연스럽게 따라와요.

그림자는 `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);`처럼 불투명도를 낮게 유지해요. `0.06`~`0.10` 사이가 모던하고 가벼운 느낌을 줘요.

이 네 가지 재료를 Claude가 알아서 조합해줘요. 직접 CSS를 쓸 필요는 없어요. 다만 결과물에서 이 패턴을 알아볼 수 있으면, 나중에 "배경만 살짝 더 어둡게", "카드 그림자 조금 강하게" 같은 세부 요청도 정확하게 할 수 있어요.

> **TIP:** Claude가 `.p-4`, `.m-8`, `.text-lg` 같은 클래스 이름을 만들어오면, "그런 이름 말고 `.projects__title`, `.card--featured`처럼 의미 기반 이름으로 써주세요"라고 말해요. 나중에 코드를 다시 읽을 때 훨씬 알아보기 쉬워요.

---

## 최종 결과 확인하기

두 번의 루프와 레퍼런스 이미지 대화가 끝나면, `index.html`을 저장하고 브라우저를 새로고침해요.

구조는 Ch2와 똑같아요. 명함 카드, 프로젝트 섹션, 카드 3장 그리드. 바뀐 건 오직 색·폰트·여백이에요. 그런데 첫눈에 느껴지는 인상이 완전히 달라져요. 이게 디자인의 힘이에요.

비교해보면 더 선명하게 느껴져요. Ch2 화면을 스크린샷으로 저장해두고, Ch3 완성 화면과 나란히 놓아보세요. HTML 파일 크기는 거의 같은데, 보이는 인상은 전혀 달라요. 이 차이를 만드는 건 CSS 변수 블록 10줄 남짓이에요.

나중에 "역시 처음 톤이 더 나았어"라고 생각하면 `:root {}` 값만 되돌리면 돼요. 변수 구조를 유지한 덕분에 실험이 부담 없어요.

아래 두 스크린샷을 비교해보세요.

<!-- IMAGE: screenshot-ch03-before.png
Ch2 완성 화면. 배경 #f5f5f5, 카드 흰색, 텍스트 진한 회색의 디폴트 톤.
-->

<!-- IMAGE: screenshot-ch03-after.png
Ch3 완성 화면. 같은 구조에 크림-아이보리-딥 브라운-올리브 톤이 입혀진 모습. 전체 인상이 따뜻하고 고급스러워졌어요.
-->

---

## 최종 index.html 확인

아래는 Ch3 완성본이에요. Ch2 구조를 그대로 유지하면서, CSS 변수와 폰트·여백 조정으로 인상을 바꿨어요.

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
      --bg: #faf7f2;
      --surface: #fffdf8;
      --text: #2d2418;
      --text-muted: #6b5b4e;
      --accent: #5a6a3e;
      --radius-card: 16px;
      --radius-sm: 12px;
      --shadow-sm: 0 2px 12px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 24px rgba(0, 0, 0, 0.08);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: flex-start;
      background-color: var(--bg);
      font-family: "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 3rem 1.5rem; gap: 2.5rem; color: var(--text);
    }
    .card {
      background: var(--surface); border-radius: var(--radius-card);
      box-shadow: var(--shadow-md); padding: 3rem 3.5rem;
      display: flex; align-items: center; gap: 2.25rem;
      max-width: 560px; width: 100%;
    }
    .avatar {
      width: 100px; height: 100px; border-radius: 50%;
      object-fit: cover; flex-shrink: 0;
      border: 3px solid rgba(90, 106, 62, 0.2);
    }
    .info__name { font-size: 1.6rem; font-weight: 700; color: var(--text); margin-bottom: 0.625rem; }
    .tagline { font-size: 1rem; color: var(--text-muted); line-height: 1.65; }
    .projects { width: 100%; max-width: 960px; }
    .projects__title { font-size: 1.25rem; font-weight: 700; color: var(--text); margin-bottom: 1.25rem; }
    .project-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
    .project-card {
      background: var(--surface); border-radius: var(--radius-sm);
      box-shadow: var(--shadow-sm); padding: 1.75rem 1.5rem;
      display: flex; flex-direction: column; gap: 0.75rem;
    }
    .project-card__title { font-size: 1rem; font-weight: 700; color: var(--text); }
    .project-card__desc { font-size: 0.9rem; color: var(--text-muted); line-height: 1.65; flex: 1; }
    .project-card__link { font-size: 0.875rem; color: var(--accent); text-decoration: none; font-weight: 600; }
    .project-card__link:hover { text-decoration: underline; }
  </style>
</head>
<body>
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
        <p class="project-card__desc">서울 25개 구의 카페 밀집도와 폐업률을 분석해 상권 패턴을 시각화했어요.</p>
        <a class="project-card__link" href="..." target="_blank" rel="noopener noreferrer">결과 보기 →</a>
      </article>
      <article class="project-card">
        <h3 class="project-card__title">독서 기록 대시보드</h3>
        <p class="project-card__desc">3년치 독서 데이터를 분석하고 장르별 완독률·평점 변화를 인터랙티브 차트로 표현했어요.</p>
        <a class="project-card__link" href="..." target="_blank" rel="noopener noreferrer">대시보드 보기 →</a>
      </article>
      <article class="project-card">
        <h3 class="project-card__title">채용 공고 키워드 분석</h3>
        <p class="project-card__desc">데이터 직군 채용 공고 2,000건을 크롤링해 요구 스킬 트렌드 변화를 정리했어요.</p>
        <a class="project-card__link" href="..." target="_blank" rel="noopener noreferrer">리포트 보기 →</a>
      </article>
    </div>
  </section>
</body>
</html>
```

---

## 여기까지 왔다면

구조는 그대로인데, 같은 페이지가 완전히 다른 인상을 줘요. 이게 디자인의 힘이에요.

CSS 변수 덕분에 다음에 톤을 바꾸고 싶으면 `:root {}` 블록 값만 고치면 돼요. 구조를 건드릴 필요가 없어요. 색 하나 바꾸는 데 5초면 충분해요.

이번 챕터에서 한 것처럼, 처음엔 말로 방향을 잡고, 그다음엔 이미지로 레퍼런스를 주고, 그래도 아쉬우면 또 한 번 말로 조정하는 방식 — 이게 Vibe Coding의 핵심 리듬이에요. 완성된 결과물보다 이 대화 루프 자체를 익히는 게 이번 챕터의 진짜 목표였어요.

다음 챕터에서는 이 포트폴리오가 핸드폰에서도 예쁘게 보이도록 만들고, 다크모드 토글까지 달아볼게요.

---

## 현재 프로젝트 상태

```
my-portfolio/
├── index.html   ← Ch3에서 CSS 변수 도입 + 색·폰트·여백이 취향에 맞게 변경됨
└── me.jpg
```

---

## 이번 챕터 체크리스트

- [ ] 취향 프롬프트 1차 — "더 부드럽고 모던하게" 요청하기
- [ ] 취향 프롬프트 2차 — 방향 조정(파스텔/모노톤/뉴트로/미니멀 중 선택)
- [ ] 레퍼런스 이미지를 대화창에 첨부해서 톤 레퍼런싱하기
- [ ] `<style>` 안에 `:root { --bg: ...; --surface: ...; }` CSS 변수 블록 확인
- [ ] 시스템 폰트 유지 또는 Google Fonts(Noto Sans KR 등) 추가 확인
- [ ] 색·폰트·여백이 Ch2 디폴트 톤에서 벗어났는지 브라우저로 확인
- [ ] 클래스명에 `p-4`, `m-8` 같은 Tailwind-shape 이름이 없는지 확인
