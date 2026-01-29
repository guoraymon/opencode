import path from "path"
import os from "os"
import { Global } from "../global"
import { Filesystem } from "../util/filesystem"
import { Config } from "../config/config"
import { Instance } from "../project/instance"
import { Flag } from "@/flag/flag"
import { Log } from "../util/log"
import type { MessageV2 } from "./message-v2"

const log = Log.create({ service: "instruction" })

const FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  "CONTEXT.md", // deprecated
]

// LEARN: 全局配置文件
function globalFiles() {
  // LEARN: 全局配置目录的 AGENTS.MD
  const files = [path.join(Global.Path.config, "AGENTS.md")]
  // LEARN: Home 目录的 CLAUDE.md
  if (!Flag.OPENCODE_DISABLE_CLAUDE_CODE_PROMPT) {
    files.push(path.join(os.homedir(), ".claude", "CLAUDE.md"))
  }
  // LEARN: opencode 配置目录的 AGENTS.md
  if (Flag.OPENCODE_CONFIG_DIR) {
    files.push(path.join(Flag.OPENCODE_CONFIG_DIR, "AGENTS.md"))
  }
  // console.log("[DEBUG] globalFiles:", files)
  // ["/home/raymon/.config/opencode/AGENTS.md", "/home/raymon/.claude/CLAUDE.md"]
  return files
}

async function resolveRelative(instruction: string): Promise<string[]> {
  if (!Flag.OPENCODE_DISABLE_PROJECT_CONFIG) {
    return Filesystem.globUp(instruction, Instance.directory, Instance.worktree).catch(() => [])
  }
  if (!Flag.OPENCODE_CONFIG_DIR) {
    log.warn(
      `Skipping relative instruction "${instruction}" - no OPENCODE_CONFIG_DIR set while project config is disabled`,
    )
    return []
  }
  return Filesystem.globUp(instruction, Flag.OPENCODE_CONFIG_DIR, Flag.OPENCODE_CONFIG_DIR).catch(() => [])
}

export namespace InstructionPrompt {
  export async function systemPaths() {
    const config = await Config.get()
    const paths = new Set<string>()

    // NOTE: 项目配置文件
    if (!Flag.OPENCODE_DISABLE_PROJECT_CONFIG) {
      // LEARN: 向上递归查找到工作目录，命中即退出（找到 AGENTS.md 就不会再找 CLAUDE.md，但是AGENTS.md 可能会有多个）
      for (const file of FILES) {
        const matches = await Filesystem.findUp(file, Instance.directory, Instance.worktree)
        if (matches.length > 0) {
          matches.forEach((p) => paths.add(path.resolve(p)))
          break
        }
      }
    }

    // NOTE: 全局配置文件
    for (const file of globalFiles()) {
      if (await Bun.file(file).exists()) {
        paths.add(path.resolve(file))
        break
      }
    }

    // NOTE: 用户配置文件
    if (config.instructions) {
      for (let instruction of config.instructions) {
        if (instruction.startsWith("https://") || instruction.startsWith("http://")) continue
        if (instruction.startsWith("~/")) {
          instruction = path.join(os.homedir(), instruction.slice(2))
        }
        const matches = path.isAbsolute(instruction)
          ? await Array.fromAsync(
              new Bun.Glob(path.basename(instruction)).scan({
                cwd: path.dirname(instruction),
                absolute: true,
                onlyFiles: true,
              }),
            ).catch(() => [])
          : await resolveRelative(instruction)
        matches.forEach((p) => paths.add(path.resolve(p)))
      }
    }

    return paths
  }

  export async function system() {
    const config = await Config.get()
    const paths = await systemPaths()
    // Set(2) {"/home/raymon/workspace/oss/opencode/packages/opencode/AGENTS.md"," "/home/raymon/workspace/oss/opencode/AGENTS.md"}
    // console.log(paths);

    const files = Array.from(paths).map(async (p) => {
      const content = await Bun.file(p)
        .text()
        .catch(() => "")
      return content ? "Instructions from: " + p + "\n" + content : ""
    })

    // NOTE: 用户配置的远程指令文件
    const urls: string[] = []
    if (config.instructions) {
      for (const instruction of config.instructions) {
        if (instruction.startsWith("https://") || instruction.startsWith("http://")) {
          urls.push(instruction)
        }
      }
    }
    const fetches = urls.map((url) =>
      fetch(url, { signal: AbortSignal.timeout(5000) })
        .then((res) => (res.ok ? res.text() : ""))
        .catch(() => "")
        .then((x) => (x ? "Instructions from: " + url + "\n" + x : "")),
    )

    return Promise.all([...files, ...fetches]).then((result) => result.filter(Boolean))
  }

  export function loaded(messages: MessageV2.WithParts[]) {
    const paths = new Set<string>()
    for (const msg of messages) {
      for (const part of msg.parts) {
        if (part.type === "tool" && part.tool === "read" && part.state.status === "completed") {
          if (part.state.time.compacted) continue
          const loaded = part.state.metadata?.loaded
          if (!loaded || !Array.isArray(loaded)) continue
          for (const p of loaded) {
            if (typeof p === "string") paths.add(p)
          }
        }
      }
    }
    return paths
  }

  export async function find(dir: string) {
    for (const file of FILES) {
      const filepath = path.resolve(path.join(dir, file))
      if (await Bun.file(filepath).exists()) return filepath
    }
  }

  export async function resolve(messages: MessageV2.WithParts[], filepath: string) {
    const system = await systemPaths()
    const already = loaded(messages)
    const results: { filepath: string; content: string }[] = []

    let current = path.dirname(path.resolve(filepath))
    const root = path.resolve(Instance.directory)

    while (current.startsWith(root)) {
      const found = await find(current)
      if (found && !system.has(found) && !already.has(found)) {
        const content = await Bun.file(found)
          .text()
          .catch(() => undefined)
        if (content) {
          results.push({ filepath: found, content: "Instructions from: " + found + "\n" + content })
        }
      }
      if (current === root) break
      current = path.dirname(current)
    }

    return results
  }
}
