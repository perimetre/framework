---
'@perimetre/helpers': major
---

Type the array helpers by their element type: they take `readonly T[]` and return `T[]`, where they took and returned the array type itself. `findNextInArray` and `findPreviousInArray` return `T | undefined`, since an empty array has no element to return. `shiftIndexInArray` returns an unchanged copy when the starting index is outside the array, instead of inserting `undefined`. `stripNullFromObject` keeps function values instead of replacing them with `{}`.
