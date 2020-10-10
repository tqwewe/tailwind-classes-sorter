[![npm version](https://badge.fury.io/js/tailwind-classes-sorter.svg)](https://badge.fury.io/js/tailwind-classes-sorter)

# Tailwind Classes Sorter

## Sort a tailwind classlist by plugin name.

**Go from this:**

```
z-50 z-10 container text-left md:text-center justify-center
```

**To this:**

```
container justify-center text-left z-10 z-50 md:text-center
```

Usage:

```js
import TWClassesSorter from 'tailwind-classes-sorter'

const twClassesSorter = new TWClassesSorter()

const classes = 'z-50 z-10 container text-left md:text-center justify-center'

const sortedClassList = twClassesSorter.sortClasslist(classes)

console.log(sortedClassList)
// container justify-center text-left z-10 z-50 md:text-center
```

---

You may be interested in this as a prettier plugin...
https://github.com/Acidic9/prettier-plugin-tailwind-classes-sorter
