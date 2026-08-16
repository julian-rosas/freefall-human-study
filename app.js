const jsPsych = initJsPsych({
  on_finish: function() {
    jsPsych.data.displayData("json");
  }
});

const timeline = [];

// -----------------------
// INTRO
// -----------------------

timeline.push({
  type: jsPsychHtmlButtonResponse,

  stimulus: `
    <h2>Physical Foresight Study</h2>

    <p>
      You will see the final observed moment
      of a physical event.
    </p>

    <p>
      Predict what you expect the object to do next.
    </p>
  `,

  choices: ["Start"]
});


// -----------------------
// WHAT
// -----------------------

timeline.push({

  type: jsPsychSurveyText,

  preamble: `
    <p>
      <strong>
      The person releases the object at the end
      of the observed context.
      </strong>
    </p>

    <img
      class="stimulus-image"
      src="stimuli/pilot_release.png"
    >
  `,

  questions: [
    {
      prompt:
        "What do you expect the object to do " +
        "immediately after this moment?",

      placeholder:
        "Answer in one short sentence.",

      required: true,

      name: "what"
    }
  ],

  data: {
    clip_id: "pilot_release",
    anchor: "release",
    phase: "what"
  }
});


// -----------------------
// WHERE
// -----------------------

timeline.push({

  type: jsPsychSketchpad,

  background_image:
    "stimuli/pilot_release.png",

  canvas_width: 700,
  canvas_height: 390,

  stroke_width: 4,

  save_strokes: true,

  save_final_image: false,

  prompt: `
    <p>
      <strong>
      Starting at the marked point,
      draw one continuous line showing
      the path you expect the CENTER
      of the object to follow.
      </strong>
    </p>
  `,

  data: {
    clip_id: "pilot_release",
    anchor: "release",
    phase: "trajectory"
  }
});


// -----------------------
// CONFIDENCE
// -----------------------

timeline.push({

  type: jsPsychSurveyLikert,

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

      required: true,

      name: "confidence"
    }
  ],

  data: {
    clip_id: "pilot_release",
    anchor: "release",
    phase: "confidence"
  }
});


jsPsych.run(timeline);
