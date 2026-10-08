import { Agent } from "@/agent/agent"
import { Command } from "@/command"
import * as InstanceState from "@/effect/instance-state"
import { Format } from "@/format"
import { Global } from "@opencode-ai/core/global"
import { LSP } from "@/lsp/lsp"
import { Vcs } from "@/project/vcs"
import { Skill } from "@/skill"
import { Effect } from "effect"
import { spawn } from "node:child_process"
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi"
import { InstanceHttpApi } from "../api"
import { ApiVcsApplyError, ApiVcsOperationError } from "../groups/instance"
import { markInstanceForDisposal } from "../lifecycle"

export const instanceHandlers = HttpApiBuilder.group(InstanceHttpApi, "instance", (handlers) =>
  Effect.gen(function* () {
    const agent = yield* Agent.Service
    const command = yield* Command.Service
    const format = yield* Format.Service
    const lsp = yield* LSP.Service
    const skill = yield* Skill.Service
    const vcs = yield* Vcs.Service

    const dispose = Effect.fn("InstanceHttpApi.dispose")(function* () {
      yield* markInstanceForDisposal(yield* InstanceState.context)
      return true
    })

    const getPath = Effect.fn("InstanceHttpApi.path")(function* () {
      const ctx = yield* InstanceState.context
      return {
        home: Global.Path.home,
        state: Global.Path.state,
        config: Global.Path.config,
        worktree: ctx.worktree,
        directory: ctx.directory,
      }
    })

    const openDirectory = Effect.fn("InstanceHttpApi.openDirectory")(function* () {
      if (process.env.OPENCODE_ALLOW_HOST_OPEN !== "1" && process.env.OPENCODE_ALLOW_RESTART !== "1")
        return yield* new HttpApiError.Forbidden({})
      const ctx = yield* InstanceState.context
      yield* Effect.try({
        try: () => {
          const [command, args] =
            process.platform === "darwin"
              ? ["open", [ctx.directory]]
              : process.platform === "win32"
                ? ["explorer.exe", [ctx.directory]]
                : ["xdg-open", [ctx.directory]]
          const child = spawn(command, args, { detached: true, stdio: "ignore" })
          child.unref()
        },
        catch: () => new HttpApiError.InternalServerError({}),
      })
      return true
    })

    const getVcs = Effect.fn("InstanceHttpApi.vcs")(function* () {
      const [branch, default_branch, repository_url] = yield* Effect.all(
        [vcs.branch(), vcs.defaultBranch(), vcs.repositoryUrl()],
        {
          concurrency: "unbounded",
        },
      )
      return { branch, default_branch, repository_url }
    })

    const getVcsStatus = Effect.fn("InstanceHttpApi.vcsStatus")(function* () {
      return yield* vcs.status()
    })

    const getVcsDiff = Effect.fn("InstanceHttpApi.vcsDiff")(function* (ctx: {
      query: { mode: Vcs.Mode; context?: number }
    }) {
      return yield* vcs.diff(ctx.query.mode, { context: ctx.query.context })
    })

    const getVcsDiffRaw = Effect.fn("InstanceHttpApi.vcsDiffRaw")(function* () {
      return yield* vcs.diffRaw()
    })

    const getVcsBranches = Effect.fn("InstanceHttpApi.vcsBranches")(function* () {
      return yield* vcs.branches()
    })

    const switchVcsBranch = Effect.fn("InstanceHttpApi.vcsSwitchBranch")(function* (ctx: {
      payload: Vcs.SwitchBranchInput
    }) {
      return yield* vcs.switchBranch(ctx.payload).pipe(Effect.mapError(mapVcsOperationError))
    })

    const applyVcs = Effect.fn("InstanceHttpApi.vcsApply")(function* (ctx: { payload: Vcs.ApplyInput }) {
      return yield* vcs.apply(ctx.payload).pipe(
        Effect.mapError(
          (error) =>
            new ApiVcsApplyError({
              name: "VcsApplyError",
              data: {
                message: error.message,
                reason: error.reason,
              },
            }),
        ),
      )
    })

    const mapVcsOperationError = (error: Vcs.OperationError) =>
      new ApiVcsOperationError({
        name: "VcsOperationError",
        data: {
          message: error.message,
          reason: error.reason,
        },
      })

    const stageVcs = Effect.fn("InstanceHttpApi.vcsStage")(function* (ctx: { payload: Vcs.FilesInput }) {
      return yield* vcs.stage(ctx.payload).pipe(Effect.mapError(mapVcsOperationError))
    })

    const unstageVcs = Effect.fn("InstanceHttpApi.vcsUnstage")(function* (ctx: { payload: Vcs.FilesInput }) {
      return yield* vcs.unstage(ctx.payload).pipe(Effect.mapError(mapVcsOperationError))
    })

    const commitVcs = Effect.fn("InstanceHttpApi.vcsCommit")(function* (ctx: { payload: Vcs.CommitInput }) {
      return yield* vcs.commit(ctx.payload).pipe(Effect.mapError(mapVcsOperationError))
    })

    const getCommand = Effect.fn("InstanceHttpApi.command")(function* () {
      return yield* command.list()
    })

    const getAgent = Effect.fn("InstanceHttpApi.agent")(function* () {
      return yield* agent.list()
    })

    const getSkill = Effect.fn("InstanceHttpApi.skill")(function* () {
      return yield* skill.all()
    })

    const getLsp = Effect.fn("InstanceHttpApi.lsp")(function* () {
      return yield* lsp.status()
    })

    const getFormatter = Effect.fn("InstanceHttpApi.formatter")(function* () {
      return yield* format.status()
    })

    return handlers
      .handle("dispose", dispose)
      .handle("path", getPath)
      .handle("openDirectory", openDirectory)
      .handle("vcs", getVcs)
      .handle("vcsStatus", getVcsStatus)
      .handle("vcsDiff", getVcsDiff)
      .handle("vcsDiffRaw", getVcsDiffRaw)
      .handle("vcsBranches", getVcsBranches)
      .handle("vcsSwitchBranch", switchVcsBranch)
      .handle("vcsApply", applyVcs)
      .handle("vcsStage", stageVcs)
      .handle("vcsUnstage", unstageVcs)
      .handle("vcsCommit", commitVcs)
      .handle("command", getCommand)
      .handle("agent", getAgent)
      .handle("skill", getSkill)
      .handle("lsp", getLsp)
      .handle("formatter", getFormatter)
  }),
)
