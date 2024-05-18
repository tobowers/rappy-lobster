
import { ChatMessageRoleEnum, MentalProcess, WorkingMemory, createCognitiveStep, indentNicely, stripEntityAndVerb, stripEntityAndVerbFromStream, useActions, useProcessMemory, useSoulMemory, z } from "@opensouls/engine";

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

  let memory = workingMemory

  const [,withEmotion] = await determineEmotionalState(memory, emotionalState.current)

  log(`Emotional state: ${JSON.stringify(withEmotion, null, 2)}`)

  emotionalState.current = {
    joy: emotionalIntensityKeys.indexOf(withEmotion.joy),
    sadness: emotionalIntensityKeys.indexOf(withEmotion.sadness),
    fear: emotionalIntensityKeys.indexOf(withEmotion.fear),
    anger: emotionalIntensityKeys.indexOf(withEmotion.anger),
    surprise: emotionalIntensityKeys.indexOf(withEmotion.surprise),
    disgust: emotionalIntensityKeys.indexOf(withEmotion.disgust)
  };

  return workingMemory
}

export default emotionalSystem
