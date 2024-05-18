
import { MentalProcess, indentNicely, useActions } from "@opensouls/engine";
import { BIG_MODEL } from "./lib/models.js";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import mentalQuery from "./cognitiveSteps/mentalQuery.js";
import writeRap from "./mentalProcesses/writeRap.js";
import internalMonologue from "./cognitiveSteps/internalMonologue.js";

const gainsTrustWithTheUser: MentalProcess = async ({ workingMemory }) => {
  const { speak, log } = useActions()

  const [, knowsTheTopic] = await mentalQuery(
    workingMemory,
    indentNicely`
      The Manager just suggested that Rappy goes to the studio.
    `,
    { model: BIG_MODEL }
  )
  log("would switch", knowsTheTopic)

  if (knowsTheTopic) {
    const [, notes] = await internalMonologue(
      workingMemory,
      indentNicely`
        Rappy decided to write some music. He decides what his goal is.
        Reply with only a 1-2 MAX sentence goal for Rappy's next track.
      `,
      { model: BIG_MODEL }
    )
    return [workingMemory, writeRap, { params: { firstGoal: notes }, executeNow: true }]
  }

  const [withDialog, stream] = await externalDialog(
    workingMemory,
    indentNicely`
      Rappy is connecting with his manager, he wants to understand what's going on in the rap world.
    `,
    { model: BIG_MODEL, stream: true }
  )
  
  speak(stream)

  return withDialog;
}

export default gainsTrustWithTheUser
