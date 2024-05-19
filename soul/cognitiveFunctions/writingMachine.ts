
import { ChatMessageRoleEnum, MentalProcess, WorkingMemory, createCognitiveStep, indentNicely, stripEntityAndVerb, stripEntityAndVerbFromStream, useActions, useBlueprintStore, useSoulMemory, z } from "@opensouls/engine";
import { BIG_MODEL, FAST_MODEL } from "../lib/models.js";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import internalMonologue from "../cognitiveSteps/internalMonologue.js";
import instruction from "../cognitiveSteps/instruction.js";

enum WritingTools {
  writeBars = "Rappy writes some bars of music.",
  editSong = "Rappy wants to edit the text he's already written.",
  thinkThroughInspirations = "Rappy thinks through the existing zeitgeist of music searching for some styles to emulate.",
  reflect = "Rappy reflects on the music he's written.",
  askManagerAQuestion = "Rappy asks his manager a question.",
  complete = "The song is ready!"
}
const allTools = Object.keys(WritingTools) as (keyof typeof WritingTools)[]
const toolsWithoutFeflection = Object.keys(WritingTools).filter((name) => (!["reflect", "thinkThroughInspirations"].includes(name))) as (keyof typeof WritingTools)[]

export const writeMusic = createCognitiveStep((description: string) => {
  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: name,
        content: indentNicely`
          ${name} is writing one verse, to continue their in-progress song.

          ## Description
          ${description}

          ## Rules
          * The lyrics should be unique and reflect ${name}'s style.
          * The lyrics should hit hard, say something.
          * The lyrics should match up with the goals of the song.
          * The lyrics should be creative and engaging.
          * The new lyrics should flow naturally from the existing lyrics.

          Please reply in the format: '${name} wrote: "..."'
        `,
      };
    },
    streamProcessor: stripEntityAndVerbFromStream,
    postProcess: async (memory: WorkingMemory, response: string) => {
      const stripped = stripEntityAndVerb(memory.soulName, "wrote", response);
      const newMemory = {
        role: ChatMessageRoleEnum.Assistant,
        content: `${memory.soulName} wrote: "${stripped}"`
      };
      return [newMemory, stripped];
    }
  };
});

export const editMusic = createCognitiveStep((description: string) => {
  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: name,
        content: indentNicely`
          ${name} is editing the music they've written.

          ## Description
          ${description}

          ## Rules
          * The edits should enhance the uniqueness and style of ${name}'s music.
          * The edits should align with the current musical goal.
          * The edits should be creative and improve the overall quality of the music.

          Please reply with ONLY the new music, not any commentary (no yapping).
        `,
      };
    }
  };
});


const pickTool = createCognitiveStep(({ goal, tools }: { goal: string, tools: (keyof typeof WritingTools)[] }) => {
  const schema = z.object({
    toolChoice: z.enum(tools as [keyof typeof WritingTools]).describe("The tool Rappy wants to use.")
  })

  return {
    schema,

    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: name,
        content: indentNicely`
          ${name} picks what they do next. Keep in mind that Rappy really needs to get these tracks out, but he also wants to make sure they reflect who he is. The writing process usually goes like this: write, edit, reflect, and then ask for feedback, edit, complete.

          ${goal}

          ## Available Tools
          ${tools.map((name) => `* ${name}: ${WritingTools[name]}`).join('\n')}

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



const writingMachine = async ({ workingMemory, goal, justReflected = false }: { workingMemory: WorkingMemory, goal: string, justReflected?: boolean }): Promise<WorkingMemory> => {
  const { speak, log } = useActions()
  const musicSoFar = useSoulMemory("songInProgress", "")

  // const { set, fetch, search } = useBlueprintStore("memorySystem");

  const [withReflection, reflection] = await instruction(
    workingMemory,
    indentNicely`
      Rappy is sitting down to drop a new hit.

      ## Musical Goal
      ${goal}

      Rappy thinks through the existing zeitgeist of hiphop, jazz, and R&B musicians. He thinks about 1-3 inspirations for his current track, and then lists them out with some direct lines from each that he finds particularly inspiring. He tries to use obscure artists and references whenever he can.

      Rappy also thinks through a plan and a particular style of song that he wants to create. If he's got specific memories he wants to draw on, he'll think through those as well.

      Respond in 2-6 sentences with the inspirations, style, and memory information.
    `
  )
  log("inspriations", reflection)


  workingMemory = withReflection.withMonologue(indentNicely`
    ## Writing Bars
    Rappy is dropping straight fire. He lets the muse guide him to produce real beauty.

    ## Musical Goals
    ${goal}

    ## Rules
    * Rappy should continue the write / edit / reflect process until he's happy with what he's written
    * The music should be unique to Rappy, reflecting his own style.
    * The song should only be 3 to 4 verses maximum, approximately 45s to 1min of music.
    * Don't start the rap with "yo"
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
    {
      goal: indentNicely`
        ## Music Goals
        ${goal}
      `,
      tools: justReflected ? toolsWithoutFeflection : allTools
    },
    {
      model: BIG_MODEL,
    }
  )

  log("tool choice: ", toolChoice)

  switch (toolChoice) {
    case "writeBars":
      {
        const [, music] = await writeMusic(
          workingMemory,
          indentNicely`
          ${goal}
        `,
          {
            model: BIG_MODEL,
          }
        )
        musicSoFar.current = indentNicely`
          ${musicSoFar.current}

          ${music}
        `
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

        return writingMachine({ workingMemory, goal })
      }
    case "editSong":
      {
        const [, music] = await editMusic(
          workingMemory,
          musicSoFar.current,
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

        return writingMachine({ workingMemory, goal })
      }
    case "askManagerAQuestion":
      {
        const [withDialog, stream] = await externalDialog(
          workingMemory,
          indentNicely`
            Ask your manager a question.
          `,
          { model: BIG_MODEL, stream: true }
        )
        speak(stream)
        return withDialog
      }

    case "reflect":
      {
        const [withReflection, reflection] = await internalMonologue(
          workingMemory,
          indentNicely`
          Rappy reflects on his music so far. Rappy's pretty critical of his own work, he generally always wants to make it better and say something. However, he also values time and doesn't want to spend forever on a single track. After editing a couple of times, he'll normally move on.
        `
        )
        log("monologue", reflection)

        justReflected = true

        return writingMachine({ workingMemory: withReflection, goal, justReflected })
      }
    case "thinkThroughInspirations":
      const [withReflection, reflection] = await internalMonologue(
        workingMemory,
        indentNicely`
          Rappy thinks through completely *new* inspirations that he hasn't thought of yet. These could be paintings, sculptures, movies, books, or other music. He thinks about how these inspirations could influence this particular song. He responds in 1-2 sentences about the NEW inspiration that he hasn't thought of yet.
        `
      )
      log("inspriations", reflection)
      justReflected = true
      return writingMachine({ workingMemory: withReflection, goal, justReflected })
    case "complete":
      log("rappy is done")
      const [withTitleAndStyle, titleAndStyle] = await internalMonologue(
        workingMemory,
        indentNicely`
          Rappy is going to use a music generating AI to create the music he just wrote. He needs to give the AI a title and a style for the music. The title should be 1-3 words and the style should be a short list of keywords that describe the mood and genre of music. Rappy should feel free to combine musical styles and genres to make the song unique, but they should all be hard hitting hip hop.
        `
      )
      log("title and style", titleAndStyle)
      return withTitleAndStyle.withMonologue("Rappy is happy with his work!")
  }
}

export default writingMachine
