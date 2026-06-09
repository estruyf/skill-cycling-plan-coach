# ZWO essentials (fallback if no zwo-workout-builder skill is present)

A `.zwo` is a Zwift workout XML. Power is a fraction of FTP, so the rider's device/app FTP drives the absolute watts. Tell the athlete to set their device FTP to the same value the plan used.

Skeleton:

```xml
<workout_file>
  <author>cycling-week-coach</author>
  <name>Sweet spot 2x20</name>
  <description>Localized description with watt targets at the plan FTP.</description>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="600" PowerLow="0.45" PowerHigh="0.75"/>
    <SteadyState Duration="1200" Power="0.90"><textevent timeoffset="0" message="localized cue"/></SteadyState>
    <SteadyState Duration="300" Power="0.50"/>
    <SteadyState Duration="1200" Power="0.90"/>
    <Cooldown Duration="600" PowerLow="0.60" PowerHigh="0.40"/>
  </workout>
</workout_file>
```

Blocks: `Warmup`/`Cooldown` ramp `PowerLow` to `PowerHigh`; `SteadyState` holds `Power`; `IntervalsT` repeats `OnDuration`/`OffDuration` at `OnPower`/`OffPower` with `Repeat`. Durations in seconds, power as a fraction of FTP. `textevent` messages show on screen, write them in the athlete's language. Validate the XML before delivering.
