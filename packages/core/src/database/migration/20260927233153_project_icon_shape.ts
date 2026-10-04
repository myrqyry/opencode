import { Effect } from "effect"
import type { DatabaseMigration } from "../migration"

export default {
  id: "20260927233153_project_icon_shape",
  up(tx) {
    return Effect.gen(function* () {
      yield* tx.run(`ALTER TABLE \`project\` ADD \`icon_shape\` text;`)
    })
  },
} satisfies DatabaseMigration.Migration
