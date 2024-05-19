
import { ChatMessageRoleEnum, MentalProcess, WorkingMemory, createCognitiveStep, indentNicely, useActions, useBlueprintStore, useSoulMemory, z } from "@opensouls/engine";
import instruction from "../cognitiveSteps/instruction.js";
import brainstorm from "../cognitiveSteps/brainstorm.js";
import { BIG_MODEL, FAST_MODEL } from "../lib/models.js";
import followup from "./followup.js";
import writingMachine, { writeMusic } from "../cognitiveFunctions/writingMachine.js";



const writeRap: MentalProcess<{ firstGoal: string }> = async ({ workingMemory, params: { firstGoal } }) => {
  const { speak, log } = useActions()
  const currentMusicGoal = useSoulMemory("currentMusicGoal", firstGoal)
  // const { set, fetch, search } = useBlueprintStore("memorySystem");

  const withMusic = await writingMachine({ workingMemory, goal: currentMusicGoal.current })

  log('after writing')
  return withMusic
}

export default writeRap
