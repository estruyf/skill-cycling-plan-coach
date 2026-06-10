# ZWO essentials (integrated in this skill)

A `.zwo` is a Zwift workout XML. Power is a fraction of FTP so the rider's device/app FTP drives the absolute watts. Tell the athlete to set their device FTP to the same value the plan used.

## Blocks

| Block | Use | Key attributes |
|-------|-----|----------------|
| `Warmup` | Ramp up | `Duration` (s), `PowerLow` (start), `PowerHigh` (end) — fractions |
| `Cooldown` | Ramp down | `Duration` (s), `PowerHigh` (start), `PowerLow` (end) — fractions |
| `SteadyState` | Fixed power | `Duration` (s), `Power` (fraction) |
| `IntervalsT` | Repeated on/off | `Repeat`, `OnDuration` (s), `OffDuration` (s), `OnPower`, `OffPower` (fractions) |
| `FreeRide` | No target (group/social) | `Duration` (s) |

All durations are in seconds. Power values are fractions of FTP (e.g. `0.90` = 90%). Add `<textevent timeoffset="N" message="..."/>` inside any block; write cues in the athlete's language.

## Skeleton – SteadyState (sweet spot example)

```xml
<workout_file>
  <author>cycling-plan-coach</author>
  <name>Sweet spot 2x20</name>
  <description>2 × 20 min at 90% FTP, 5 min easy between. Set your device FTP to match the plan.</description>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="600" PowerLow="0.45" PowerHigh="0.75">
      <textevent timeoffset="0" message="Warm up gradually, easy spin."/>
    </Warmup>
    <SteadyState Duration="1200" Power="0.90">
      <textevent timeoffset="0" message="Sweet spot — steady, controlled effort."/>
      <textevent timeoffset="600" message="Halfway. Hold the power, smooth pedalling."/>
    </SteadyState>
    <SteadyState Duration="300" Power="0.50">
      <textevent timeoffset="0" message="Easy recovery — shake out the legs."/>
    </SteadyState>
    <SteadyState Duration="1200" Power="0.90">
      <textevent timeoffset="0" message="Second interval. Same effort as the first."/>
      <textevent timeoffset="600" message="Last 10 min. Stay smooth."/>
    </SteadyState>
    <Cooldown Duration="600" PowerLow="0.40" PowerHigh="0.60">
      <textevent timeoffset="0" message="Cool down — easy spin out."/>
    </Cooldown>
  </workout>
</workout_file>
```

## Skeleton – IntervalsT (VO2max 5×4 example)

```xml
<workout_file>
  <author>cycling-plan-coach</author>
  <name>VO2max 5x4</name>
  <description>5 × 4 min at 115% FTP, 4 min easy between. High cadence 95+ rpm. Set your device FTP to match the plan.</description>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="900" PowerLow="0.45" PowerHigh="0.75">
      <textevent timeoffset="0" message="Warm up — build pace gradually."/>
      <textevent timeoffset="600" message="2 min to first interval. Lift cadence to 95+ rpm."/>
    </Warmup>
    <IntervalsT Repeat="5" OnDuration="240" OffDuration="240" OnPower="1.15" OffPower="0.50">
      <textevent timeoffset="0" message="Go — high cadence, push through."/>
      <textevent timeoffset="120" message="Halfway. Hold it."/>
      <textevent timeoffset="240" message="Recover — breathe out, easy spin."/>
    </IntervalsT>
    <Cooldown Duration="600" PowerLow="0.40" PowerHigh="0.55">
      <textevent timeoffset="0" message="Well done. Cool down easy."/>
    </Cooldown>
  </workout>
</workout_file>
```

## Skeleton – IntervalsT (40/20s example, 2 sets of 9 reps)

Two sets with a rest block between them — `IntervalsT` cannot nest, so use two `IntervalsT` blocks separated by a `SteadyState` recovery.

```xml
<workout_file>
  <author>cycling-plan-coach</author>
  <name>40-20s 2x9</name>
  <description>2 sets of 9 × (40 s at 120% FTP / 20 s easy), 5 min easy between sets. Set your device FTP to match the plan.</description>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="900" PowerLow="0.45" PowerHigh="0.75">
      <textevent timeoffset="0" message="Warm up — include 3–4 short accelerations in the last 3 min."/>
    </Warmup>
    <IntervalsT Repeat="9" OnDuration="40" OffDuration="20" OnPower="1.20" OffPower="0.50">
      <textevent timeoffset="0" message="Set 1 — punch it."/>
      <textevent timeoffset="40" message="Off — recover fast."/>
    </IntervalsT>
    <SteadyState Duration="300" Power="0.50">
      <textevent timeoffset="0" message="5 min easy between sets. Get ready."/>
    </SteadyState>
    <IntervalsT Repeat="9" OnDuration="40" OffDuration="20" OnPower="1.20" OffPower="0.50">
      <textevent timeoffset="0" message="Set 2 — same power, stay on it."/>
      <textevent timeoffset="40" message="Off."/>
    </IntervalsT>
    <Cooldown Duration="600" PowerLow="0.40" PowerHigh="0.55">
      <textevent timeoffset="0" message="Done. Easy spin out."/>
    </Cooldown>
  </workout>
</workout_file>
```

## Skeleton – IntervalsT (Over-unders 3×(3 min/1 min) example)

The under (95% FTP) is the longer "on" phase; the over (105% FTP) is the shorter "off" phase. `IntervalsT` always starts with the "on" duration, so the cycle is: 3 min under → 1 min over. This Step 1 skeleton runs ≈ 37 min including warmup/cooldown; later progression steps add sets and typically run 50–60 min. For sets with 5 min rest between them, use separate `IntervalsT` blocks separated by a `SteadyState` at 0.50 (same pattern as the 40/20s example above).

````
```xml
<!-- over-unders-3x3-1.zwo -->
<workout_file>
  <author>cycling-plan-coach</author>
  <name>Over-unders 3x(3/1)</name>
  <description>3 × (3 min at 95% FTP / 1 min at 105% FTP). Set your device FTP to match the plan.</description>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="900" PowerLow="0.45" PowerHigh="0.75">
      <textevent timeoffset="0" message="Warm up gradually."/>
      <textevent timeoffset="720" message="3 min to first interval."/>
    </Warmup>
    <IntervalsT Repeat="3" OnDuration="180" OffDuration="60" OnPower="0.95" OffPower="1.05">
      <textevent timeoffset="0" message="Under — 95%, hold the pace."/>
      <textevent timeoffset="180" message="Over — push to 105%, absorb the surge."/>
    </IntervalsT>
    <Cooldown Duration="600" PowerLow="0.40" PowerHigh="0.60">
      <textevent timeoffset="0" message="Done. Easy spin out."/>
    </Cooldown>
  </workout>
</workout_file>
```
````

## Skeleton – SteadyState (Threshold 2×15 example)

2 × 15 min @ 97% FTP with 5 min recovery, total ≈ 60 min. Adjust `Power` to match the progression step (0.95 for Step 1, 0.97 for Step 2–3) and `Duration` to 1200 s for the 20 min variant.

```xml
<workout_file>
  <author>cycling-plan-coach</author>
  <name>Threshold 2x15</name>
  <description>2 × 15 min at 97% FTP, 5 min easy between. Set your device FTP to match the plan.</description>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="900" PowerLow="0.45" PowerHigh="0.75">
      <textevent timeoffset="0" message="Warm up — build gradually."/>
      <textevent timeoffset="720" message="3 min to first interval. Settle in."/>
    </Warmup>
    <SteadyState Duration="900" Power="0.97">
      <textevent timeoffset="0" message="Threshold — controlled, sustainable effort."/>
      <textevent timeoffset="450" message="Halfway. Hold the power."/>
    </SteadyState>
    <SteadyState Duration="300" Power="0.50">
      <textevent timeoffset="0" message="Easy recovery — breathe out."/>
    </SteadyState>
    <SteadyState Duration="900" Power="0.97">
      <textevent timeoffset="0" message="Second interval. Same effort."/>
      <textevent timeoffset="450" message="Last 7 min. Hang on."/>
    </SteadyState>
    <Cooldown Duration="600" PowerLow="0.40" PowerHigh="0.60">
      <textevent timeoffset="0" message="Well done. Easy spin out."/>
    </Cooldown>
  </workout>
</workout_file>
```

## Skeleton – SteadyState (Endurance Z2 example)

Adjust `SteadyState Duration` to scale session length; the warmup, spin-ups, and cooldown account for ~19 min, so set SteadyState to ~4200 s for a 90 min session. The neuromuscular spin-ups are optional; omit the `IntervalsT` block for pure Z2 sessions.

````
```xml
<!-- endurance-z2-60min.zwo -->
<workout_file>
  <author>cycling-plan-coach</author>
  <name>Endurance Z2 60min</name>
  <description>60 min easy at 65% FTP with optional neuromuscular spin-ups. Set your device FTP to match the plan.</description>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="600" PowerLow="0.45" PowerHigh="0.65">
      <textevent timeoffset="0" message="Easy warm up."/>
    </Warmup>
    <SteadyState Duration="2700" Power="0.65">
      <textevent timeoffset="0" message="Zone 2 — conversational pace. Stay easy."/>
      <textevent timeoffset="1350" message="Halfway. Stay relaxed."/>
    </SteadyState>
    <IntervalsT Repeat="4" OnDuration="10" OffDuration="50" OnPower="1.10" OffPower="0.60">
      <textevent timeoffset="0" message="Spin-up — light gear, max cadence for 10 s."/>
    </IntervalsT>
    <Cooldown Duration="300" PowerLow="0.40" PowerHigh="0.55">
      <textevent timeoffset="0" message="Easy spin down."/>
    </Cooldown>
  </workout>
</workout_file>
```
````

## Validation checklist

Before delivering each `.zwo`:

1. XML is well-formed (every opened tag is closed, no stray characters outside tags).
2. All `Power`, `PowerLow`, `PowerHigh`, `OnPower`, `OffPower` values are fractions (0.0–1.5 range); no raw watts.
3. All `Duration`, `OnDuration`, `OffDuration` values are in seconds (not minutes).
4. `IntervalsT` `Repeat` × (`OnDuration` + `OffDuration`) matches the intended total interval time.
5. Warmup and cooldown are present in every file.
6. `textevent` messages are in the athlete's language.
7. In `Cooldown` blocks, `PowerHigh` is the starting (higher) value and `PowerLow` is the ending (lower) value — it ramps down. In `Warmup` blocks it is the reverse: `PowerLow` starts, `PowerHigh` ends.

## Rendering in Claude

Output every `.zwo` file inline as a fenced XML code block labeled with the filename so the athlete can read, copy, or import it directly from Claude's UI:

````
```xml
<!-- sweet-spot-2x20.zwo -->
<workout_file>
  ...
</workout_file>
```
````
