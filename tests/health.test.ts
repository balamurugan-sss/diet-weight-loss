import { describe, expect, it } from "vitest";
import { analyseDay } from "@/lib/health/analysis";
import { createAppleHealthParser } from "@/lib/health/apple";
import { createFitbitParser, fitbitDate } from "@/lib/health/fitbit";
import { dailyRollUpBody, listFilter, localDate, parseDailyRollUp, parseExercise, parseSleep } from "@/lib/health/google";

const APPLE = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_IN">
 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" startDate="2026-10-01 08:00:00 +0530" endDate="2026-10-01 08:10:00 +0530" value="1200"/>
 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" startDate="2026-10-01 18:00:00 +0530" endDate="2026-10-01 18:30:00 +0530" value="3000"/>
 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="Apple Watch" unit="count" startDate="2026-10-01 08:00:00 +0530" endDate="2026-10-01 08:10:00 +0530" value="1100"/>
 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" startDate="2026-06-01 08:00:00 +0530" endDate="2026-06-01 08:10:00 +0530" value="999"/>
 <Record type="HKQuantityTypeIdentifierRestingHeartRate" sourceName="Apple Watch" unit="count/min" startDate="2026-10-01 00:00:00 +0530" endDate="2026-10-01 23:59:00 +0530" value="62"/>
 <Record type="HKQuantityTypeIdentifierAppleExerciseTime" sourceName="Apple Watch" unit="min" startDate="2026-10-01 18:00:00 +0530" endDate="2026-10-01 18:01:00 +0530" value="25"/>
 <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" startDate="2026-09-30 23:30:00 +0530" endDate="2026-10-01 03:30:00 +0530" value="HKCategoryValueSleepAnalysisAsleepCore">
  <MetadataEntry key="HKTimeZone" value="Asia/Kolkata"/>
 </Record>
 <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" startDate="2026-10-01 03:30:00 +0530" endDate="2026-10-01 06:00:00 +0530" value="HKCategoryValueSleepAnalysisAsleepREM"/>
 <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" startDate="2026-10-01 06:00:00 +0530" endDate="2026-10-01 06:20:00 +0530" value="HKCategoryValueSleepAnalysisAwake"/>
 <Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="32.5" durationUnit="min" sourceName="Apple Watch" startDate="2026-10-01 18:00:00 +0530" endDate="2026-10-01 18:32:30 +0530">
  <WorkoutStatistics type="HKQuantityTypeIdentifierActiveEnergyBurned" sum="300" unit="Cal"/>
 </Workout>
 <Workout workoutActivityType="HKWorkoutActivityTypeTraditionalStrengthTraining" duration="40" durationUnit="min" startDate="2026-10-02 18:00:00 +0530" endDate="2026-10-02 18:40:00 +0530"/>
</HealthData>`;

describe("Apple Health export", () => {
  it("parses in arbitrary chunks, dedupes sources, attributes sleep to the wake date", () => {
    const p = createAppleHealthParser("2026-09-01");
    // Split at awkward places, including mid-tag.
    for (let i = 0; i < APPLE.length; i += 37) p.push(APPLE.slice(i, i + 37));
    const { days, workouts } = p.finish();
    const oct1 = days.find((d) => d.date === "2026-10-01")!;
    expect(oct1.steps).toBe(4200); // iPhone 4200 vs Watch 1100 → largest source
    expect(oct1.restingHr).toBe(62);
    expect(oct1.activeMinutes).toBe(25);
    expect(oct1.sleepMinutes).toBe(390); // 4 h + 2.5 h asleep, awake excluded
    expect(days.some((d) => d.date === "2026-06-01")).toBe(false); // before `since`
    expect(workouts).toEqual([{ externalId: "HKWorkoutActivityTypeRunning@2026-10-01 18:00:00 +0530", date: "2026-10-01", activity: "run", intensity: "vigorous", minutes: 33 }]);
  });
});

describe("Fitbit export", () => {
  it("reads Global Export Data JSON files", () => {
    expect(fitbitDate("09/25/26 07:00:00")).toBe("2026-09-25");
    expect(fitbitDate("2026-09-25T07:00:00.000")).toBe("2026-09-25");
    const p = createFitbitParser("2026-09-01");
    p.addJson("Global Export Data/steps-2026-09-25.json", [
      { dateTime: "09/25/26 07:00:00", value: "4000" },
      { dateTime: "09/25/26 18:00:00", value: "3500" },
    ]);
    p.addJson("very_active_minutes-2026-09-25.json", [{ dateTime: "09/25/26 00:00:00", value: "20" }]);
    p.addJson("moderately_active_minutes-2026-09-25.json", [{ dateTime: "09/25/26 00:00:00", value: "15" }]);
    p.addJson("sleep-2026-09-25.json", [
      { dateOfSleep: "2026-09-25", minutesAsleep: 412, isMainSleep: true },
      { dateOfSleep: "2026-09-25", minutesAsleep: 30, isMainSleep: false },
    ]);
    p.addJson("resting_heart_rate-2026-09-25.json", [{ dateTime: "09/25/26 00:00:00", value: { date: "09/25/26", value: 58.7, error: 6 } }]);
    p.addJson("exercise-0.json", [
      { logId: 111, activityName: "Walk", startTime: "09/25/26 18:00:00", activeDuration: 1800000, averageHeartRate: 105 },
      { logId: 112, activityName: "Weights", startTime: "09/25/26 19:00:00", activeDuration: 2400000 },
    ]);
    const { days, workouts } = p.finish();
    expect(days).toEqual([{ date: "2026-09-25", steps: 7500, activeMinutes: 35, restingHr: 59, sleepMinutes: 412 }]);
    expect(workouts).toEqual([{ externalId: "111", date: "2026-09-25", activity: "walk", intensity: "moderate", minutes: 30 }]);
  });

  it("accepts a simple CSV from any tracker", () => {
    const p = createFitbitParser("2026-01-01");
    p.addCsv("date,steps,active_minutes,resting_hr,sleep_minutes\n2026-09-24,9100,42,60,450\n2026-09-25,,10,,");
    expect(p.finish().days).toEqual([
      { date: "2026-09-24", steps: 9100, activeMinutes: 42, restingHr: 60, sleepMinutes: 450 },
      { date: "2026-09-25", steps: null, activeMinutes: 10, restingHr: null, sleepMinutes: null },
    ]);
  });
});

describe("Google Health API mapping", () => {
  it("builds roll-up and list requests", () => {
    expect(dailyRollUpBody("2026-09-19", "2026-09-26")).toEqual({
      range: {
        start: { date: { year: 2026, month: 9, day: 19 }, time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 } },
        end: { date: { year: 2026, month: 9, day: 26 }, time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 } },
      },
      windowSizeDays: 1,
    });
    expect(listFilter("sleep", "2026-09-19", "2026-09-26")).toBe('sleep.interval.civil_end_time >= "2026-09-19" AND sleep.interval.civil_end_time < "2026-09-26"');
  });

  it("parses daily steps roll-ups", () => {
    const body = {
      rollupDataPoints: [
        { civilStartTime: { date: { year: 2026, month: 9, day: 25 }, time: {} }, steps: { countSum: "9525" } },
        { civilStartTime: { date: { year: 2026, month: 9, day: 24 }, time: {} }, steps: { countSum: "6859" } },
      ],
    };
    expect([...parseDailyRollUp(body, "steps")]).toEqual([
      ["2026-09-25", 9525],
      ["2026-09-24", 6859],
    ]);
    expect(parseDailyRollUp({}, "steps").size).toBe(0);
  });

  it("parses main sleep by local wake-up date", () => {
    expect(localDate("2026-09-25T22:30:00Z", "19800s")).toBe("2026-09-26");
    const body = {
      dataPoints: [
        { sleep: { interval: { endTime: "2026-09-26T01:23:00Z", endUtcOffset: "19800s" }, metadata: { mainSleep: true }, summary: { minutesAsleep: "418" } } },
        { sleep: { interval: { endTime: "2026-09-26T09:00:00Z", endUtcOffset: "19800s" }, metadata: { mainSleep: false }, summary: { minutesAsleep: "35" } } },
      ],
    };
    expect([...parseSleep(body)]).toEqual([["2026-09-26", 418]]);
  });

  it("maps exercise sessions to cardio and skips strength", () => {
    const body = {
      dataPoints: [
        {
          name: "users/1/dataTypes/exercise/dataPoints/33",
          exercise: {
            interval: { startTime: "2026-09-25T00:33:29Z", startUtcOffset: "19800s" },
            exerciseType: "RUNNING",
            activeDuration: "1800s",
            metricsSummary: { heartRateZoneDurations: { lightTime: "60s", moderateTime: "300s", vigorousTime: "1200s", peakTime: "0s" } },
          },
        },
        { name: "x", exercise: { interval: { startTime: "2026-09-25T10:00:00Z" }, exerciseType: "WEIGHTLIFTING", activeDuration: "2400s" } },
      ],
    };
    expect(parseExercise(body)).toEqual([{ externalId: "users/1/dataTypes/exercise/dataPoints/33", date: "2026-09-25", activity: "run", intensity: "vigorous", minutes: 30 }]);
  });
});

describe("daily analysis", () => {
  const base = (date: string, over: Partial<{ steps: number; sleepMinutes: number; restingHr: number; activeMinutes: number }> = {}) => ({
    date,
    steps: 8000,
    sleepMinutes: 450,
    restingHr: 60,
    activeMinutes: 20,
    ...over,
  });
  const week = ["2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"].map((d) => base(d));

  it("flags short sleep and raised resting heart rate and suggests recovery", () => {
    const a = analyseDay([...week, base("2026-10-10", { steps: 3200, sleepMinutes: 330, restingHr: 67 })], "2026-10-10");
    expect(a.insights.map((i) => i.id)).toEqual(["steps_low", "sleep_short", "rhr_up"]);
    expect(a.insights[0].vars.minutes).toBe(50); // 4,800 steps ≈ 48 min → rounded to 5
    expect(a.insights[2].vars.diff).toBe(7);
    expect(a.suggestRecovery).toBe(true);
    expect(a.baseline.restingHr).toBe(60);
  });

  it("is positive on a good day and quiet without data", () => {
    const a = analyseDay([...week, base("2026-10-10", { steps: 11000, activeMinutes: 45 })], "2026-10-10");
    expect(a.insights.map((i) => i.tone)).toEqual(["good", "good", "good", "good"]);
    expect(a.suggestRecovery).toBe(false);
    expect(analyseDay([], "2026-10-10").insights).toEqual([]);
  });
});
