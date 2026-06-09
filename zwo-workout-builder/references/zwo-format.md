# .zwo (Zwift workout) format reference

`.zwo` is XML. A workout is a list of ordered blocks inside `<workout>`. Power is always a **decimal fraction of FTP** (1.0 = FTP). Durations are **seconds**. Zwift applies the rider's own FTP on import, so the file is portable across FTP values.

## File skeleton

```xml
<workout_file>
  <author>Author name</author>
  <name>Workout name shown in Zwift</name>
  <description>Free text. Put intent + per-effort targets here.</description>
  <sportType>bike</sportType>        <!-- bike or run -->
  <tags>
    <tag name="vo2max"/>
    <tag name="intervals"/>
  </tags>
  <workout>
    <!-- ordered blocks here -->
  </workout>
</workout_file>
```

## Block elements

| Element | Required attributes | Notes |
|---|---|---|
| `<Warmup>` | `Duration`, `PowerLow`, `PowerHigh` | Ramps power from Low to High. |
| `<Cooldown>` | `Duration`, `PowerLow`, `PowerHigh` | Ramps down (set PowerLow high, PowerHigh low). |
| `<Ramp>` | `Duration`, `PowerLow`, `PowerHigh` | Linear ramp anywhere in the workout. |
| `<SteadyState>` | `Duration`, `Power` | Constant effort. |
| `<IntervalsT>` | `Repeat`, `OnDuration`, `OffDuration`, `OnPower`, `OffPower` | The repeat block. One element = N reps. |
| `<FreeRide>` | `Duration` | No target (optional `FlatRoad="1"`). Good for openers/group-ride placeholders. |
| `<MaxEffort>` | `Duration` | All-out, no power target. |

### Optional attributes on most blocks

- `Cadence="95"` — target cadence (rpm).
- `CadenceLow` / `CadenceHigh` — cadence range.
- `CadenceResting` — cadence on the `Off` portion of `IntervalsT`.
- `pace="0"` — for run workouts only.

### On-screen messages

`<textevent>` is a **child** of a block. `timeoffset` is seconds from the start of that block.

```xml
<SteadyState Duration="1200" Power="0.90">
  <textevent timeoffset="0" message="Sweet spot - settle in"/>
  <textevent timeoffset="600" message="Halfway - relax shoulders"/>
</SteadyState>
```

## Power zone cheat sheet (fraction of FTP)

- Recovery: 0.40–0.55
- Endurance / Z2: 0.60–0.70
- Tempo: 0.76–0.87
- Sweet spot: 0.88–0.94
- Threshold: 0.95–1.05
- VO2max: 1.06–1.20
- Anaerobic / surges: 1.20–1.50+

## Worked examples

### 40/20s (3 sets of 9)

```xml
<workout_file>
  <author>Claude (for Elio)</author>
  <name>40-20s 3x9</name>
  <description>3 sets of 9 x (40s @ 120% / 20s @ 50%), 5 min easy between sets. Race-specific surge tolerance.</description>
  <sportType>bike</sportType>
  <tags><tag name="anaerobic"/><tag name="intervals"/></tags>
  <workout>
    <Warmup Duration="600" PowerLow="0.45" PowerHigh="0.80"/>
    <SteadyState Duration="60" Power="1.00"/>
    <SteadyState Duration="120" Power="0.50"/>
    <IntervalsT Repeat="9" OnDuration="40" OffDuration="20" OnPower="1.20" OffPower="0.50"/>
    <SteadyState Duration="300" Power="0.50"/>
    <IntervalsT Repeat="9" OnDuration="40" OffDuration="20" OnPower="1.20" OffPower="0.50"/>
    <SteadyState Duration="300" Power="0.50"/>
    <IntervalsT Repeat="9" OnDuration="40" OffDuration="20" OnPower="1.20" OffPower="0.50"/>
    <Cooldown Duration="600" PowerLow="0.65" PowerHigh="0.40"/>
  </workout>
</workout_file>
```

### Over-unders (3 x 4 min blocks)

```xml
<workout_file>
  <author>Claude (for Elio)</author>
  <name>Over-Unders 3x</name>
  <description>3 x (3 min @ 95% / 1 min @ 105%), 5 min easy between. Trains pace variability for the bunch.</description>
  <sportType>bike</sportType>
  <tags><tag name="threshold"/></tags>
  <workout>
    <Warmup Duration="600" PowerLow="0.45" PowerHigh="0.80"/>
    <SteadyState Duration="180" Power="0.95"/>
    <SteadyState Duration="60" Power="1.05"/>
    <SteadyState Duration="300" Power="0.50"/>
    <SteadyState Duration="180" Power="0.95"/>
    <SteadyState Duration="60" Power="1.05"/>
    <SteadyState Duration="300" Power="0.50"/>
    <SteadyState Duration="180" Power="0.95"/>
    <SteadyState Duration="60" Power="1.05"/>
    <Cooldown Duration="600" PowerLow="0.65" PowerHigh="0.40"/>
  </workout>
</workout_file>
```

### Sweet spot (2 x 20)

```xml
<workout_file>
  <author>Claude (for Elio)</author>
  <name>Sweet Spot 2x20</name>
  <description>2 x 20 min @ 90% FTP, 5 min easy between. Sustained power with manageable fatigue.</description>
  <sportType>bike</sportType>
  <tags><tag name="sweetspot"/></tags>
  <workout>
    <Warmup Duration="600" PowerLow="0.45" PowerHigh="0.80"/>
    <SteadyState Duration="1200" Power="0.90">
      <textevent timeoffset="0" message="Block 1 - settle in"/>
    </SteadyState>
    <SteadyState Duration="300" Power="0.50"/>
    <SteadyState Duration="1200" Power="0.90">
      <textevent timeoffset="0" message="Block 2 - hold form"/>
    </SteadyState>
    <Cooldown Duration="600" PowerLow="0.65" PowerHigh="0.40"/>
  </workout>
</workout_file>
```

## Validation

Before delivering, confirm the XML parses (well-formed tags, quoted attributes). A quick check:

```bash
python3 -c "import xml.dom.minidom,sys; xml.dom.minidom.parse(sys.argv[1]); print('OK')" path/to/file.zwo
```
