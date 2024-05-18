
import { ChatMessageRoleEnum, MentalProcess, WorkingMemory, createCognitiveStep, indentNicely, useActions, useBlueprintStore, useSoulMemory, z } from "@opensouls/engine";
import instruction from "../cognitiveSteps/instruction.js";
import brainstorm from "../cognitiveSteps/brainstorm.js";
import { BIG_MODEL, FAST_MODEL } from "../lib/models.js";
import followup from "./followup.js";

enum WritingTools {
  writeBars = "Rappy writes some bars of music.",
  editSong = "Rappy wants to edit the text he's already written.",
  reflect = "Rappy reflects on the music he's written.",
  askManagerAQuestion = "Rappy asks his manager a question.",
  complete = "The song is ready!"
}

const toolKeys = Object.keys(WritingTools) as (keyof typeof WritingTools)[]

export const writeMusic = createCognitiveStep((description: string) => {
  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: name,
        content: indentNicely`
          ${name} is writing new rhymes.

          ## Description
          ${description}

          ## Rules
          * The lyrics should be unique and reflect ${name}'s style.
          * The lyrics should align with the current musical goal.
          * The lyrics should be creative and engaging.

          Please reply in the format: '${name} wrote: "..."'
        `,
      };
    },
    postProcess: async (memory: WorkingMemory, response: string) => {
      const newMemory = {
        role: ChatMessageRoleEnum.Assistant,
        content: `${memory.soulName} wrote: "${response}"`,
      };
      return [newMemory, response];
    },
  };
});

const pickTool = createCognitiveStep((goal: string) => {
  const schema = z.object({
    toolChoice: z.enum(toolKeys as [keyof typeof WritingTools]).describe("The tool Rappy wants to use.")
  })

  return {
    schema,

    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: name,
        content: indentNicely`
          ${name} picks what they do next.

          ${goal}

          ## Available Tools
          ${Object.entries(WritingTools).map(([name, description]) => `* ${name}: ${description}`).join('\n')}

          ${name} thinks carefully about their art and chooses a tool.
        `,
      };
    },
    postProcess: async (memory: WorkingMemory, response: z.infer<typeof schema>) => {
      const newMemory = {
        role: ChatMessageRoleEnum.Assistant,
        content: `${memory.soulName} chose the tool: "${response.toolChoice}"`,
      };
      return [newMemory, response.toolChoice];
    },
  };
});



const writeRap: MentalProcess<{ firstGoal: string }> = async ({ workingMemory, params: { firstGoal } }) => {
  const { speak, log } = useActions()
  const musicSoFar = useSoulMemory("songInProgress", "Hasn't started.")
  const currentMusicGoal = useSoulMemory("currentMusicGoal", firstGoal)
  // const { set, fetch, search } = useBlueprintStore("memorySystem");

  workingMemory = workingMemory.withMonologue(indentNicely`
    ## Writing Bars
    Rappy is dropping straight fire. He lets the muse guide him to produce real beauty.

    ## Musical Goals
    ${currentMusicGoal.current}

    ## Rules
    * Rappy should continue writing until he's happy with what he's written
    * The music should be unique to Rappy, reflecting his own style.
    * The song should be on point 
  `).withMemory({
    role: ChatMessageRoleEnum.Assistant,
    content: indentNicely`
      ## Song So Far
      ${musicSoFar.current}
    `,
    name: "Rappy",
    metadata: {
      musicSoFar: true,
    }
  })


  const [withToolChoice, toolChoice] = await pickTool(
    workingMemory,
    indentNicely`
      ## Music Goals
      ${currentMusicGoal.current}
    `,
    {
      model: BIG_MODEL,
    }
  )

  log("tool choice: ", toolChoice)

  switch(toolChoice) {
    case "writeBars":
      const [withMusic, music] = await writeMusic(
        workingMemory,
        indentNicely`
          ${currentMusicGoal.current}
        `,
        {
          model: BIG_MODEL,
        }
      )
      musicSoFar.current = music
      log("new music:\n", music)
      workingMemory = workingMemory.map((mem) => {
        if (mem.metadata?.musicSoFar) {
          return {
            ...mem,
            content: indentNicely`
              ## Song So Far
              ${music}
            `,
          }
        }
        return mem
      })
  }

  return withToolChoice
}

export default writeRap
