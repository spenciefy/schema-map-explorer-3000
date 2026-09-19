# Mobile performance pass

Workload comparison (not a physical-device FPS benchmark):

| Work | Before | After |
| --- | --- | --- |
| High-density phone render ratio cap | 1.75 | 1.25: 49% fewer pixels at equal CSS size |
| Phone shadow texture | 2048 × 2048 | 1024 × 1024: 75% fewer texels |
| Static shadow rendering | Every frame | On mountain load and layer changes |
| Label projection, sorting, collision and DOM updates | Every frame | When camera, viewport, selection or layer state changes |
| Preview followed by full map | Separate terrain requests and parses | One shared pending request and parsed object |
| Parsed terrain memory | Unbounded full-map cache | Four mountains, least recently used eviction |
| Idle mobile animation | Display refresh rate | Approximately 30 fps; uncapped during gestures, camera transitions and rides |
| Hidden riders, lifts and wildlife | Animation work continues | Hidden objects skip animation updates |
| Mountain construction | All stages in one task | Yields between stages, with stale request cancellation checks |

The terrain resolution and mapped trail geometry are unchanged. In-memory caching is not offline support; reload still requires a network connection. Test on physical iOS and Android devices before claiming a frame-rate or battery improvement. The automated cache checks cover deduplication, eviction, validation and retry after failure.

Next priorities for ski-day use: explicit offline mountain downloads, opt-in device location with accuracy indication, and a quick overhead orientation mode. Live lift status needs an authoritative resort feed; mapped lifts are not evidence of current operation.
