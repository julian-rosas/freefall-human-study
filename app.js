// =========================================================
// WACV — HUMAN PHYSICAL FORESIGHT STUDY
// 24 frames total = 12 source videos x {release, impact}
// Every participant sees ALL 24 frames.
// =========================================================

const STUDY_ID = "freefall_rq3_v1";
const FRONTEND_VERSION = "wacv_all24_v1";

// Existing Google Apps Script deployment.
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyajfaGwm7QccGyi6llNkjGnMV5cLZiZa80OqnUqaaZwiyJnITupEskXLc9X4CYtjI/exec";

// =========================================================
// PARTICIPANT ID
// =========================================================

let participantId = sessionStorage.getItem("wacv_participant_id");

if (!participantId) {
  participantId = generateId();
  sessionStorage.setItem("wacv_participant_id", participantId);
}

const BACKUP_KEY = "wacv_backup_" + participantId;
const ORDER_KEY = "wacv_order_" + participantId;
const clientStartedAt = new Date().toISOString();

// =========================================================
// 12 SOURCE VIDEOS
// =========================================================

const SOURCES = [
  {
    source_id: "ball_take1_clip1",
    object: "ball",
    take: 1,
    clip_number: 1,
    base: "stimuli/freefall/ball/freefall_ball_1 (1)"
  },
  {
    source_id: "ball_take1_clip8",
    object: "ball",
    take: 1,
    clip_number: 8,
    base: "stimuli/freefall/ball/freefall_ball_1 (8)"
  },
  {
    source_id: "ball_take2_clip1",
    object: "ball",
    take: 2,
    clip_number: 1,
    base: "stimuli/freefall/ball/freefall_ball_2 (1)"
  },
  {
    source_id: "ball_take2_clip8",
    object: "ball",
    take: 2,
    clip_number: 8,
    base: "stimuli/freefall/ball/freefall_ball_2 (8)"
  },

  {
    source_id: "redcube_take1_clip1",
    object: "redcube",
    take: 1,
    clip_number: 1,
    base: "stimuli/freefall/redcube/freefall_redcube_1 (1)"
  },
  {
    source_id: "redcube_take1_clip3",
    object: "redcube",
    take: 1,
    clip_number: 3,
    base: "stimuli/freefall/redcube/freefall_redcube_1 (3)"
  },
  {
    source_id: "redcube_take2_clip1",
    object: "redcube",
    take: 2,
    clip_number: 1,
    base: "stimuli/freefall/redcube/freefall_redcube_2 (1)"
  },
  {
    source_id: "redcube_take2_clip3",
    object: "redcube",
    take: 2,
    clip_number: 3,
    base: "stimuli/freefall/redcube/freefall_redcube_2 (3)"
  },

  {
    source_id: "teetotum_take1_clip5",
    object: "teetotum",
    take: 1,
    clip_number: 5,
    base: "stimuli/freefall/teetotum/freefall_teetotum_1 (5)"
  },
  {
    source_id: "teetotum_take1_clip6",
    object: "teetotum",
    take: 1,
    clip_number: 6,
    base: "stimuli/freefall/teetotum/freefall_teetotum_1 (6)"
  },
  {
    source_id: "teetotum_take2_clip5",
    object: "teetotum",
    take: 2,
    clip_number: 5,
    base: "stimuli/freefall/teetotum/freefall_teetotum_2 (5)"
  },
  {
    source_id: "teetotum_take2_clip6",
    object: "teetotum",
    take: 2,
    clip_number: 6,
    base: "stimuli/freefall/teetotum/freefall_teetotum_2 (6)"
  }
];

// =========================================================
// PROMPTS
// =========================================================

const ANCHOR_PROMPTS = {
  release:
    "A person holds a small solid object above a granite countertop next to a vertical measuring ruler. " +
    "The person releases the object at the end of the observed context.",

  impact:
    "A small solid object and a vertical measuring ruler are visible above a granite countertop. " +
    "The object makes initial contact with the countertop at the end of the observed context."
};

function makeStimulus(source, anchor) {
  return {
    source_id: source.source_id,
    clip_id: `${source.source_id}__${anchor}`,
    object: source.object,
    take: source.take,
    clip_number: source.clip_number,
    anchor: anchor,
    image: `${source.base}__${anchor}/last_frame.png`,
    prompt: ANCHOR_PROMPTS[anchor]
  };
}

const ALL_24_STIMULI = SOURCES.flatMap(source => [
  makeStimulus(source, "release"),
  makeStimulus(source, "impact")
]);

if (ALL_24_STIMULI.length !== 24) {
  throw new Error(`Expected 24 stimuli, found ${ALL_24_STIMULI.length}.`);
}

// =========================================================
// ORDER
// =========================================================
// Every participant sees all 24 frames.
// The order is randomized once and stored in sessionStorage so
// an accidental refresh does not generate a different ordering.
// We also avoid putting release and impact from the same source
// immediately next to each other when possible.
// =========================================================

function getAssignedStimuli() {
  const byId = new Map(ALL_24_STIMULI.map(s => [s.clip_id, s]));

  try {
    const saved = JSON.parse(sessionStorage.getItem(ORDER_KEY));

    if (
      Array.isArray(saved) &&
      saved.length === 24 &&
      new Set(saved).size === 24 &&
      saved.every(id => byId.has(id))
    ) {
      return saved.map(id => byId.get(id));
    }
  } catch (err) {
    console.warn("Could not restore saved stimulus order:", err);
  }

  let shuffled = null;

  for (let attempt = 0; attempt < 500; attempt++) {
    const candidate = fisherYatesShuffle([...ALL_24_STIMULI]);

    const hasAdjacentPair = candidate.some((s, i) =>
      i > 0 && candidate[i - 1].source_id === s.source_id
    );

    if (!hasAdjacentPair) {
      shuffled = candidate;
      break;
    }
  }

  if (!shuffled) {
    shuffled = fisherYatesShuffle([...ALL_24_STIMULI]);
  }

  try {
    sessionStorage.setItem(
      ORDER_KEY,
      JSON.stringify(shuffled.map(s => s.clip_id))
    );
  } catch (err) {
    console.warn("Could not save stimulus order:", err);
  }

  return shuffled;
}

const assignedStimuli = getAssignedStimuli();

// =========================================================
// jsPsych
// =========================================================

const jsPsych = initJsPsych({
  on_data_update: function () {
    try {
      localStorage.setItem(BACKUP_KEY, jsPsych.data.get().json());
    } catch (err) {
      console.warn("Could not create local backup:", err);
    }
  },

  on_finish: async function () {
    const rawTrials = jsPsych.data.get().values();

    const payload = {
      study_id: STUDY_ID,
      frontend_version: FRONTEND_VERSION,
      participant_id: participantId,
      client_started_at: clientStartedAt,
      client_completed_at: new Date().toISOString(),
      user_agent: navigator.userAgent,

      assigned_stimuli: assignedStimuli.map((s, idx) => ({
        order: idx + 1,
        source_id: s.source_id,
        clip_id: s.clip_id,
        object: s.object,
        take: s.take,
        clip_number: s.clip_number,
        anchor: s.anchor,
        image: s.image
      })),

      responses: buildStructuredResponses(rawTrials, assignedStimuli),
      raw_trials: rawTrials
    };

    // Final local backup before sending.
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn("Could not save final local backup:", err);
    }

    showSavingScreen();

    try {
      const result = await saveToDrive(payload);
      console.log("Saved successfully:", result);

      localStorage.removeItem(BACKUP_KEY);
      showSuccessScreen();
    } catch (error) {
      console.error("SAVE ERROR:", error);
      showErrorScreen(payload, error);
    }
  }
});

jsPsych.data.addProperties({
  study_id: STUDY_ID,
  frontend_version: FRONTEND_VERSION,
  participant_id: participantId
});

// =========================================================
// TIMELINE
// =========================================================

const timeline = [];

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="study-block">
      <h2>Physical Foresight Study</h2>
      <p>You will see <strong>24 images</strong>, one at a time.</p>
      <p>For each image:</p>
      <p>1. Describe what you expect the object to do next.</p>
      <p>2. Draw the path you expect the center of the object to follow.</p>
      <p>3. Rate how confident you are in your prediction.</p>
      <p>Please respond based only on the image currently shown.</p>
    </div>
  `,
  choices: ["Start"],
  data: { phase: "intro" }
});

assignedStimuli.forEach((stimulus, stimulusIndex) => {
  const trialNumber = stimulusIndex + 1;
  const totalTrials = assignedStimuli.length;
  const imageUrl = encodeURI(stimulus.image);

  // -------------------------------------------------------
  // 1) WHAT
  // -------------------------------------------------------

  timeline.push({
    type: jsPsychSurveyText,
    preamble: `
      <div class="trial-container">
        <p class="trial-progress">Event ${trialNumber} of ${totalTrials}</p>
        <p class="event-prompt">${stimulus.prompt}</p>
        <img
          class="stimulus-image"
          src="${imageUrl}"
          alt="Physical event"
        >
      </div>
    `,
    questions: [
      {
        prompt: "What do you expect the object to do immediately after this moment?",
        placeholder: "Answer in one short sentence.",
        required: true,
        name: "what"
      }
    ],
    button_label: "Continue",
    data: trialMetadata(stimulus, stimulusIndex, "what")
  });

  // -------------------------------------------------------
  // 2) WHERE — TRAJECTORY
  // -------------------------------------------------------

  const trajectoryInstruction = stimulus.anchor === "release"
    ? `
        <p>
          <strong>
            Starting at the marked point, draw one continuous line showing
            the path you expect the CENTER of the object to follow.
          </strong>
        </p>
        <p>
          Stop when you expect the object to first contact the countertop.
        </p>
      `
    : `
        <p>
          <strong>
            Starting at the marked point, draw the immediate path you expect
            the CENTER of the object to follow after contact.
          </strong>
        </p>
        <p>
          Stop at the first highest point, or when you expect its initial
          post-contact motion to end.
        </p>
        <p>
          If you expect essentially no motion, click/tap the marked starting
          point without drawing a long path.
        </p>
      `;

  timeline.push({
    type: jsPsychSketchpad,
    background_image: imageUrl,
    canvas_width: 700,
    canvas_height: 390,
    stroke_width: 4,
    stroke_color: "#00aa44",
    save_strokes: true,
    save_final_image: false,
    prompt: `
      <div class="trajectory-instructions">
        <p class="trial-progress">Event ${trialNumber} of ${totalTrials}</p>
        <p class="event-prompt">${stimulus.prompt}</p>
        ${trajectoryInstruction}
      </div>
    `,
    button_label: "Continue",
    data: {
      ...trialMetadata(stimulus, stimulusIndex, "trajectory"),
      canvas_width: 700,
      canvas_height: 390,
      stimulus_image: stimulus.image
    }
  });

  // -------------------------------------------------------
  // 3) CONFIDENCE
  // -------------------------------------------------------

  timeline.push({
    type: jsPsychSurveyLikert,
    preamble: `
      <div class="trial-container">
        <p class="trial-progress">Event ${trialNumber} of ${totalTrials}</p>
        <p>How confident are you in the prediction you just made?</p>
      </div>
    `,
    questions: [
      {
        prompt: "Confidence",
        labels: [
          "1 - Not confident",
          "2",
          "3",
          "4",
          "5 - Very confident"
        ],
        required: true,
        name: "confidence"
      }
    ],
    button_label: trialNumber === totalTrials ? "Finish study" : "Next event",
    data: trialMetadata(stimulus, stimulusIndex, "confidence"),
    on_finish: function (data) {
      const raw = data.response.confidence;

      if (raw !== null && raw !== undefined) {
        data.confidence_raw_index = raw;
        data.confidence_1to5 = raw + 1;
        data.response.confidence = raw + 1;
      }
    }
  });
});

jsPsych.run(timeline);

// =========================================================
// STRUCTURED JSON
// =========================================================

function trialMetadata(stimulus, stimulusIndex, phase) {
  return {
    stimulus_index: stimulusIndex,
    stimulus_order: stimulusIndex + 1,
    source_id: stimulus.source_id,
    clip_id: stimulus.clip_id,
    object: stimulus.object,
    take: stimulus.take,
    clip_number: stimulus.clip_number,
    anchor: stimulus.anchor,
    phase: phase,
    stimulus_image: stimulus.image
  };
}

function buildStructuredResponses(rawTrials, stimuli) {
  return stimuli.map((stimulus, index) => {
    const matches = rawTrials.filter(
      row => row.clip_id === stimulus.clip_id
    );

    const whatTrial = matches.find(row => row.phase === "what");
    const trajectoryTrial = matches.find(row => row.phase === "trajectory");
    const confidenceTrial = matches.find(row => row.phase === "confidence");

    return {
      stimulus_order: index + 1,
      source_id: stimulus.source_id,
      clip_id: stimulus.clip_id,
      object: stimulus.object,
      take: stimulus.take,
      clip_number: stimulus.clip_number,
      anchor: stimulus.anchor,
      image: stimulus.image,

      what:
        whatTrial?.response?.what ?? null,
      what_rt_ms:
        whatTrial?.rt ?? null,

      trajectory_strokes:
        trajectoryTrial?.strokes ?? null,
      trajectory_rt_ms:
        trajectoryTrial?.rt ?? null,
      canvas_width:
        trajectoryTrial?.canvas_width ?? 700,
      canvas_height:
        trajectoryTrial?.canvas_height ?? 390,

      confidence_1to5:
        confidenceTrial?.confidence_1to5 ??
        confidenceTrial?.response?.confidence ??
        null,
      confidence_rt_ms:
        confidenceTrial?.rt ?? null
    };
  });
}

// =========================================================
// GOOGLE DRIVE SAVE
// =========================================================

function saveToDrive(payload) {
  return new Promise(function (resolve, reject) {
    const nonce = generateId();
    payload.save_nonce = nonce;

    const iframe = document.getElementById("save_target");
    const form = document.getElementById("save_form");
    const payloadInput = document.getElementById("save_payload");
    const nonceInput = document.getElementById("save_nonce");

    if (!iframe || !form || !payloadInput || !nonceInput) {
      reject(new Error("Save form or iframe is missing from index.html."));
      return;
    }

    let finished = false;
    let timeoutId = null;

    function cleanup() {
      window.removeEventListener("message", messageHandler);
      if (timeoutId !== null) clearTimeout(timeoutId);
    }

    function messageHandler(event) {
      if (event.source !== iframe.contentWindow) return;

      const message = event.data;
      if (!message || message.type !== "wm-save-result") return;
      if (message.nonce !== nonce) return;

      finished = true;
      cleanup();

      if (message.ok) {
        resolve(message);
      } else {
        reject(new Error(message.error || "Unknown server error"));
      }
    }

    window.addEventListener("message", messageHandler);

    form.action = SCRIPT_URL;
    payloadInput.value = JSON.stringify(payload);
    nonceInput.value = nonce;

    timeoutId = setTimeout(function () {
      if (finished) return;
      cleanup();
      reject(new Error("The server did not confirm the save within 25 seconds."));
    }, 25000);

    form.submit();
  });
}

// =========================================================
// STATUS SCREENS
// =========================================================

function showStatusScreen(html) {
  const jsPsychContent = document.querySelector(".jspsych-content-wrapper");
  if (jsPsychContent) jsPsychContent.style.display = "none";

  const previous = document.getElementById("wacv-status-screen");
  if (previous) previous.remove();

  const container = document.createElement("div");
  container.id = "wacv-status-screen";
  container.className = "status-screen";
  container.innerHTML = html;

  document.body.appendChild(container);
}

function showSavingScreen() {
  showStatusScreen(`
    <h2>Saving responses...</h2>
    <p>Please do not close this page.</p>
  `);
}

function showSuccessScreen() {
  showStatusScreen(`
    <h2>Thank you!</h2>
    <p>Your responses were saved successfully.</p>
    <p class="small-text">
      Participant ID: ${escapeHtml(participantId)}
    </p>
  `);
}

function showErrorScreen(payload, error) {
  showStatusScreen(`
    <h2>We could not confirm your submission.</h2>
    <p>Your responses are still stored locally in this browser.</p>
    <p>Please try submitting again.</p>
    <button id="retry-save" class="retry-button">Try again</button>
    <p class="small-text">${escapeHtml(error.message)}</p>
  `);

  document
    .getElementById("retry-save")
    .addEventListener("click", async function () {
      showSavingScreen();

      try {
        const result = await saveToDrive(payload);
        console.log("Saved successfully after retry:", result);
        localStorage.removeItem(BACKUP_KEY);
        showSuccessScreen();
      } catch (secondError) {
        console.error("Retry failed:", secondError);
        showErrorScreen(payload, secondError);
      }
    });
}

// =========================================================
// HELPERS
// =========================================================

function generateId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return (
    "id_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2)
  );
}

function fisherYatesShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
