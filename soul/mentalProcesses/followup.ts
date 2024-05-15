
import { MentalProcess, createCognitiveStep, indentNicely, useActions, z } from "@opensouls/engine";
import { BIG_MODEL, FAST_MODEL } from "../lib/models.js";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import mentalQuery from "../cognitiveSteps/mentalQuery.js";
import writeRap from "../mentalProcesses/writeRap.js";

const followup: MentalProcess = async ({ workingMemory }) => {
  const { speak, log } = useActions()

  const [withDialog, stream] = await externalDialog(
    workingMemory,
    indentNicely`
      Rappy just wrote his song and now he's here to discuss it with the interlocutor.
    `,
    { model: BIG_MODEL, stream: true }
  )
  
  speak(stream)

  const [, wantsChange] = await mentalQuery(
    workingMemory,
    indentNicely`
      The interlocutor wants to rewrite or change the song.
    `,
    { model: BIG_MODEL }
  )

  if (wantsChange) {
    return [withDialog, writeRap, { executeNow: true }]
  }

  return withDialog;
}

export default followup
