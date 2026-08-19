// =========================================================
// WACV — ESTUDIO DE PREDICCIÓN FÍSICA HUMANA
// 24 frames = 12 videos fuente x {release, impact}
// Cada participante ve los 24 frames.
// =========================================================

const STUDY_ID =
  "freefall_rq3_v1";

const FRONTEND_VERSION =
  "wacv_all24_v5_es_ack";


const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyajfaGwm7QccGyi6llNkjGnMV5cLZiZa80OqnUqaaZwiyJnITupEskXLc9X4CYtjI/exec";


// =========================================================
// ID DEL PARTICIPANTE
// =========================================================

let participantId =
  sessionStorage.getItem(
    "wacv_participant_id"
  );


if (!participantId) {

  participantId =
    generateId();


  sessionStorage.setItem(
    "wacv_participant_id",
    participantId
  );

}


const BACKUP_KEY =
  "wacv_backup_" +
  participantId;


const ORDER_KEY =
  "wacv_order_" +
  participantId;


const clientStartedAt =
  new Date().toISOString();


// =========================================================
// 12 VIDEOS FUENTE
// =========================================================

const SOURCES = [

  {
    source_id:
      "ball_take1_clip1",

    object:
      "ball",

    take:
      1,

    clip_number:
      1,

    base:
      "stimuli/freefall/ball/freefall_ball_1 (1)"
  },


  {
    source_id:
      "ball_take1_clip8",

    object:
      "ball",

    take:
      1,

    clip_number:
      8,

    base:
      "stimuli/freefall/ball/freefall_ball_1 (8)"
  },


  {
    source_id:
      "ball_take2_clip1",

    object:
      "ball",

    take:
      2,

    clip_number:
      1,

    base:
      "stimuli/freefall/ball/freefall_ball_2 (1)"
  },


  {
    source_id:
      "ball_take2_clip8",

    object:
      "ball",

    take:
      2,

    clip_number:
      8,

    base:
      "stimuli/freefall/ball/freefall_ball_2 (8)"
  },


  {
    source_id:
      "redcube_take1_clip1",

    object:
      "redcube",

    take:
      1,

    clip_number:
      1,

    base:
      "stimuli/freefall/redcube/freefall_redcube_1 (1)"
  },


  {
    source_id:
      "redcube_take1_clip3",

    object:
      "redcube",

    take:
      1,

    clip_number:
      3,

    base:
      "stimuli/freefall/redcube/freefall_redcube_1 (3)"
  },


  {
    source_id:
      "redcube_take2_clip1",

    object:
      "redcube",

    take:
      2,

    clip_number:
      1,

    base:
      "stimuli/freefall/redcube/freefall_redcube_2 (1)"
  },


  {
    source_id:
      "redcube_take2_clip3",

    object:
      "redcube",

    take:
      2,

    clip_number:
      3,

    base:
      "stimuli/freefall/redcube/freefall_redcube_2 (3)"
  },


  {
    source_id:
      "teetotum_take1_clip5",

    object:
      "teetotum",

    take:
      1,

    clip_number:
      5,

    base:
      "stimuli/freefall/teetotum/freefall_teetotum_1 (5)"
  },


  {
    source_id:
      "teetotum_take1_clip6",

    object:
      "teetotum",

    take:
      1,

    clip_number:
      6,

    base:
      "stimuli/freefall/teetotum/freefall_teetotum_1 (6)"
  },


  {
    source_id:
      "teetotum_take2_clip5",

    object:
      "teetotum",

    take:
      2,

    clip_number:
      5,

    base:
      "stimuli/freefall/teetotum/freefall_teetotum_2 (5)"
  },


  {
    source_id:
      "teetotum_take2_clip6",

    object:
      "teetotum",

    take:
      2,

    clip_number:
      6,

    base:
      "stimuli/freefall/teetotum/freefall_teetotum_2 (6)"
  }

];


// =========================================================
// PROMPTS
//
// SE MANTIENEN EN INGLÉS INTENCIONALMENTE.
// Son los mismos prompts que queremos conservar para
// comparabilidad con los modelos.
// =========================================================

const ANCHOR_PROMPTS = {

  release:

    "A person holds a small solid object above a granite countertop next to a vertical measuring ruler. " +

    "The person releases the object at the end of the observed context.",


  impact:

    "A small solid object and a vertical measuring ruler are visible above a granite countertop. " +

    "The object makes initial contact with the countertop at the end of the observed context."

};


// =========================================================
// CONSTRUIR ESTÍMULO
// =========================================================

function makeStimulus(
  source,
  anchor
) {

  return {

    source_id:
      source.source_id,


    clip_id:
      `${source.source_id}__${anchor}`,


    object:
      source.object,


    take:
      source.take,


    clip_number:
      source.clip_number,


    anchor:
      anchor,


    image:
      `${source.base}__${anchor}/last_frame.png`,


    prompt:
      ANCHOR_PROMPTS[
        anchor
      ]

  };

}


// =========================================================
// 24 ESTÍMULOS
// =========================================================

const ALL_24_STIMULI =
  SOURCES.flatMap(

    source => [

      makeStimulus(
        source,
        "release"
      ),

      makeStimulus(
        source,
        "impact"
      )

    ]

  );


if (
  ALL_24_STIMULI.length !==
  24
) {

  throw new Error(
    `Se esperaban 24 estímulos, pero se encontraron ${ALL_24_STIMULI.length}.`
  );

}


// =========================================================
// ORDEN ALEATORIO
// =========================================================

function getAssignedStimuli() {

  const byId =
    new Map(

      ALL_24_STIMULI.map(

        s => [
          s.clip_id,
          s
        ]

      )

    );


  // -------------------------------------------------------
  // Restaurar el mismo orden si la página se recarga
  // durante esta sesión.
  // -------------------------------------------------------

  try {

    const saved =
      JSON.parse(

        sessionStorage.getItem(
          ORDER_KEY
        )

      );


    if (

      Array.isArray(
        saved
      ) &&

      saved.length ===
        24 &&

      new Set(
        saved
      ).size ===
        24 &&

      saved.every(
        id =>
          byId.has(id)
      )

    ) {

      return saved.map(
        id =>
          byId.get(id)
      );

    }

  }

  catch (err) {

    console.warn(
      "No se pudo restaurar el orden de los estímulos:",
      err
    );

  }


  let shuffled =
    null;


  // -------------------------------------------------------
  // Intentamos evitar que release e impact del mismo video
  // queden inmediatamente juntos.
  // -------------------------------------------------------

  for (
    let attempt = 0;
    attempt < 500;
    attempt++
  ) {

    const candidate =
      fisherYatesShuffle(
        [
          ...ALL_24_STIMULI
        ]
      );


    const hasAdjacentPair =
      candidate.some(

        (
          stimulus,
          index
        ) =>

          index > 0 &&

          candidate[
            index - 1
          ].source_id ===
          stimulus.source_id

      );


    if (
      !hasAdjacentPair
    ) {

      shuffled =
        candidate;

      break;

    }

  }


  if (
    !shuffled
  ) {

    shuffled =
      fisherYatesShuffle(
        [
          ...ALL_24_STIMULI
        ]
      );

  }


  try {

    sessionStorage.setItem(

      ORDER_KEY,

      JSON.stringify(

        shuffled.map(
          s =>
            s.clip_id
        )

      )

    );

  }

  catch (err) {

    console.warn(
      "No se pudo guardar el orden de los estímulos:",
      err
    );

  }


  return shuffled;

}


const assignedStimuli =
  getAssignedStimuli();


// =========================================================
// jsPsych
// =========================================================

const jsPsych =
  initJsPsych({

    // -----------------------------------------------------
    // Backup local después de cada pantalla
    // -----------------------------------------------------

    on_data_update:
      function () {

        try {

          localStorage.setItem(

            BACKUP_KEY,

            jsPsych
              .data
              .get()
              .json()

          );

        }

        catch (err) {

          console.warn(
            "No se pudo crear el respaldo local:",
            err
          );

        }

      },


    // -----------------------------------------------------
    // FINAL DEL ESTUDIO
    // -----------------------------------------------------

    on_finish:
      async function () {

        const rawTrials =
          jsPsych
            .data
            .get()
            .values();


        const structuredResponses =
          buildStructuredResponses(
            rawTrials,
            assignedStimuli
          );


        const nCompleted =
          structuredResponses.filter(

            response =>

              response.what !==
                null &&

              response.trajectory_strokes !==
                null &&

              response.confidence_1to5 !==
                null

          ).length;


        const payload = {

          study_id:
            STUDY_ID,


          frontend_version:
            FRONTEND_VERSION,


          participant_id:
            participantId,


          client_started_at:
            clientStartedAt,


          client_completed_at:
            new Date().toISOString(),


          user_agent:
            navigator.userAgent,


          n_expected_stimuli:
            24,


          n_completed_stimuli:
            nCompleted,


          completed:
            nCompleted === 24,


          assigned_stimuli:

            assignedStimuli.map(

              (
                stimulus,
                index
              ) => ({

                order:
                  index + 1,


                source_id:
                  stimulus.source_id,


                clip_id:
                  stimulus.clip_id,


                object:
                  stimulus.object,


                take:
                  stimulus.take,


                clip_number:
                  stimulus.clip_number,


                anchor:
                  stimulus.anchor,


                image:
                  stimulus.image

              })

            ),


          responses:
            structuredResponses,


          raw_trials:
            rawTrials

        };


        // -------------------------------------------------
        // Backup final antes del POST
        // -------------------------------------------------

        try {

          localStorage.setItem(

            BACKUP_KEY,

            JSON.stringify(
              payload
            )

          );

        }

        catch (err) {

          console.warn(
            "No se pudo guardar el respaldo final:",
            err
          );

        }


        showSavingScreen();


        try {

          const result =
            await saveToDrive(
              payload
            );


          console.log(
            "✅ Guardado y confirmado por el servidor:",
            result
          );


          localStorage.removeItem(
            BACKUP_KEY
          );


          showSuccessScreen(
            result
          );

        }

        catch (error) {

          console.error(
            "❌ ERROR AL GUARDAR O CONFIRMAR:",
            error
          );


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


  frontend_version:
    FRONTEND_VERSION,


  participant_id:
    participantId

});


// =========================================================
// TIMELINE
// =========================================================

const timeline =
  [];


// =========================================================
// INTRODUCCIÓN
// =========================================================

timeline.push({

  type:
    jsPsychHtmlButtonResponse,


  stimulus: `

    <div class="study-block">

      <h2>
        Estudio de predicción física
      </h2>


      <p>
        Verás
        <strong>
          24 imágenes
        </strong>,
        una a la vez.
      </p>


      <p>
        Para cada imagen deberás:
      </p>


      <p>
        1. Describir qué crees que hará
        el objeto a continuación.
      </p>


      <p>
        2. Dibujar la trayectoria que
        esperas que siga el centro del objeto.
      </p>


      <p>
        3. Indicar qué tan seguro/a estás
        de tu predicción.
      </p>


      <p>
        Responde únicamente con base
        en la imagen mostrada en ese momento.
      </p>

    </div>

  `,


  choices: [
    "Comenzar"
  ],


  data: {
    phase:
      "intro"
  }

});


// =========================================================
// LOS 24 EVENTOS
// =========================================================

assignedStimuli.forEach(

  (
    stimulus,
    stimulusIndex
  ) => {


    const trialNumber =
      stimulusIndex + 1;


    const totalTrials =
      assignedStimuli.length;


    const imageUrl =
      encodeURI(
        stimulus.image
      );


    // =====================================================
    // 1. WHAT
    // =====================================================

    timeline.push({

      type:
        jsPsychSurveyText,


      preamble: `

        <div class="trial-container">

          <p class="trial-progress">
            Evento ${trialNumber}
            de ${totalTrials}
          </p>


          <p class="event-prompt">
            ${stimulus.prompt}
          </p>


          <img
            class="stimulus-image"
            src="${imageUrl}"
            alt="Evento físico"
          >

        </div>

      `,


      questions: [

        {

          prompt:
            "¿Qué esperas que haga el objeto inmediatamente después de este momento?",


          placeholder:
            "Responde en una oración breve.",


          required:
            true,


          name:
            "what"

        }

      ],


      button_label:
        "Continuar",


      data:
        trialMetadata(
          stimulus,
          stimulusIndex,
          "what"
        )

    });


    // =====================================================
    // 2. WHERE — TRAYECTORIA
    // =====================================================

    const trajectoryInstruction =

      stimulus.anchor ===
      "release"

        ? `

          <p>

            <strong>

              Comenzando desde el centro del objeto
              que aparece sujetado en la imagen,
              dibuja una sola línea continua que muestre
              la trayectoria que esperas que siga
              el CENTRO del objeto.

            </strong>

          </p>


          <p>

            Termina la línea cuando esperes que
            el objeto haga contacto por primera vez
            con la superficie.

          </p>

        `

        : `

          <p>

            <strong>

              Comenzando desde el centro del objeto
              que aparece en contacto con la superficie,
              dibuja una sola línea continua que muestre
              la trayectoria inmediata que esperas que siga
              el CENTRO del objeto después del impacto.

            </strong>

          </p>


          <p>

            Termina la línea en el primer punto
            más alto que esperes que alcance el objeto,
            o cuando consideres que terminó
            su movimiento inicial después del impacto.

          </p>


          <p>

            Si esperas que prácticamente no haya
            movimiento después del impacto,
            haz un clic o un trazo muy corto
            en el centro del objeto.

          </p>

        `;


    timeline.push({

      type:
        jsPsychSketchpad,


      background_image:
        imageUrl,


      canvas_width:
        700,


      canvas_height:
        390,


      stroke_width:
        4,


      stroke_color:
        "#00aa44",


      save_strokes:
        true,


      save_final_image:
        false,


      prompt: `

        <div class="trajectory-instructions">

          <p class="trial-progress">
            Evento ${trialNumber}
            de ${totalTrials}
          </p>


          <p class="event-prompt">
            ${stimulus.prompt}
          </p>


          ${trajectoryInstruction}

        </div>

      `,


      show_finished_button:
        true,


      finished_button_label:
        "Continuar",


      data: {

        ...trialMetadata(
          stimulus,
          stimulusIndex,
          "trajectory"
        ),


        canvas_width:
          700,


        canvas_height:
          390,


        stimulus_image:
          stimulus.image

      }

    });


    // =====================================================
    // 3. CONFIANZA
    // =====================================================

    timeline.push({

      type:
        jsPsychSurveyLikert,


      preamble: `

        <div class="trial-container">

          <p class="trial-progress">

            Evento ${trialNumber}
            de ${totalTrials}

          </p>


          <p>

            ¿Qué tan seguro/a estás
            de la predicción que acabas de hacer?

          </p>

        </div>

      `,


      questions: [

        {

          prompt:
            "Nivel de confianza",


          labels: [

            "1 - Nada seguro/a",

            "2",

            "3",

            "4",

            "5 - Muy seguro/a"

          ],


          required:
            true,


          name:
            "confidence"

        }

      ],


      button_label:

        trialNumber ===
        totalTrials

          ? "Finalizar estudio"

          : "Siguiente evento",


      data:
        trialMetadata(
          stimulus,
          stimulusIndex,
          "confidence"
        ),


      // jsPsych devuelve 0..4.
      // Lo convertimos a 1..5.

      on_finish:
        function (data) {

          const raw =
            data.response
              .confidence;


          if (

            raw !==
              null &&

            raw !==
              undefined

          ) {

            data.confidence_raw_index =
              raw;


            data.confidence_1to5 =
              raw + 1;


            data.response.confidence =
              raw + 1;

          }

        }

    });

  }

);


// =========================================================
// EJECUTAR
// =========================================================

jsPsych.run(
  timeline
);


// =========================================================
// METADATOS POR TRIAL
// =========================================================

function trialMetadata(

  stimulus,
  stimulusIndex,
  phase

) {

  return {

    stimulus_index:
      stimulusIndex,


    stimulus_order:
      stimulusIndex + 1,


    source_id:
      stimulus.source_id,


    clip_id:
      stimulus.clip_id,


    object:
      stimulus.object,


    take:
      stimulus.take,


    clip_number:
      stimulus.clip_number,


    anchor:
      stimulus.anchor,


    phase:
      phase,


    stimulus_image:
      stimulus.image

  };

}


// =========================================================
// RESPUESTAS ESTRUCTURADAS
// =========================================================

function buildStructuredResponses(

  rawTrials,
  stimuli

) {

  return stimuli.map(

    (
      stimulus,
      index
    ) => {


      const matches =
        rawTrials.filter(

          row =>

            row.clip_id ===
            stimulus.clip_id

        );


      const whatTrial =
        matches.find(

          row =>
            row.phase ===
            "what"

        );


      const trajectoryTrial =
        matches.find(

          row =>
            row.phase ===
            "trajectory"

        );


      const confidenceTrial =
        matches.find(

          row =>
            row.phase ===
            "confidence"

        );


      return {

        stimulus_order:
          index + 1,


        source_id:
          stimulus.source_id,


        clip_id:
          stimulus.clip_id,


        object:
          stimulus.object,


        take:
          stimulus.take,


        clip_number:
          stimulus.clip_number,


        anchor:
          stimulus.anchor,


        image:
          stimulus.image,


        // WHAT

        what:

          whatTrial
            ?.response
            ?.what ??

          null,


        what_rt_ms:

          whatTrial
            ?.rt ??

          null,


        // TRAJECTORY

        trajectory_strokes:

          trajectoryTrial
            ?.strokes ??

          null,


        trajectory_rt_ms:

          trajectoryTrial
            ?.rt ??

          null,


        canvas_width:

          trajectoryTrial
            ?.canvas_width ??

          700,


        canvas_height:

          trajectoryTrial
            ?.canvas_height ??

          390,


        // CONFIDENCE

        confidence_1to5:

          confidenceTrial
            ?.confidence_1to5 ??

          confidenceTrial
            ?.response
            ?.confidence ??

          null,


        confidence_rt_ms:

          confidenceTrial
            ?.rt ??

          null

      };

    }

  );

}


// =========================================================
// GUARDAR EN GOOGLE DRIVE
// =========================================================

function saveToDrive(
  payload
) {

  return new Promise(

    function (
      resolve,
      reject
    ) {


      const nonce =
        generateId();


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


      if (

        !iframe ||
        !form ||
        !payloadInput ||
        !nonceInput

      ) {

        reject(

          new Error(
            "No se encontró el formulario de guardado."
          )

        );


        return;

      }


      let finished =
        false;


      let timeoutId =
        null;


      // ---------------------------------------------------
      // Limpiar listener y timer
      // ---------------------------------------------------

      function cleanup() {

        window.removeEventListener(
          "message",
          messageHandler
        );


        if (
          timeoutId !==
          null
        ) {

          clearTimeout(
            timeoutId
          );

        }

      }


      // ---------------------------------------------------
      // RECIBIR CONFIRMACIÓN
      //
      // IMPORTANTE:
      //
      // NO comprobamos:
      //
      // event.source === iframe.contentWindow
      //
      // porque Google Apps Script introduce un iframe
      // sandbox interno.
      //
      // En su lugar verificamos:
      //
      // 1. type
      // 2. nonce único
      //
      // ---------------------------------------------------

      function messageHandler(
        event
      ) {

        const message =
          event.data;


        if (

          !message ||

          message.type !==
            "wm-save-result"

        ) {

          return;

        }


        if (
          message.nonce !==
          nonce
        ) {

          return;

        }


        console.log(
          "ACK recibido desde Apps Script:",
          message
        );


        finished =
          true;


        cleanup();


        if (
          message.ok
        ) {

          resolve(
            message
          );

        }

        else {

          reject(

            new Error(

              message.error ||

              "Error desconocido del servidor."

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
        JSON.stringify(
          payload
        );


      nonceInput.value =
        nonce;


      // ---------------------------------------------------
      // TIMEOUT
      // ---------------------------------------------------

      timeoutId =
        setTimeout(

          function () {


            if (
              finished
            ) {

              return;

            }


            cleanup();


            reject(

              new Error(
                "El servidor no confirmó el guardado en 25 segundos."
              )

            );

          },

          25000

        );


      // ---------------------------------------------------
      // ENVIAR
      // ---------------------------------------------------

      form.submit();

    }

  );

}


// =========================================================
// PANTALLAS DE ESTADO
// =========================================================

function showStatusScreen(
  html
) {

  const jsPsychContent =
    document.querySelector(
      ".jspsych-content-wrapper"
    );


  if (
    jsPsychContent
  ) {

    jsPsychContent.style.display =
      "none";

  }


  const previous =
    document.getElementById(
      "wacv-status-screen"
    );


  if (
    previous
  ) {

    previous.remove();

  }


  const container =
    document.createElement(
      "div"
    );


  container.id =
    "wacv-status-screen";


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
      Guardando respuestas...
    </h2>


    <p>
      Por favor,
      no cierres esta página.
    </p>

  `);

}


// =========================================================
// ÉXITO
// =========================================================

function showSuccessScreen(
  result
) {

  showStatusScreen(`

    <h2>
      ¡Gracias!
    </h2>


    <p>
      Tus respuestas se guardaron correctamente.
    </p>


    <p>
      Por favor, toma una captura de pantalla de esta página
      y envíasela a la persona que te compartió la encuesta
      para confirmar que completaste el estudio.
    </p>


    <p class="small-text">

      ID del participante:
      ${escapeHtml(
        participantId
      )}

    </p>

  `);

}


// =========================================================
// ERROR
// =========================================================

function showErrorScreen(
  payload,
  error
) {

  showStatusScreen(`

    <h2>
      No pudimos confirmar el envío.
    </h2>


    <p>

      Tus respuestas siguen guardadas
      localmente en este navegador.

    </p>


    <p>

      Intenta enviarlas nuevamente.

    </p>


    <button

      id="retry-save"

      class="retry-button"

    >

      Intentar nuevamente

    </button>


    <p class="small-text">

      ${escapeHtml(
        error.message
      )}

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
            "✅ Guardado correctamente después del reintento:",
            result
          );


          localStorage.removeItem(
            BACKUP_KEY
          );


          showSuccessScreen(
            result
          );

        }

        catch (
          secondError
        ) {

          console.error(
            "❌ El reintento falló:",
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
// FUNCIONES AUXILIARES
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
// SHUFFLE
// =========================================================

function fisherYatesShuffle(
  array
) {

  for (

    let i =
      array.length - 1;

    i > 0;

    i--

  ) {

    const j =
      Math.floor(

        Math.random() *
        (
          i + 1
        )

      );


    [
      array[i],
      array[j]
    ] = [
      array[j],
      array[i]
    ];

  }


  return array;

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(
  value
) {

  return String(
    value
  )

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
