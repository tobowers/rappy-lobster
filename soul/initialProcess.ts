
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
      Rappy wants to write some music, but he needs to figure out what he should write about first. He'll ask probing questions until he feels he understands the user well enough to write a song that will resonate with them.
    `,
    { model: BIG_MODEL, stream: true }
  )
  
  speak(stream)

  const [, knowsTheTopic] = await mentalQuery(
    workingMemory,
    indentNicely`
      The interlocutor has asked Rappy to write the music and Rappy understands the request enough to write.
    `,
    { model: BIG_MODEL }
  )

  if (knowsTheTopic) {
    return [withDialog, writeRap, { executeNow: true }]
  }

  return withDialog;
}

export default gainsTrustWithTheUser
