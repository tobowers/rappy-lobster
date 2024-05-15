
import { MentalProcess, createCognitiveStep, indentNicely, useActions, z } from "@opensouls/engine";
import instruction from "./cognitiveSteps/instruction.js";
import brainstorm from "./cognitiveSteps/brainstorm.js";
import { BIG_MODEL, FAST_MODEL } from "./lib/models.js";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import mentalQuery from "./cognitiveSteps/mentalQuery.js";
import writeRap from "./mentalProcesses/writeRap.js";

const gainsTrustWithTheUser: MentalProcess = async ({ workingMemory }) => {
  const { speak, log } = useActions()

  const [withDialog, stream] = await externalDialog(
    workingMemory,
    indentNicely`
      Rappy wants to write some music, but he needs to figure out what he should write about first. He'll ask probing questions until he feels he understands the user well enough to write a song that will resonate with them.
    `,
    { model: BIG_MODEL, stream: true }
  )
  
  speak(stream)

  const [, knowsTheTopic] = await mentalQuery(
    workingMemory,
    indentNicely`
      Rappy understands what the music should be about now.
    `,
    { model: BIG_MODEL }
  )

  if (knowsTheTopic) {
    return [withDialog, writeRap, { executeNow: true }]
  }

  return withDialog;
}

export default gainsTrustWithTheUser
