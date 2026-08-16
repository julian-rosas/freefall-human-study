// =========================================================
// CONFIGURACIÓN GENERAL
// =========================================================

const STUDY_ID = "freefall_rq3_v1";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyajfaGwm7QccGyi6llNkjGnMV5cLZiZa80OqnUqaaZwiyJnITupEskXLc9X4CYtjI/exec";


// =========================================================
// PARTICIPANT ID
// =========================================================

// Conservamos el mismo ID si la persona recarga
// accidentalmente durante la sesión.

let participantId =
  sessionStorage.getItem("rq3_participant_id");

if (!participantId) {

  participantId = generateId();

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
  // Crear backup después de cada trial
  // -------------------------------------------------------

  on_data_update: function () {

    try {

      localStorage.setItem(
        BACKUP_KEY,
        jsPsych.data.get().json()
      );

    } catch (err) {

      console.warn(
        "Could not create local backup:",
        err
      );
    }
  },


  // -------------------------------------------------------
  // Cuando termina todo el experimento
  // -------------------------------------------------------

  on_finish: async function () {

    const payload = {

      study_id: STUDY_ID,

      participant_id: participantId,

      client_completed_at:
        new Date().toISOString(),

      user_agent:
        navigator.userAgent,

      trials:
        jsPsych.data.get().values()
    };


    // Backup final antes de enviar

    try {

      localStorage.setItem(
        BACKUP_KEY,
        JSON.stringify(payload)
      );

    } catch (err) {

      console.warn(
        "Could not save final local backup:",
        err
      );
    }


    showSavingScreen();


    try {

      const result =
        await saveToDrive(payload);


      console.log(
        "Saved successfully:",
        result
      );


      // Drive confirmó el guardado.
      // Ya podemos borrar el backup local.

      localStorage.removeItem(
        BACKUP_KEY
      );


      showSuccessScreen();

    } catch (error) {

      console.error(
        "SAVE ERROR:",
        error
      );


      // NO borramos el backup.
      // Permitimos volver a intentar.

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


  // Canvas mostrado al participante

  canvas_width:
    700,

  canvas_height:
    390,


  stroke_width:
    4,

  stroke_color:
    "#00aa44",


  // Guardar las coordenadas del trazo

  save_strokes:
    true,


  // No necesitamos guardar otro PNG

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


// =========================================================
// CONFIDENCE
// =========================================================

timeline.push({

  type:
    jsPsychSurveyLikert,

  questions: [

    {

      prompt:
        "How confident are you in your prediction?",

      labels: [

        "1 - Not confident",

        "2",

        "3",

        "4",

        "5 - Very confident"

      ],

      required:
        true,

      name:
        "confidence"

    }

  ],

  button_label:
    "Submit",

  data: {

    clip_id:
      stimulus.clip_id,

    anchor:
      stimulus.anchor,

    phase:
      "confidence"

  },


  // -------------------------------------------------------
  // jsPsych internamente devuelve:
  //
  // 0 1 2 3 4
  //
  // Nosotros queremos:
  //
  // 1 2 3 4 5
  // -------------------------------------------------------

  on_finish: function (data) {

    const raw =
      data.response.confidence;


    if (
      raw !== null &&
      raw !== undefined
    ) {

      // Conservamos el índice original
      // por trazabilidad.

      data.confidence_raw_index =
        raw;


      // Valor científico en escala 1–5.

      data.confidence_1to5 =
        raw + 1;


      // También hacemos que la respuesta
      // principal sea directamente 1–5.

      data.response.confidence =
        raw + 1;
    }
  }

});


// =========================================================
// EJECUTAR ESTUDIO
// =========================================================

jsPsych.run(timeline);


// =========================================================
// GUARDAR EN GOOGLE DRIVE
// =========================================================

function saveToDrive(payload) {

  return new Promise(
    function (resolve, reject) {

      const nonce =
        generateId();


      // También ponemos el nonce dentro
      // del JSON para trazabilidad.

      payload.save_nonce =
        nonce;


      const iframe =
        document.getElementById(
          "save_target"
        );

      const form =
        document.getElementById(
          "save_form"
        );

      const payloadInput =
        document.getElementById(
          "save_payload"
        );

      const nonceInput =
        document.getElementById(
          "save_nonce"
        );


      // Comprobación por si faltara algo
      // en index.html.

      if (
        !iframe ||
        !form ||
        !payloadInput ||
        !nonceInput
      ) {

        reject(
          new Error(
            "Save form or iframe is missing from index.html."
          )
        );

        return;
      }


      let finished =
        false;

      let timeoutId =
        null;


      // ---------------------------------------------------
      // Limpiar listener y timeout
      // ---------------------------------------------------

      function cleanup() {

        window.removeEventListener(
          "message",
          messageHandler
        );

        if (timeoutId !== null) {

          clearTimeout(
            timeoutId
          );
        }
      }


      // ---------------------------------------------------
      // Apps Script responde dentro del iframe.
      // Esta función escucha esa confirmación.
      // ---------------------------------------------------

      function messageHandler(event) {

        // Solo aceptamos mensajes provenientes
        // de nuestro iframe de guardado.

        if (
          event.source !==
          iframe.contentWindow
        ) {
          return;
        }


        const message =
          event.data;


        if (
          !message ||
          message.type !==
            "wm-save-result"
        ) {
          return;
        }


        // Debe corresponder exactamente
        // a esta petición.

        if (
          message.nonce !==
          nonce
        ) {
          return;
        }


        finished =
          true;


        cleanup();


        if (message.ok) {

          resolve(message);

        } else {

          reject(
            new Error(
              message.error ||
              "Unknown server error"
            )
          );
        }
      }


      window.addEventListener(
        "message",
        messageHandler
      );


      // ---------------------------------------------------
      // Preparar POST
      // ---------------------------------------------------

      form.action =
        SCRIPT_URL;


      payloadInput.value =
        JSON.stringify(payload);


      nonceInput.value =
        nonce;


      // ---------------------------------------------------
      // Timeout
      // ---------------------------------------------------

      timeoutId =
        setTimeout(
          function () {

            if (finished) {
              return;
            }


            cleanup();


            reject(
              new Error(
                "The server did not confirm the save within 25 seconds."
              )
            );

          },

          25000
        );


      // ---------------------------------------------------
      // Enviar
      // ---------------------------------------------------

      form.submit();

    }
  );
}


// =========================================================
// PANTALLAS DE ESTADO
// =========================================================

// IMPORTANTE:
// No usamos document.body.innerHTML aquí,
// porque eliminaría el iframe y el formulario
// necesarios para comunicarnos con Apps Script.

function showStatusScreen(html) {

  // Ocultar contenido anterior de jsPsych.

  const jsPsychContent =
    document.querySelector(
      ".jspsych-content-wrapper"
    );

  if (jsPsychContent) {

    jsPsychContent.style.display =
      "none";
  }


  // Eliminar pantalla de estado anterior.

  const previous =
    document.getElementById(
      "rq3-status-screen"
    );

  if (previous) {

    previous.remove();
  }


  // Crear nueva pantalla.

  const container =
    document.createElement("div");

  container.id =
    "rq3-status-screen";

  container.className =
    "status-screen";

  container.innerHTML =
    html;


  document.body.appendChild(
    container
  );
}


// =========================================================
// GUARDANDO
// =========================================================

function showSavingScreen() {

  showStatusScreen(`

    <h2>
      Saving responses...
    </h2>

    <p>
      Please do not close this page.
    </p>

  `);
}


// =========================================================
// ÉXITO
// =========================================================

function showSuccessScreen() {

  showStatusScreen(`

    <h2>
      Thank you!
    </h2>

    <p>
      Your responses were saved successfully.
    </p>

    <p class="small-text">
      Participant ID:
      ${escapeHtml(participantId)}
    </p>

  `);
}


// =========================================================
// ERROR + RETRY
// =========================================================

function showErrorScreen(
  payload,
  error
) {

  showStatusScreen(`

    <h2>
      We could not confirm your submission.
    </h2>

    <p>
      Your responses are still stored
      locally in this browser.
    </p>

    <p>
      Please try submitting again.
    </p>

    <button
      id="retry-save"
      class="retry-button"
    >
      Try again
    </button>

    <p class="small-text">
      ${escapeHtml(error.message)}
    </p>

  `);


  document
    .getElementById(
      "retry-save"
    )
    .addEventListener(
      "click",
      async function () {

        showSavingScreen();


        try {

          const result =
            await saveToDrive(
              payload
            );


          console.log(
            "Saved successfully after retry:",
            result
          );


          localStorage.removeItem(
            BACKUP_KEY
          );


          showSuccessScreen();

        } catch (secondError) {

          console.error(
            "Retry failed:",
            secondError
          );


          showErrorScreen(
            payload,
            secondError
          );
        }
      }
    );
}


// =========================================================
// GENERAR ID
// =========================================================

function generateId() {

  if (
    window.crypto &&
    crypto.randomUUID
  ) {

    return crypto.randomUUID();
  }


  return (
    "id_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2)
  );
}


// =========================================================
// ESCAPAR HTML
// =========================================================

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}
