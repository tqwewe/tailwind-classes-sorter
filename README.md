# Tailwind Classes Sorter

Usage:

```js
import TWClassesSorter from 'tailwind-classes-sorter'

const twClassesSorter = new TWClassesSorter()

const classes = 'z-50 z-10 container text-left md:text-center justify-center'
const classList = classes.split(' ')

const sortedClassList = twClassesSorter.sortClasslist(classList)
console.log(sortedClassList)
```
