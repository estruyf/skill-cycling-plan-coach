# Garmin FIT workout format

Garmin devices use the binary FIT (Flexible and Interoperable Data Transfer) format for structured workouts. Claude cannot emit binary files directly, so the output is a self-contained **Python script** that generates the `.fit` file when executed. The athlete runs the script once and gets a `.fit` file they can drag onto the device or import into Garmin Connect.

## Dependency

```
pip install fit-tool
```

`fit-tool` (https://pypi.org/project/fit-tool/) is the recommended library. It is pure Python, MIT licensed, and supports workout FIT file creation.

## Power targets

Power targets are **absolute watts** (not FTP fractions), computed from the week's FTP at generation time. If the athlete's FTP changes they must regenerate the file. Always embed the FTP value used in the workout name and description.

Use a ±5 W band around the target:
- Target = `round(ftp * fraction)` W
- `low` = target − 5
- `high` = target + 5

For warmup/cooldown ranges use the boundary fractions directly:
- `low` = `round(ftp * low_fraction)`
- `high` = `round(ftp * high_fraction)`

## Script skeleton

```python
#!/usr/bin/env python3
"""Generate sweet-spot-2x20.fit — requires: pip install fit-tool"""

from fit_tool.fit_file_builder import FitFileBuilder
from fit_tool.profile.messages.file_id_message import FileIdMessage
from fit_tool.profile.messages.workout_message import WorkoutMessage
from fit_tool.profile.messages.workout_step_message import WorkoutStepMessage
from fit_tool.profile.profile_type import (
    FileType, Manufacturer, Sport,
    WorkoutStepDuration, WorkoutStepTarget, Intensity,
)

FTP = 245  # W — change this if your FTP changes
OUTPUT = "sweet-spot-2x20.fit"

builder = FitFileBuilder(auto_define=True, min_string_size=50)

# File ID
file_id = FileIdMessage()
file_id.type = FileType.WORKOUT
file_id.manufacturer = Manufacturer.DEVELOPMENT
file_id.product = 0
file_id.time_created = 0
builder.add(file_id)

# Workout header — num_valid_steps must equal the number of WorkoutStepMessages added
wkt = WorkoutMessage()
wkt.sport = Sport.CYCLING
wkt.wkt_name = f"Sweet Spot 2x20 (FTP {FTP}W)"
wkt.num_valid_steps = 5  # warmup + interval1 + recovery + interval2 + cooldown
builder.add(wkt)


def steady(msg_index, intensity, duration_s, low_w, high_w):
    """Single steady-state step."""
    s = WorkoutStepMessage()
    s.message_index = msg_index
    s.intensity = intensity
    s.duration_type = WorkoutStepDuration.TIME
    s.duration_value = duration_s * 1000  # milliseconds
    s.target_type = WorkoutStepTarget.POWER
    s.custom_target_low = low_w
    s.custom_target_high = high_w
    return s


def repeat_block(msg_index, count, on_s, on_lo, on_hi, off_s, off_lo, off_hi):
    """Repeat step + on/off children. Returns a list of messages."""
    steps = []
    # The repeat container step
    r = WorkoutStepMessage()
    r.message_index = msg_index
    r.intensity = Intensity.ACTIVE
    r.duration_type = WorkoutStepDuration.REPEAT_UNTIL_STEPS_CMPLT
    r.duration_value = msg_index + 2  # index of last child step
    r.target_type = WorkoutStepTarget.OPEN
    steps.append(r)
    # On step
    on = WorkoutStepMessage()
    on.message_index = msg_index + 1
    on.intensity = Intensity.ACTIVE
    on.duration_type = WorkoutStepDuration.TIME
    on.duration_value = on_s * 1000
    on.target_type = WorkoutStepTarget.POWER
    on.custom_target_low = on_lo
    on.custom_target_high = on_hi
    steps.append(on)
    # Off / recovery step
    off = WorkoutStepMessage()
    off.message_index = msg_index + 2
    off.intensity = Intensity.RECOVERY
    off.duration_type = WorkoutStepDuration.TIME
    off.duration_value = off_s * 1000
    off.target_type = WorkoutStepTarget.POWER
    off.custom_target_low = off_lo
    off.custom_target_high = off_hi
    steps.append(off)
    return steps


# ── Sweet spot 2×20 steps ──────────────────────────────────────────────────
# Warmup 10 min ramp 45→75 % FTP
builder.add(steady(0, Intensity.WARMUP, 600,
                   round(FTP * 0.45), round(FTP * 0.75)))

# Interval 1: 20 min @ 90 % FTP
builder.add(steady(1, Intensity.ACTIVE, 1200,
                   round(FTP * 0.90) - 5, round(FTP * 0.90) + 5))

# Recovery 5 min @ 50 % FTP
builder.add(steady(2, Intensity.RECOVERY, 300,
                   round(FTP * 0.50) - 5, round(FTP * 0.50) + 5))

# Interval 2: 20 min @ 90 % FTP
builder.add(steady(3, Intensity.ACTIVE, 1200,
                   round(FTP * 0.90) - 5, round(FTP * 0.90) + 5))

# Cooldown 10 min ramp 60→40 % FTP
builder.add(steady(4, Intensity.COOLDOWN, 600,
                   round(FTP * 0.40), round(FTP * 0.60)))

fit_file = builder.build()
fit_file.to_file(OUTPUT)
print(f"Saved {OUTPUT}")
```

## Skeleton – IntervalsT equivalent (VO2max 5×4)

For repeat blocks use `REPEAT_UNTIL_STEPS_CMPLT` with `duration_value` set to the **message index of the last child step**. The repeat step itself counts as one of the `num_valid_steps`.

```python
# num_valid_steps = 2 (warmup, repeat-block=1 step, cooldown) + repeat children counted internally
# For 5×4 min ON / 4 min OFF: repeat at index 1, on at index 2, off at index 3

wkt.num_valid_steps = 3  # warmup(0) + repeat(1) + cooldown(4) — children not counted here
# NOTE: num_valid_steps counts only top-level steps; the repeat block's children are implicit.

# Warmup
builder.add(steady(0, Intensity.WARMUP, 900,
                   round(FTP * 0.45), round(FTP * 0.75)))

# Repeat 5× — container at index 1, children at 2 and 3
r = WorkoutStepMessage()
r.message_index = 1
r.intensity = Intensity.ACTIVE
r.duration_type = WorkoutStepDuration.REPEAT_UNTIL_STEPS_CMPLT
r.duration_value = 3       # index of last child step
r.target_type = WorkoutStepTarget.OPEN
r.number_of_times_to_repeat = 5  # some builds expose this field; otherwise encode in duration_value
builder.add(r)

# On: 4 min @ 115 % FTP
builder.add(steady(2, Intensity.ACTIVE, 240,
                   round(FTP * 1.15) - 5, round(FTP * 1.15) + 5))

# Off: 4 min @ 50 % FTP
builder.add(steady(3, Intensity.RECOVERY, 240,
                   round(FTP * 0.50) - 5, round(FTP * 0.50) + 5))

# Cooldown
builder.add(steady(4, Intensity.COOLDOWN, 600,
                   round(FTP * 0.40), round(FTP * 0.55)))
```

> **Note on `num_valid_steps`:** The FIT spec counts only top-level steps. Pass the count of non-child steps (warmup + repeat-container + cooldown). The children inside the repeat are referenced by index and not counted in the header total.

## Two-set pattern (no nested repeats)

FIT does not support nested repeat blocks. Use two sibling repeat steps with a recovery step between them — the same workaround as the ZWO two-`IntervalsT` pattern.

## Validation checklist

Before delivering each Python script:

1. `num_valid_steps` in `WorkoutMessage` equals the number of top-level `WorkoutStepMessage` calls (children of a repeat are not counted).
2. `message_index` values are contiguous starting from 0 across all messages added, including children.
3. `duration_value` for `TIME` steps is in **milliseconds** (`seconds * 1000`).
4. `duration_value` for `REPEAT_UNTIL_STEPS_CMPLT` equals the `message_index` of the last child step.
5. All power values are **absolute watts**, not fractions.
6. `FTP` constant at the top of the script is set to the week's FTP.
7. Script is self-contained: `pip install fit-tool` is the only dependency.
8. Script prints the output filename when it succeeds.

## Rendering in Claude

Output each script as a fenced Python code block labeled with the target filename:

````
```python
# sweet-spot-2x20.py  →  produces sweet-spot-2x20.fit
…
```
````

Always add a one-line instruction:

> Run `python sweet-spot-2x20.py` (requires `pip install fit-tool`) — it writes `sweet-spot-2x20.fit` in the current directory. Import it into Garmin Connect or copy it to your device's `GARMIN/NEWFILES/` folder.
