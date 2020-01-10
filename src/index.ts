import path from 'path'
import processPlugins from 'tailwindcss/lib/util/processPlugins'

import getSelectors from './utils/getSelectors'

const config = require(path.join(__dirname, '..', 'tailwind.config.js'))

// const allBaseSelectors: string[] = []

main()

function main() {
	const pluginsOrder = [
		'alignContent',
		'alignItems',
		'alignSelf',
		'appearance',
		'backgroundAttachment',
		'backgroundColor',
		'backgroundPosition',
		'backgroundRepeat',
		'backgroundSize',
		'borderCollapse',
		'borderColor',
		'borderRadius',
		'borderStyle',
		'borderWidth',
		'boxShadow',
		'container',
		'cursor',
		'display',
		'fill',
		'flex',
		'flexDirection',
		'flexGrow',
		'flexShrink',
		'flexWrap',
		'float',
		'fontFamily',
		'fontSize',
		'fontSmoothing',
		'fontStyle',
		'fontWeight',
		'height',
		'inset',
		'justifyContent',
		'letterSpacing',
		'lineHeight',
		'listStylePosition',
		'listStyleType',
		'margin',
		'maxHeight',
		'maxWidth',
		'minHeight',
		'minWidth',
		'objectFit',
		'objectPosition',
		'opacity',
		'order',
		'outline',
		'overflow',
		'padding',
		'pointerEvents',
		'position',
		'preflight',
		'resize',
		'stroke',
		'tableLayout',
		'textAlign',
		'textColor',
		'textDecoration',
		'textTransform',
		'userSelect',
		'verticalAlign',
		'visibility',
		'whitespace',
		'width',
		'wordBreak',
		'zIndex',
	]

	const tailwindInstallPath = path.join(
		__dirname,
		'..',
		'node_modules',
		'tailwindcss'
	)
	const tailwindPluginsPath = path.join(tailwindInstallPath, 'lib', 'plugins')

	const sortedSelectors = getAllSelectors(pluginsOrder, tailwindPluginsPath)
	const sortedMediaQueries = ['sm', 'md', 'lg', 'xl']

	const classListsToSort = [
		'z-50 z-10 container text-left md:text-center justify-center',
	]

	classListsToSort
		.map(className => className.split(' ').map(cn => cn.trim()))
		.forEach(classList =>
			console.log(sortClasslist(sortedSelectors, sortedMediaQueries, classList))
		)
}

function getAllSelectors(pluginsOrder: string[], tailwindPluginsPath: string) {
	const allComponentSelectors: string[] = []
	const allUtilitySelectors: string[] = []

	pluginsOrder.forEach(pluginName => {
		const filename = path.join(tailwindPluginsPath, `${pluginName}.js`)
		const pluginModule = require(filename)
		const pluginDefault =
			typeof pluginModule === 'function'
				? pluginModule()
				: pluginModule.default()
		// console.log(filename)
		// console.log(pluginDefault)

		const classes = []
		const addClasses = (obj: object) => classes.push(...Object.keys(obj))
		const { base, components, utilities } = processPlugins(
			[pluginDefault],
			config
		)

		// const baseSelectors = getSelectors(base)
		const componentSelectors = getSelectors(components)
		const utilitiySelectors = getSelectors(utilities)

		// allBaseSelectors.push(...baseSelectors)
		allComponentSelectors.push(...componentSelectors)
		allUtilitySelectors.push(...utilitiySelectors)
	})

	const allSelectors = [
		// ...allBaseSelectors,
		...allComponentSelectors,
		...allUtilitySelectors,
	]

	return allSelectors
}

interface ClassParts {
	classBase: string
	mediaQuery: string | false
}
function getClassParts(className: string): ClassParts {
	if (className.indexOf(':') === -1) {
		return {
			classBase: className,
			mediaQuery: false,
		}
	}

	const parts = className.split(':')
	if (parts.length === 1) {
		return {
			classBase: parts[0],
			mediaQuery: false,
		}
	}

	return {
		classBase: parts[1],
		mediaQuery: parts[0],
	}
}

function sortClasslist(
	sortedSelectors: string[],
	sortedMediaQueries: string[],
	classes: string[]
): string[] {
	return classes.sort((a, b) => {
		const aParts = getClassParts(a)
		const bParts = getClassParts(b)

		const aHasMediaQuery =
			Boolean(aParts.mediaQuery) &&
			sortedMediaQueries.indexOf(String(aParts.mediaQuery)) !== -1
		const bHasMediaQuery =
			Boolean(bParts.mediaQuery) &&
			sortedMediaQueries.indexOf(String(bParts.mediaQuery)) !== -1

		if (!aHasMediaQuery && bHasMediaQuery) {
			return -1
		}
		if (aHasMediaQuery && !bHasMediaQuery) {
			return 1
		}

		if (
			sortedMediaQueries.indexOf(String(aParts.mediaQuery)) <
			sortedMediaQueries.indexOf(String(bParts.mediaQuery))
		) {
			return -1
		}
		if (
			sortedMediaQueries.indexOf(String(aParts.mediaQuery)) >
			sortedMediaQueries.indexOf(String(bParts.mediaQuery))
		) {
			return 1
		}

		if (
			sortedSelectors.indexOf(aParts.classBase) <
			sortedSelectors.indexOf(bParts.classBase)
		) {
			return -1
		}
		if (
			sortedSelectors.indexOf(aParts.classBase) >
			sortedSelectors.indexOf(bParts.classBase)
		) {
			return 1
		}

		return 0
	})
}
