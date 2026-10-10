import type { Guide } from "../types";
import { betterSleepGuide } from "./better-sleep-guide";
import { cardioKickoff } from "./cardio-kickoff";
import { celebrityTransformations } from "./celebrity-transformations";
import { consistentWorkoutProgress } from "./consistent-workout-progress";
import { fastingForAthletes } from "./fasting-for-athletes";
import { getShredded11Steps } from "./get-shredded-11-steps";
import { metabolicTypes } from "./metabolic-types";
import { sexDriveTips } from "./sex-drive-tips";
import { supplementsStarterGuide } from "./supplements-starter-guide";

/** Evidence-based "trending" guides for Explore, in display order. */
export const ARTICLE_GUIDES: Guide[] = [
  sexDriveTips,
  betterSleepGuide,
  supplementsStarterGuide,
  consistentWorkoutProgress,
  fastingForAthletes,
  cardioKickoff,
  metabolicTypes,
  getShredded11Steps,
  celebrityTransformations,
];
