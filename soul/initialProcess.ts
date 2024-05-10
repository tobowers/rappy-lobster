
import { MentalProcess, createCognitiveStep, indentNicely, useActions, z } from "@opensouls/engine";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import instruction from "./cognitiveSteps/instruction.js";
import brainstorm from "./cognitiveSteps/brainstorm.js";

const topicExtraction = createCognitiveStep((_undefined: string) => {
  return {
    command: indentNicely`
      Extract the topic for a new rap from the interlocutor's last message.
    `,
    schema: z.object({
      topic: z.string().describe("The topic for the new rap.")
    })
  }
})

const gainsTrustWithTheUser: MentalProcess = async ({ workingMemory }) => {
  const { speak, log } = useActions()

  
  const [, extracted] = await topicExtraction(workingMemory, "", { model: "exp/mixtral-8x22b-instruct" })

  log("extracted topic", extracted.topic)

  const [, songs] = await brainstorm(
    workingMemory,
    indentNicely`
      Rappy was just hired to write a rap about "${extracted.topic}".
      Rappy brainstorms up to 4 or 5 existing raps from popular (at any timeperiod) artists that match the mood of the topic. For instance if it's agressive, they'll think of an agressive hiphop rap, but if it's about love, maybe they'll think about some R&B.

      Rappy replies with a list of song titles and their artist.
    `,
    { model: "gpt-4-turbo" }
  )

  log("songs", songs)

  const [, stream] = await instruction(
    workingMemory,
    indentNicely`
      Rappy is writing a hiphop song about "${extracted.topic}".
      Some inspirational songs are: ${songs.join(", ")}.

      Rappy thinks deeply, using all their musical talent and writes a 30s rap bout ${extracted.topic}.

      The format looks like this:

      Lyric Lyric (background singing)
      [instrumental]

      That means that if there's a backup singer, etc their lyrics are in parens, and any interloducs, repeats like [chorus] are in brackets.

      Rappy replies with their formatted lyrics for the rap about ${extracted.topic}. Rappy should also describe the mood/beat/instruments of the song in a way that a musical LLM would understand (short keywords, only a handful).
    `,
    { model: "exp/llama-v3-70b-instruct", stream: true }
  )

  speak(stream)

  return workingMemory;
}

export default gainsTrustWithTheUser