// =========================================================
// CONFIGURACIÓN GENERAL
// =========================================================

const STUDY_ID =
  "freefall_rq3_v1";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyajfaGwm7QccGyi6llNkjGnMV5cLZiZa80OqnUqaaZwiyJnITupEskXLc9X4CYtjI/exec";


// =========================================================
// PARTICIPANT ID
// =========================================================

// Mantiene el mismo ID si el participante recarga
// accidentalmente la pestaña durante esta sesión.

let participantId =
  sessionStorage.getItem(
    "rq3_participant_id"
  );

if (!participantId) {

  participantId =
    generateId();

  sessionStorage.setItem(
    "rq3_participant_id",
    participantId
  );
}


const BACKUP_KEY =
  "rq3_backup_" + participantId;


// =========================================================
// jsPsych
// =========================================================

const jsPsych = initJsPsych({

  // -------------------------------------------------------
  // Backup después de cada trial
  // -------------------------------------------------------

  on_data_update: function() {

    try {

      localStorage.setItem(
        BACKUP_KEY,
        jsPsych.data.get().json()
      );

    }

    catch (err) {

      console.warn(
        "Could not create local backup:",
        err
      );

    }
  },


  // -------------------------------------------------------
  // Cuando termina todo el estudio
  // -------------------------------------------------------

  on_finish: async function() {

    const payload = {

      study_id:
        STUDY_ID,

      participant_id:
        participantId,

      client_completed_at:
        new Date().toISOString(),

      user_agent:
        navigator.userAgent,

      trials:
        jsPsych.data.get().values()
    };


    // Backup final antes de intentar enviar

    localStorage.setItem(
      BACKUP_KEY,
      JSON.stringify(payload)
    );


    showSavingScreen();


    try {

      const result =
        await saveToDrive(payload);


      console.log(
        "Saved successfully:",
        result
      );


      // Ya sabemos que Drive confirmó recepción,
      // así que podemos borrar el backup.

      localStorage.removeItem(
        BACKUP_KEY
      );


      showSuccessScreen(
        result.filename
      );

    }

    catch (error) {

      console.error(
        "SAVE ERROR:",
        error
      );


      // NO borramos backup.
      // Permitimos intentar de nuevo.

      showErrorScreen(
        payload,
        error
      );

    }

  }

});


// =========================================================
// METADATOS GLOBALES
// =========================================================

jsPsych.data.addProperties({

  study_id:
    STUDY_ID,

  participant_id:
    participantId

});


// =========================================================
// TIMELINE
// =========================================================

const timeline = [];


// =========================================================
// INTRO
// =========================================================

timeline.push({

  type:
    jsPsychHtmlButtonResponse,

  stimulus: `

    <div class="study-block">

      <h2>
        Physical Foresight Study
      </h2>

      <p>
        You will see the final observed moment
        of a physical event.
      </p>

      <p>
        Predict what you expect the object
        to do next.
      </p>

    </div>
  `,

  choices: [
    "Start"
  ],

  data: {
    phase: "intro"
  }

});


// =========================================================
// ESTÍMULO PILOTO
// =========================================================

const stimulus = {

  clip_id:
    "pilot_release",

  anchor:
    "release",

  image:
    "stimuli/pilot_release.png",

  prompt:
    "A person holds a small solid object above a granite " +
    "countertop next to a vertical measuring ruler. " +
    "The person releases the object at the end of the " +
    "observed context."

};


// =========================================================
// WHAT
// =========================================================

timeline.push({

  type:
    jsPsychSurveyText,

  preamble: `

    <div class="trial-container">

      <p class="event-prompt">
        ${stimulus.prompt}
      </p>

      <img
        class="stimulus-image"
        src="${stimulus.image}"
        alt="Physical event"
      >

    </div>
  `,

  questions: [

    {

      prompt:
        "What do you expect the object to do " +
        "immediately after this moment?",

      placeholder:
        "Answer in one short sentence.",

      required:
        true,

      name:
        "what"

    }

  ],

  button_label:
    "Continue",

  data: {

    clip_id:
      stimulus.clip_id,

    anchor:
      stimulus.anchor,

    phase:
      "what"

  }

});


// =========================================================
// WHERE — TRAJECTORY
// =========================================================

timeline.push({

  type:
    jsPsychSketchpad,

  background_image:
    stimulus.image,


  // Dimensiones del canvas mostrado.
  // Guardamos estos valores también en los datos.

  canvas_width:
    700,

  canvas_height:
    390,


  stroke_width:
    4,

  stroke_color:
    "#00aa44",


  // Queremos las coordenadas.
  save_strokes:
    true,


  // NO necesitamos guardar otro PNG gigantesco.
  save_final_image:
    false,


  prompt: `

    <div class="trajectory-instructions">

      <p class="event-prompt">
        ${stimulus.prompt}
      </p>

      <p>
        <strong>
          Starting at the marked point,
          draw one continuous line showing
          the path you expect the CENTER
          of the object to follow.
        </strong>
      </p>

      <p>
        Stop when you expect the object
        to first contact the countertop.
      </p>

    </div>
  `,

  button_label:
    "Continue",

  data: {

    clip_id:
      stimulus.clip_id,

    anchor:
      stimulus.anchor,

    phase:
      "trajectory",

    canvas_width:
      700,

    canvas_height:
      390,

    stimulus_image:
      stimulus.image

  }

});
