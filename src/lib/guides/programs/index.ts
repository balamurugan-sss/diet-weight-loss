import type { Guide, ProgramTemplate } from "../types";
import { basicWorkoutsGuide, basicWorkoutsProgram } from "./basic-workouts";
import { calisthenicsGuide, calisthenicsProgram } from "./calisthenics";
import { chairTaiChiGuide, chairTaiChiProgram } from "./chair-tai-chi";
import { militaryConditioningGuide, militaryConditioningProgram } from "./military-conditioning";
import { military21Guide, military21Program } from "./military-21-day";
import { taiChiGuide, taiChiProgram } from "./tai-chi";
import { taiChiChallengeGuide, taiChiChallengeProgram } from "./tai-chi-challenge";
import { taiChiGolfGuide, taiChiGolfProgram } from "./tai-chi-golf";
import { taiChiWalkingGuide, taiChiWalkingProgram } from "./tai-chi-walking";

/** Program guides in display order. */
export const PROGRAM_GUIDES: Guide[] = [
  calisthenicsGuide,
  military21Guide,
  chairTaiChiGuide,
  taiChiGuide,
  taiChiWalkingGuide,
  militaryConditioningGuide,
  taiChiGolfGuide,
  basicWorkoutsGuide,
  taiChiChallengeGuide,
];

/** The followable day-by-day templates behind the guides above (same order). */
export const PROGRAMS: ProgramTemplate[] = [
  calisthenicsProgram,
  military21Program,
  chairTaiChiProgram,
  taiChiProgram,
  taiChiWalkingProgram,
  militaryConditioningProgram,
  taiChiGolfProgram,
  basicWorkoutsProgram,
  taiChiChallengeProgram,
];
