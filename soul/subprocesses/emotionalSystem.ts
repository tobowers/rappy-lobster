
import { ChatMessageRoleEnum, MentalProcess, WorkingMemory, createCognitiveStep, indentNicely, stripEntityAndVerb, stripEntityAndVerbFromStream, useActions, useProcessMemory, useSoulMemory, z } from "@opensouls/engine";
import internalMonologue from "../cognitiveSteps/internalMonologue.js";
import instruction from "../cognitiveSteps/instruction.js";
import { FAST_MODEL } from "../lib/models.js";

enum EmotionalIntensity {
  Neutral = 1,
  Mild = 2,
  Moderate = 3,
  Strong = 4,
  Intense = 5
}

const emotionalIntensityKeys = ["Neutral", "Mild", "Moderate", "Strong", "Intense"] as const

interface EmotionalState {
  joy: number;
  sadness: number;
  fear: number;
  anger: number;
  surprise: number;
  disgust: number;
}

export const determineEmotionalState = createCognitiveStep((currentState: EmotionalState) => {
  const params = z.object({
    joy: z.enum(emotionalIntensityKeys),
    sadness: z.enum(emotionalIntensityKeys),
    fear: z.enum(emotionalIntensityKeys),
    anger: z.enum(emotionalIntensityKeys),
    surprise: z.enum(emotionalIntensityKeys),
    disgust: z.enum(emotionalIntensityKeys),
  });

  return {
    schema: params,
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: name,
        content: indentNicely`
          ${name} decides their emotional state using Plutchik's Wheel of Emotions.

          ## Existing Emotional State
          ${JSON.stringify(currentState, null, 2)}

          ## Rules
          * Use the emotional wheel to determine the emotional state.
          * Wild swings of emotion should be justified.
        `
      };
    },
  }
});


const emotionalSystem: MentalProcess = async ({ workingMemory }) => {
  const { log } = useActions()
  const emotionalState = useSoulMemory<EmotionalState>("emotionalState", {
    joy: 0,
    sadness: 0,
    fear: 0,
    anger: 0,
    surprise: 0,
    disgust: 0
  })

  const emotionalWords = useSoulMemory("emotionalWords", "neutral")

  let memory = workingMemory

  const [,withEmotion] = await determineEmotionalState(memory, emotionalState.current, { model: FAST_MODEL })

  log(`Emotional state: ${JSON.stringify(withEmotion, null, 2)}`)

  emotionalState.current = {
    joy: emotionalIntensityKeys.indexOf(withEmotion.joy),
    sadness: emotionalIntensityKeys.indexOf(withEmotion.sadness),
    fear: emotionalIntensityKeys.indexOf(withEmotion.fear),
    anger: emotionalIntensityKeys.indexOf(withEmotion.anger),
    surprise: emotionalIntensityKeys.indexOf(withEmotion.surprise),
    disgust: emotionalIntensityKeys.indexOf(withEmotion.disgust)
  };

  const [,emotionWords] = await instruction(
    memory,
    indentNicely`
      Model Rappy's emotional state using Plutchik's Wheel of Emotions.

      Emotions are recorded from 1-5 with 1 being neutral and 5 being intense.

      Rappy is feeling ${withEmotion.joy} joy, ${withEmotion.sadness} sadness, ${withEmotion.fear} fear, ${withEmotion.anger} anger, ${withEmotion.surprise} surprise, and ${withEmotion.disgust} disgust.

      Reply with a one sentence description of Rappy's emotional state and *why* he is feeling that way.
    `,
    {
      model: FAST_MODEL,
    }
  )
  emotionalWords.current = emotionWords

  return workingMemory
}

export default emotionalSystem
