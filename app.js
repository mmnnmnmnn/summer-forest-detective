const app = document.getElementById("app");
const STORAGE_KEY = "summerForestDetectiveProgress_v1";

let selectedChoice = null;
let currentPhotoData = null;

function getProgress() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return {
      teamName: "",
      completed: []
    };
  }

  try {
    return JSON.parse(saved);
  } catch {
    return {
      teamName: "",
      completed: []
    };
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function getStationFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const station = Number(params.get("station"));

  if (!station || station < 1 || station > MISSIONS.length) {
    return null;
  }

  return station;
}

function isAllCompleted() {
  const progress = getProgress();
  return MISSIONS.every(mission => progress.completed.includes(mission.id));
}

function getFinalCode() {
  return MISSIONS.map(mission => mission.code).join("");
}

function render() {
  const station = getStationFromUrl();

  if (station) {
    renderStationIntro(station);
    return;
  }

  renderMain();
}

function renderMain() {
  const progress = getProgress();

  if (isAllCompleted()) {
    renderFinalScreen();
    return;
  }

  app.innerHTML = `
    <section class="screen">
      <div class="hero-card">
        <div class="leaf">🌿</div>
        <div class="badge">국립과천과학관 곤충관</div>
        <h1>여름숲탐정본부</h1>
        <p class="subtitle">암호를 해독하라</p>
        <p class="desc">
          생태공원 곳곳의 QR코드를 찾아 사건을 해결하고,
          암호 글자를 모아 최종 암호를 완성해보세요.
        </p>
      </div>

      <div class="card">
        <label for="teamName">탐험대 이름</label>
        <input 
          id="teamName" 
          type="text" 
          placeholder="예: 초록나비 탐험대"
          value="${escapeHtml(progress.teamName || "")}"
        />
        <button class="primary-btn" onclick="saveTeamName()">탐험대 이름 저장</button>
      </div>

      <div class="card">
        <h2>암호 수집 현황</h2>
        <div class="stamp-row">
          ${MISSIONS.map(mission => {
            const isDone = progress.completed.includes(mission.id);
            return `<div class="stamp ${isDone ? "done" : ""}">${isDone ? mission.code : "□"}</div>`;
          }).join("")}
        </div>
        <p class="small-text">QR코드를 스캔하면 해당 사건이 열립니다.</p>
      </div>

      <div class="card">
        <h2>행사 테스트용 링크</h2>
        <p class="small-text">실제 운영 시에는 각 장소의 QR코드로 접속합니다.</p>
        <div class="mission-link-list">
          ${MISSIONS.map(mission => `
            <a href="index.html?station=${mission.id}">
              ${mission.caseLabel} ${mission.title}
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function saveTeamName() {
  const input = document.getElementById("teamName");
  const progress = getProgress();

  progress.teamName = input.value.trim();
  saveProgress(progress);

  renderMain();
}

function renderStationIntro(stationId) {
  const mission = MISSIONS.find(item => item.id === stationId);
  const progress = getProgress();
  const isCompleted = progress.completed.includes(stationId);

  selectedChoice = null;
  currentPhotoData = null;

  app.innerHTML = `
    <section class="screen">
      <div class="case-card">
        <div class="case-top">
          <div class="badge">${mission.caseLabel}</div>
          <div class="case-number">${mission.id}/6</div>
        </div>

        <h1>${mission.title}</h1>
        <p class="desc">${mission.story}</p>

        ${
          isCompleted
            ? `
              <div class="complete-box">
                <div class="big-icon">✅</div>
                이미 해결한 사건입니다.<br />
                획득한 암호 글자: <strong>${mission.code}</strong>
              </div>
              <button class="primary-btn" onclick="goHome()">진행상황 보기</button>
            `
            : `
              <button class="primary-btn pulse" onclick="startMission(${mission.id})">
                사건 시작하기
              </button>
              <button class="secondary-btn" onclick="goHome()">메인으로 돌아가기</button>
            `
        }
      </div>
    </section>
  `;
}

function startMission(stationId) {
  selectedChoice = null;
  currentPhotoData = null;

  const mission = MISSIONS.find(item => item.id === stationId);

  app.innerHTML = `
    <section class="screen">
      <div class="case-card">
        <div class="case-top">
          <div class="badge">${mission.caseLabel}</div>
          <div class="case-number">${mission.id}/6</div>
        </div>

        <h1>${mission.title}</h1>

        <div class="question-box">
          <p class="question">${mission.question}</p>
        </div>

        <div class="choice-list">
          ${mission.choices.map((choice, index) => `
            <button class="choice-btn" onclick="selectChoice(${mission.id}, ${index})" id="choice-${index}">
              ${index + 1}. ${choice}
            </button>
          `).join("")}
        </div>

        <button class="primary-btn" id="checkAnswerBtn" onclick="checkAnswer(${mission.id})" disabled>
          정답 확인
        </button>

        <button class="secondary-btn" onclick="renderStationIntro(${mission.id})">이전으로</button>

        <div id="resultArea"></div>
      </div>
    </section>
  `;
}

function selectChoice(stationId, choiceIndex) {
  selectedChoice = choiceIndex;

  const mission = MISSIONS.find(item => item.id === stationId);

  mission.choices.forEach((_, index) => {
    const btn = document.getElementById(`choice-${index}`);
    btn.classList.remove("selected");
  });

  document.getElementById(`choice-${choiceIndex}`).classList.add("selected");
  document.getElementById("checkAnswerBtn").disabled = false;
}

function checkAnswer(stationId) {
  const mission = MISSIONS.find(item => item.id === stationId);
  const resultArea = document.getElementById("resultArea");

  if (selectedChoice === mission.answer) {
    resultArea.innerHTML = `
      <div class="result-box success pop">
        <div class="big-icon">🎉</div>
        <h2>정답입니다!</h2>
        <p>탐정님이 사건의 단서를 찾아냈어요.</p>
        <div class="code-reveal">
          암호 글자
          <strong>${mission.code}</strong>
        </div>
        <button class="primary-btn" onclick="renderPhotoMission(${mission.id})">
          사진 미션 하러 가기
        </button>
      </div>
    `;

    launchConfetti();
  } else {
    resultArea.innerHTML = `
      <div class="result-box fail">
        <div class="big-icon">😥</div>
        <h2>아쉽습니다</h2>
        <p class="hint-title">힌트</p>
        <p>${mission.hint}</p>
        <button class="primary-btn" onclick="startMission(${mission.id})">
          다시 도전
        </button>
      </div>
    `;
  }
}

function renderPhotoMission(stationId) {
  const mission = MISSIONS.find(item => item.id === stationId);

  currentPhotoData = null;

  app.innerHTML = `
    <section class="screen">
      <div class="case-card">
        <div class="badge">사진 미션</div>
        <h1>${mission.title}</h1>

        <div class="photo-mission-box">
          <div class="big-icon">📷</div>
          <p>${mission.photoMission}</p>
        </div>

        <label class="camera-btn">
          카메라로 사진 찍기
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onchange="handlePhotoUpload(event, ${mission.id})"
          />
        </label>

        <div id="photoPreviewArea" class="photo-preview-area">
          <p class="small-text">사진을 찍으면 이곳에 미리보기가 나타납니다.</p>
        </div>

        <button class="primary-btn" id="completeMissionBtn" onclick="completeMission(${mission.id})" disabled>
          미션 완료하고 저장하기
        </button>

        <button class="secondary-btn" onclick="startMission(${mission.id})">퀴즈로 돌아가기</button>
      </div>
    </section>
  `;
}

function handlePhotoUpload(event, stationId) {
  const file = event.target.files[0];
  const previewArea = document.getElementById("photoPreviewArea");
  const completeBtn = document.getElementById("completeMissionBtn");

  if (!file) {
    currentPhotoData = null;
    completeBtn.disabled = true;
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    currentPhotoData = e.target.result;

    previewArea.innerHTML = `
      <div class="photo-confirm-box">
        <img src="${currentPhotoData}" alt="사진 미션 미리보기" />
        <p>사진이 확인되었습니다.</p>
      </div>
    `;

    completeBtn.disabled = false;
  };

  reader.readAsDataURL(file);
}

function completeMission(stationId) {
  if (!currentPhotoData) {
    return;
  }

  const progress = getProgress();

  if (!progress.completed.includes(stationId)) {
    progress.completed.push(stationId);
  }

  progress.completed.sort((a, b) => a - b);
  saveProgress(progress);

  if (isAllCompleted()) {
    renderFinalScreen();
    return;
  }

  renderMissionComplete(stationId);
}

function renderMissionComplete(stationId) {
  const mission = MISSIONS.find(item => item.id === stationId);
  const progress = getProgress();

  app.innerHTML = `
    <section class="screen">
      <div class="case-card">
        <div class="big-icon">🕵️‍♀️</div>
        <h1>사건 해결 완료!</h1>
        <p class="desc">
          ${mission.caseLabel} <strong>${mission.title}</strong> 사건을 해결했습니다.
        </p>

        <div class="code-reveal">
          획득한 암호
          <strong>${mission.code}</strong>
        </div>

        <div class="stamp-row">
          ${MISSIONS.map(item => {
            const isDone = progress.completed.includes(item.id);
            return `<div class="stamp ${isDone ? "done" : ""}">${isDone ? item.code : "□"}</div>`;
          }).join("")}
        </div>

        <button class="primary-btn" onclick="goHome()">진행상황 보기</button>
      </div>
    </section>
  `;
}

function renderFinalScreen() {
  const finalCode = getFinalCode();

  app.innerHTML = `
    <section class="screen">
      <div class="final-card pop">
        <div class="big-icon">🎉</div>
        <div class="badge">MISSION COMPLETE</div>
        <h1>축하합니다!</h1>
        <p class="desc">
          여름숲탐정본부의 모든 사건을 해결했습니다.
        </p>

        <div class="final-code-box">
          최종 암호
          <strong>${finalCode}</strong>
        </div>

        <div class="staff-box">
          직원에게<br />
          이 화면을 보여주세요.
        </div>

        <button class="secondary-btn" onclick="goHome()">메인으로 돌아가기</button>
      </div>
    </section>
  `;

  launchConfetti();
}

function goHome() {
  window.location.href = "index.html";
}

function resetProgressForTest() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = "index.html";
}

function launchConfetti() {
  const confettiCount = 24;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.animationDelay = Math.random() * 0.5 + "s";
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 1800);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
