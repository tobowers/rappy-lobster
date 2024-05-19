
import { MentalProcess, indentNicely, useActions } from "@opensouls/engine";
import { BIG_MODEL } from "./lib/models.js";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import mentalQuery from "./cognitiveSteps/mentalQuery.js";
import writeRap from "./mentalProcesses/writeRap.js";
import internalMonologue from "./cognitiveSteps/internalMonologue.js";
import instruction from "./cognitiveSteps/instruction.js";

const initialProcess: MentalProcess = async ({ workingMemory }) => {
  const { speak, log } = useActions()

  const [, knowsTheTopic] = await instruction(
    workingMemory,
    indentNicely`
      ## Manager's Last Messge
      ${workingMemory.slice(-1).at(0).content}

      If the manager has indicated (just now) that it's time to go to the studio then reply with only the word "YES" otherwise reply with only the word "NO"
    `,
    { model: BIG_MODEL }
  )
  log("would switch", knowsTheTopic)

  if (knowsTheTopic === "YES") {
    const [, notes] = await internalMonologue(
      workingMemory,
      indentNicely`
        Rappy decided to write some music. He decides what his goal is.
        Reply with only a 1-2 MAX sentence goal for Rappy's next track.
      `,
      { model: BIG_MODEL }
    )
    log("goal: ", notes)
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

export default initialProcess
