import { ChatMessageRoleEnum, PerceptionProcessor, indentNicely, useSoulMemory } from "@opensouls/engine"

// This is the default percpetion processor extracted from the soul engine itself.
// if you do not specify a perception processor in your soul, then this is what's used.

function safeName(name?: string) {
  return (name || "").replace(/[^a-zA-Z0-9_-{}]/g, '_').slice(0, 62);
}

const DEFAULT_PREMONITION = "remembered its time to"

const defaultPerceptionProcessor: PerceptionProcessor = async ({ perception, workingMemory, currentProcess }) => {
  const emotionalWords = useSoulMemory("emotionalWords", "neutral")

  const name = perception.name === "Interlocutor" ? "Manager" : perception.name

  const content = perception.internal ?
    `${name} ${perception.premonition || DEFAULT_PREMONITION} ${perception.action} ${perception.content}` :
    `${name} ${perception.action}: ${perception.content}`

  const existingSystem = workingMemory.at(0)

  workingMemory = workingMemory.slice(0,0).concat([
    {
      ...existingSystem,
      content: indentNicely`
        ${existingSystem.content}

        ## Emotions
        ${emotionalWords.current}
      `
    },
    ...workingMemory.slice(1).memories,
    {
      role: perception.internal ? ChatMessageRoleEnum.Assistant : ChatMessageRoleEnum.User,
      content,
      ...(name ? { name: safeName(name) } : {}),
      metadata: {
        ...perception._metadata,
        timestamp: perception._timestamp
      }
    }
  ])

  return [workingMemory, currentProcess]
}

export default defaultPerceptionProcessor
