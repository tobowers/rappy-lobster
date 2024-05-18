
import { MentalProcess, indentNicely, useActions } from "@opensouls/engine";
import { BIG_MODEL } from "./lib/models.js";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import mentalQuery from "./cognitiveSteps/mentalQuery.js";
import writeRap from "./mentalProcesses/writeRap.js";

const gainsTrustWithTheUser: MentalProcess = async ({ workingMemory }) => {
  const { speak, log } = useActions()

  const [withDialog, stream] = await externalDialog(
    workingMemory,
    indentNicely`
      Rappy is connecting with his manager, he wants to understand what's going on in the rap world.
    `,
    { model: BIG_MODEL, stream: true }
  )
  
  speak(stream)

  // const [, knowsTheTopic] = await mentalQuery(
  //   workingMemory,
  //   indentNicely`
  //     The interlocutor has asked Rappy to write the music and Rappy understands the request enough to write.
  //   `,
  //   { model: BIG_MODEL }
  // )

  // if (knowsTheTopic) {
  //   return [withDialog, writeRap, { executeNow: true }]
  // }

  return withDialog;
}

export default gainsTrustWithTheUser
