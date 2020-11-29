[![npm version](https://badge.fury.io/js/tailwind-classes-sorter.svg)](https://badge.fury.io/js/tailwind-classes-sorter)

# Tailwind Classes Sorter

Sort tailwind classes in order of default plugins.

**Go from this:**

```
z-50 z-10 container text-left md:text-center justify-center
```

**To this:**

```
container justify-center text-left z-10 z-50 md:text-center
```

Example usage:

```js
import TWClassesSorter from 'tailwind-classes-sorter'

const twClassesSorter = new TWClassesSorter()

const classes = 'z-50 z-10 container text-left md:text-center justify-center'

const sortedClassList = twClassesSorter.sortClasslist(classes)

console.log(sortedClassList)
// container justify-center text-left z-10 z-50 md:text-center
```

---

## API

**Constructor**

```ts
constructor(opts: {
  /** Tailwind config path or object */
  config?: any | string
  /** Position of component and utility classes */
  classesPosition?: 'components-first' | 'components-last' | 'as-is'
  /** Position of unknown classes */
  unknownClassesPosition?: 'start' | 'end'
  /** Custom path to node_modules */
  nodeModulesPath?: string
}): TWClassesSorter
```

---

**Public Properties**

```ts
pluginsOrder: string[]
classesPosition: 'components-first' | 'components-last' | 'as-is'
unknownClassesPosition: 'start' | 'end'
```

---

**sortClassList**

```ts
/**
 * Sorts an array of classes by Tailwind plugins.
 * @param classes List of classes to sort
 */
sortClasslist(classes: string[] | string): string[]
```

_Example_

```ts
const twClassesSorter = new TWClassesSorter()
twClassesSorter.sortClassList(
	'z-50 z-10 container text-left md:text-center justify-center'
)
// Result: ['container', 'justify-center', 'text-left', 'z-10', z-50', 'md:text-center']
```

---

**setPluginOrder**

```ts
/**
 * Changes the order classes are sorted by using Tailwind's plugins.
 * @param newPluginOrder New plugins order used for sorting classes
 */
public setPluginOrder(
  newPluginOrder: string[] | ((defaultOrder: string[]) => string[])
): void
```

_Example_

```ts
const twClassesSorter = new TWClassesSorter()
twClassesSorter.setPluginsOrder(defaultPlugins => [
	'position',
	'inset',
	...defaultPlugins,
])
```

---

**setConfig**

```ts
/**
 * Changes the tailwind config.
 * @param config New config path or object (or null to try to find tailwind.config.js)
 */
public setConfig(config?: string | any): void
```

---

**classesFromString**

```ts
/**
 * Returns a class list array from a string of multiple classes.
 * @param classes String of classes
 * @static
 */
static classesFromString(classes: string): string[]
```

_Example_

```ts
TWClassesSorter.classesFromString('w-full absolute top-0')
// Result: ['w-full', 'absolute', 'top-0']
```

---

You may be interested in this as a prettier plugin...
https://github.com/Acidic9/prettier-plugin-tailwind-classes-sorter
