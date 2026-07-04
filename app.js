const app = document.getElementById("app");
const STORAGE_KEY = "summerForestDetectiveProgress_v2";
const PHOTO_UPLOAD_URL = "https://script.google.com/macros/s/AKfycbzSVkKJkZi27yPD6sDqWIMRBySEgJxiZHhd5eeN9iVV9jGrHoGVt4WW0WOYaKx3gWML/exec";
const PHOTO_MAX_WIDTH = 1400;
const PHOTO_JPEG_QUALITY = 0.82;

let selectedChoice = null;
let currentPhotoData = null;

function getProgress() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return { teamName: "", completed: [], hasSeenGuide: false, completedAt: "", photoUploads: {} };

  try {
    const parsed = JSON.parse(saved);
    return {
      teamName: parsed.teamName || "",
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      hasSeenGuide: Boolean(parsed.hasSeenGuide),
      completedAt: parsed.completedAt || "",
      photoUploads: parsed.photoUploads || {}
    };
  } catch {
    return { teamName: "", completed: [], hasSeenGuide: false, completedAt: "", photoUploads: {} };
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function getStationFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const station = Number(params.get("station"));
  if (!station || station < 1 || station > MISSIONS.length) return null;
  return station;
}

function isAllCompleted() {
  const progress = getProgress();
  return MISSIONS.every(mission => progress.completed.includes(mission.id));
}

function getFinalCode() {
  return MISSIONS.map(mission => mission.code).join("");
}

function getNextMission(currentId) {
  const progress = getProgress();
  return MISSIONS.find(mission => !progress.completed.includes(mission.id) && mission.id !== currentId)
    || MISSIONS.find(mission => !progress.completed.includes(mission.id))
    || null;
}

function render() {
  const station = getStationFromUrl();
  const progress = getProgress();

  if (station === 1 && !isAllCompleted()) {
    renderFirstGuide(1, true);
    return;
  }

  if (station) {
    if (!progress.hasSeenGuide && !isAllCompleted()) {
      renderFirstGuide(station, false);
      return;
    }

    renderStationIntro(station);
    return;
  }

  renderMain();
}

function renderProgressBlock() {
  const progress = getProgress();
  const completedCount = progress.completed.length;
  return `
    <div class="progress-panel">
      <div class="progress-head">
        <strong>탐정 진행상황</strong>
        <span>${completedCount} / ${MISSIONS.length} 완료</span>
      </div>
      <div class="mini-stamps">
        ${MISSIONS.map(mission => {
          const isDone = progress.completed.includes(mission.id);
          return `<div class="mini-stamp ${isDone ? "done" : ""}">${isDone ? mission.code : mission.id}</div>`;
        }).join("")}
      </div>
    </div>
  `;
}

function renderMain() {
  const progress = getProgress();

  if (isAllCompleted()) {
    renderFinalScreen();
    return;
  }

  if (!progress.hasSeenGuide) {
    renderFirstGuide();
    return;
  }

  app.innerHTML = `
    <section class="screen">
      <div class="hero-card">
        <div class="leaf">🌿</div>
        <div class="badge">국립과천과학관 곤충관</div>
        <h1>여름숲탐정본부</h1>
        <p class="subtitle">암호를 해독하라</p>
        <p class="desc">생태공원 곳곳의 QR코드를 찾아 사건을 해결하고, 암호 글자를 모아 최종 암호를 완성해보세요.</p>
      </div>

      ${renderProgressBlock()}

      <div class="card notice-card">
        <h2>사진 저장 안내</h2>
        <p class="small-text">사진 미션에서 촬영한 이미지는 행사 운영 기록 및 과학관 아카이브용으로 Google Drive에 저장됩니다.</p>
        <p class="small-text"><strong>사람 얼굴이 나오지 않도록</strong> 자연물, 곤충, 식물, 풍경 위주로 촬영해주세요.</p>
      </div>

      <div class="card">
        <label for="teamName">탐험대 이름</label>
        <input id="teamName" type="text" placeholder="예: 초록나비 탐험대" value="${escapeHtml(progress.teamName || "")}" />
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
              <span>${mission.zone}</span>
              ${mission.caseLabel} ${mission.title}
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderFirstGuide(targetStation = null, forceIntro = false) {
  const progress = getProgress();
  app.innerHTML = `
    <section class="screen">
      <div class="hero-card guide-card">
        <div class="leaf">🕵️‍♀️🌿</div>
        <div class="badge">처음 오셨나요?</div>
        <h1>여름숲탐정본부</h1>
        <p class="subtitle">암호를 해독하라</p>
        <p class="desc">생태공원에 숨겨진 6개의 QR코드를 찾아 사건을 해결하세요. 퀴즈를 맞히고 증거 사진을 남기면 암호 글자를 얻을 수 있습니다.</p>
        ${targetStation ? `
          <div class="guide-notice">
            <strong>${forceIntro ? "첫 번째 QR 확인 완료" : "QR 확인 완료"}</strong><br />
            탐험대 이름을 입력하면 방금 찾은 CASE ${targetStation} 사건으로 이동합니다.
          </div>
        ` : ""}
      </div>

      <div class="card">
        <h2>참여 방법</h2>
        <div class="guide-steps">
          <div><strong>1</strong><span>QR코드를 찾습니다.</span></div>
          <div><strong>2</strong><span>사건 이야기를 읽고 퀴즈를 풉니다.</span></div>
          <div><strong>3</strong><span>정답을 맞히면 암호 글자를 얻습니다.</span></div>
          <div><strong>4</strong><span>증거 사진을 찍고 미션을 완료합니다.</span></div>
          <div><strong>5</strong><span>6개 암호를 모아 직원에게 보여주세요.</span></div>
        </div>
      </div>

      <div class="card">
        <label for="teamName">탐험대 이름</label>
        <input id="teamName" type="text" placeholder="예: 초록나비 탐험대" value="${escapeHtml(progress.teamName || "")}" />
        <button class="primary-btn pulse" onclick="startFirstGuide(${targetStation || null})">탐험 시작하기</button>
        <div id="guideMessage"></div>
      </div>
    </section>
  `;
}

function startFirstGuide(targetStation = null) {
  const input = document.getElementById("teamName");
  const progress = getProgress();
  const teamName = input.value.trim();

  if (!teamName) {
    input.focus();
    const messageArea = document.getElementById("guideMessage");
    if (messageArea) {
      messageArea.innerHTML = `<div class="warning-box">탐험대 이름을 입력해 주세요.</div>`;
    }
    return;
  }

  progress.teamName = teamName;
  progress.hasSeenGuide = true;
  saveProgress(progress);

  if (targetStation) {
    renderStationIntro(targetStation);
    return;
  }

  renderMain();
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

  if (!progress.hasSeenGuide) {
    progress.hasSeenGuide = true;
    saveProgress(progress);
  }

  app.innerHTML = `
    <section class="screen">
      ${renderProgressBlock()}
      <div class="case-card">
        <div class="case-top">
          <div>
            <div class="badge">${mission.zone}</div>
            <div class="badge light">${mission.caseLabel}</div>
          </div>
          <div class="case-number">${mission.id}/6</div>
        </div>
        <h1>${mission.title}</h1>
        <p class="desc">${mission.story}</p>
        ${isCompleted ? renderAlreadyCompletedBlock(mission) : `
          <button class="primary-btn pulse" onclick="startMission(${mission.id})">사건 시작하기</button>
          <button class="secondary-btn" onclick="goHome()">진행상황 보기</button>
        `}
      </div>
    </section>
  `;
}

function renderAlreadyCompletedBlock(mission) {
  const nextMission = getNextMission(mission.id);
  return `
    <div class="complete-box">
      <div class="big-icon">✅</div>
      <h2>이미 해결한 사건입니다</h2>
      <p>탐정 기록을 확인했습니다.</p>
      <div class="code-reveal small">획득한 암호<strong>${mission.code}</strong></div>
    </div>
    ${nextMission ? `
      <div class="next-box next-qr-box">
        <h2>다음 QR 안내</h2>
        <p>이 사건은 이미 해결했어요. 아직 해결하지 않은 다음 QR을 찾아가면 됩니다.</p>
        <p class="next-title">👉 ${nextMission.caseLabel} ${nextMission.title}</p>
        <p class="location-hint">📍 ${nextMission.zone} 주변에서 다음 단서를 찾아보세요.</p>
        <p class="small-text">QR을 스캔하면 다음 사건 화면이 열립니다.</p>
      </div>
    ` : `
      <div class="next-box next-qr-box">
        <h2>모든 사건 해결 완료</h2>
        <p>최종 암호 화면을 열고, 화면을 캡쳐한 뒤 기념품 교환 시 보여주세요.</p>
      </div>
    `}
    <button class="primary-btn" onclick="${nextMission ? "goHome()" : "renderFinalScreen()"}">${nextMission ? "진행상황 보기" : "최종 암호 보기"}</button>
  `;
}

function startMission(stationId) {
  selectedChoice = null;
  currentPhotoData = null;
  const mission = MISSIONS.find(item => item.id === stationId);

  app.innerHTML = `
    <section class="screen">
      ${renderProgressBlock()}
      <div class="case-card">
        <div class="case-top">
          <div>
            <div class="badge">${mission.zone}</div>
            <div class="badge light">${mission.caseLabel}</div>
          </div>
          <div class="case-number">${mission.id}/6</div>
        </div>
        <h1>${mission.title}</h1>
        <div class="question-box"><p class="question">${mission.question}</p></div>
        <div class="choice-list">
          ${mission.choices.map((choice, index) => `
            <button class="choice-btn" onclick="selectChoice(${mission.id}, ${index})" id="choice-${index}">${index + 1}. ${choice}</button>
          `).join("")}
        </div>
        <button class="primary-btn" id="checkAnswerBtn" onclick="checkAnswer(${mission.id})" disabled>정답 확인</button>
        <button class="secondary-btn" onclick="renderStationIntro(${mission.id})">사건 소개로 돌아가기</button>
        <div id="resultArea"></div>
      </div>
    </section>
  `;
}

function selectChoice(stationId, choiceIndex) {
  selectedChoice = choiceIndex;
  const mission = MISSIONS.find(item => item.id === stationId);
  mission.choices.forEach((_, index) => document.getElementById(`choice-${index}`).classList.remove("selected"));
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
        <p>탐정님이 사건의 핵심 단서를 찾아냈어요.</p>
        <div class="code-reveal">암호 글자<strong>${mission.code}</strong></div>
        <button class="primary-btn" onclick="renderPhotoMission(${mission.id})">증거 사진 남기기</button>
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
        <button class="primary-btn" onclick="startMission(${mission.id})">다시 도전</button>
      </div>
    `;
  }
}

function renderPhotoMission(stationId) {
  const mission = MISSIONS.find(item => item.id === stationId);
  currentPhotoData = null;

  app.innerHTML = `
    <section class="screen">
      ${renderProgressBlock()}
      <div class="case-card">
        <div class="badge">증거 사진 미션</div>
        <h1>${mission.title}</h1>
        <div class="photo-mission-box">
          <div class="big-icon">📷</div>
          <h2>증거를 확보하세요</h2>
          <p>${mission.photoMission}</p>
        </div>
        <label class="camera-btn">카메라로 사진 찍기
          <input type="file" accept="image/*" capture="environment" onchange="handlePhotoUpload(event, ${mission.id})" />
        </label>
        <div id="photoPreviewArea" class="photo-preview-area"><p class="small-text">사진을 찍으면 이곳에 미리보기가 나타납니다.</p></div>
        <div id="photoDoneMessage"></div>
        <button class="primary-btn" id="completeMissionBtn" onclick="completeMission(${mission.id})" disabled>사건 해결 완료하기</button>
        <button class="secondary-btn" onclick="startMission(${mission.id})">퀴즈로 돌아가기</button>
      </div>
    </section>
  `;
}

function handlePhotoUpload(event, stationId) {
  const file = event.target.files[0];
  const previewArea = document.getElementById("photoPreviewArea");
  const completeBtn = document.getElementById("completeMissionBtn");
  const photoDoneMessage = document.getElementById("photoDoneMessage");

  if (!file) {
    currentPhotoData = null;
    completeBtn.disabled = true;
    photoDoneMessage.innerHTML = "";
    return;
  }

  resizeImageFile(file, PHOTO_MAX_WIDTH, PHOTO_JPEG_QUALITY)
    .then(function(resizedDataUrl) {
      currentPhotoData = resizedDataUrl;
      previewArea.innerHTML = `<div class="photo-confirm-box"><img src="${currentPhotoData}" alt="사진 미션 미리보기" /></div>`;
      photoDoneMessage.innerHTML = `
        <div class="photo-done-box pop">
          <div class="big-icon">🔎</div>
          <h2>증거 사진 확인 완료!</h2>
          <p>숲의 단서가 탐정 기록에 남았습니다.</p>
          <p class="small-text center">미션 완료 시 사진이 과학관 아카이브에 저장됩니다.</p>
        </div>
      `;
      completeBtn.disabled = false;
    })
    .catch(function() {
      currentPhotoData = null;
      completeBtn.disabled = true;
      photoDoneMessage.innerHTML = `<div class="warning-box">사진을 불러오지 못했습니다. 다시 촬영해주세요.</div>`;
    });
}

async function completeMission(stationId) {
  if (!currentPhotoData) return;

  const mission = MISSIONS.find(item => item.id === stationId);
  const progress = getProgress();
  const completeBtn = document.getElementById("completeMissionBtn");
  const photoDoneMessage = document.getElementById("photoDoneMessage");

  if (completeBtn) {
    completeBtn.disabled = true;
    completeBtn.textContent = "사진 저장 중...";
  }

  if (photoDoneMessage) {
    photoDoneMessage.innerHTML = `
      <div class="photo-done-box">
        <div class="big-icon">⏳</div>
        <h2>사진을 아카이브에 저장 중입니다</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    `;
  }

  const uploadResult = await uploadPhotoToDrive({
    imageBase64: currentPhotoData,
    missionId: mission.id,
    missionTitle: mission.title,
    teamName: progress.teamName || "미입력",
    createdAt: new Date().toISOString()
  });

  if (!uploadResult.ok) {
    if (photoDoneMessage) {
      photoDoneMessage.innerHTML = `
        <div class="warning-box">
          사진 저장 요청에 실패했습니다. 인터넷 연결을 확인한 뒤 다시 시도해주세요.
        </div>
      `;
    }
    if (completeBtn) {
      completeBtn.disabled = false;
      completeBtn.textContent = "사건 해결 완료하기";
    }
    return;
  }

  if (!progress.completed.includes(stationId)) progress.completed.push(stationId);
  progress.completed.sort((a, b) => a - b);

  progress.photoUploads = progress.photoUploads || {};
  progress.photoUploads[stationId] = {
    status: uploadResult.status || "sent",
    uploadedAt: formatDateTime(new Date())
  };

  if (progress.completed.length === MISSIONS.length && !progress.completedAt) {
    progress.completedAt = formatDateTime(new Date());
  }
  saveProgress(progress);

  if (isAllCompleted()) {
    renderFinalScreen();
    return;
  }
  renderMissionComplete(stationId);
}

function renderMissionComplete(stationId) {
  const mission = MISSIONS.find(item => item.id === stationId);
  const nextMission = getNextMission(stationId);

  app.innerHTML = `
    <section class="screen">
      ${renderProgressBlock()}
      <div class="case-card solved-card pop">
        <div class="big-icon">🕵️‍♀️</div>
        <div class="badge">사건 해결</div>
        <h1>${mission.title}</h1>
        <p class="desc">사건 기록이 저장되었습니다.</p>
        <div class="code-reveal">획득한 암호<strong>${mission.code}</strong></div>
        ${nextMission ? `
          <div class="next-box next-qr-box">
            <h2>다음 QR 안내</h2>
            <p>${mission.nextGuide}</p>
            <p class="next-title">다음 목표: ${nextMission.caseLabel} ${nextMission.title}</p>
            <p class="location-hint">📍 ${nextMission.zone} 주변에서 QR을 찾아보세요.</p>
          </div>
        ` : `
          <div class="next-box next-qr-box">
            <h2>모든 사건 해결 완료</h2>
            <p>최종 암호 화면을 캡쳐한 뒤 기념품 교환 시 보여주세요.</p>
          </div>
        `}
        <button class="primary-btn" onclick="${nextMission ? "goHome()" : "renderFinalScreen()"}">${nextMission ? "진행상황 보기" : "최종 암호 보기"}</button>
      </div>
    </section>
  `;
}

function renderFinalScreen() {
  const progress = getProgress();
  const finalCode = getFinalCode();

  if (!progress.completedAt) {
    progress.completedAt = formatDateTime(new Date());
    saveProgress(progress);
  }

  app.innerHTML = `
    <section class="screen">
      <div class="final-card pop">
        <div class="big-icon">🏅</div>
        <div class="badge">MISSION COMPLETE</div>
        <h1>탐정 임무 완료!</h1>
        <p class="desc">여름숲탐정본부의 모든 사건을 해결했습니다.</p>
        <div class="certificate-box">
          <p>오늘의 공식 숲 탐정</p>
          <strong>${escapeHtml(progress.teamName || "이름 없는 탐험대")}</strong>
        </div>
        <div class="final-code-box">최종 암호<strong>${finalCode}</strong></div>
        <div class="time-box">완료 시각<br /><strong>${progress.completedAt}</strong></div>
        <div class="staff-box">기념품 교환 시<br />이 화면을 보여주세요.</div>
        <p class="small-text center">화면을 캡쳐한 뒤, 기념품 교환 시 보여주세요.</p>
      </div>
    </section>
  `;
  launchConfetti();
}

function resizeImageFile(file, maxWidth, quality) {
  return new Promise(function(resolve, reject) {
    const reader = new FileReader();

    reader.onload = function(event) {
      const img = new Image();

      img.onload = function() {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.onerror = reject;
      img.src = event.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadPhotoToDrive(payload) {
  if (!PHOTO_UPLOAD_URL || PHOTO_UPLOAD_URL.includes("여기에")) {
    return { ok: false, message: "PHOTO_UPLOAD_URL이 설정되지 않았습니다." };
  }

  try {
    await fetch(PHOTO_UPLOAD_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    return { ok: true, status: "sent" };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

function goHome() {
  window.location.href = "index.html";
}

function resetProgressForTest() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = "index.html";
}

function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hour}:${minute}`;
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
    setTimeout(() => confetti.remove(), 1800);
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
