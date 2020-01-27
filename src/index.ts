import fs from 'fs'
import nodePath from 'path'
import process from 'process'
import processPlugins from 'tailwindcss/lib/util/processPlugins'

interface ClassParts {
	classBase: string
	mediaQuery: string | false
}

export default class TWClassesSorter {
	public static readConfig(path?: string) {
		let config = null

		if (path === undefined) {
			path = nodePath.join(process.cwd(), 'tailwind.config.js')
			try {
				config = require(path)
			} catch (err) {
				config = null
			}
			while (config == null) {
				path = nodePath.join(path, '..', '..', 'tailwind.config.js')
				try {
					config = require(path)
				} catch (err) {
					config = null
				}
				if (path === '/') {
					throw new Error('could not find tailwind.config.js')
				}
			}
		}

		return require(path)
	}

	private tailwindInstallPath = nodePath.join(
		__dirname,
		'..',
		'node_modules',
		'tailwindcss'
	)
	private tailwindPluginsPath = nodePath.join(
		this.tailwindInstallPath,
		'lib',
		'plugins'
	)
	private pluginsOrder = fs
		.readdirSync(this.tailwindPluginsPath)
		.filter(fileName => fileName.indexOf('.') !== -1)
		.map(fileName => fileName.split('.')[0])
		.sort()
	private sortedSelectors: string[]
	private sortedMediaQueries = ['sm', 'md', 'lg', 'xl']
	private config: any

	constructor(config?: any) {
		if (config == undefined) {
			config = TWClassesSorter.readConfig()
		}

		this.config = config
		this.sortedSelectors = this.getAllSelectors()
	}

	public sortClasslist(classes: string[]): string[] {
		return classes.sort((a, b) => {
			const aParts = this.getClassParts(a)
			const bParts = this.getClassParts(b)

			const aHasMediaQuery =
				Boolean(aParts.mediaQuery) &&
				this.sortedMediaQueries.indexOf(String(aParts.mediaQuery)) !== -1
			const bHasMediaQuery =
				Boolean(bParts.mediaQuery) &&
				this.sortedMediaQueries.indexOf(String(bParts.mediaQuery)) !== -1

			if (!aHasMediaQuery && bHasMediaQuery) {
				return -1
			}
			if (aHasMediaQuery && !bHasMediaQuery) {
				return 1
			}

			if (
				this.sortedMediaQueries.indexOf(String(aParts.mediaQuery)) <
				this.sortedMediaQueries.indexOf(String(bParts.mediaQuery))
			) {
				return -1
			}
			if (
				this.sortedMediaQueries.indexOf(String(aParts.mediaQuery)) >
				this.sortedMediaQueries.indexOf(String(bParts.mediaQuery))
			) {
				return 1
			}

			if (
				this.sortedSelectors.indexOf(aParts.classBase) <
				this.sortedSelectors.indexOf(bParts.classBase)
			) {
				return -1
			}
			if (
				this.sortedSelectors.indexOf(aParts.classBase) >
				this.sortedSelectors.indexOf(bParts.classBase)
			) {
				return 1
			}

			return 0
		})
	}

	private getAllSelectors() {
		const allComponentSelectors: string[] = []
		const allUtilitySelectors: string[] = []

		this.pluginsOrder.forEach(pluginName => {
			const filename = nodePath.join(
				this.tailwindPluginsPath,
				`${pluginName}.js`
			)
			const pluginModule = require(filename)
			const pluginDefault =
				typeof pluginModule === 'function'
					? pluginModule()
					: pluginModule.default()

			const { components, utilities } = processPlugins(
				[pluginDefault],
				this.config
			)

			const componentSelectors = this.getSelectors(components)
			const utilitiySelectors = this.getSelectors(utilities)

			allComponentSelectors.push(...componentSelectors)
			allUtilitySelectors.push(...utilitiySelectors)
		})

		const allSelectors = [...allComponentSelectors, ...allUtilitySelectors]

		return allSelectors
	}

	private getClassParts(className: string): ClassParts {
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

	private loopObjectForSelectors(obj: any, objRefs: object[] = []): string[] {
		const selectors: string[] = []

		Object.keys(obj).forEach(key => {
			const value: any = obj[key]
			if (key === 'selector') {
				let cleanedValue: string = value.trim()
				if (cleanedValue.startsWith('.')) {
					cleanedValue = cleanedValue.substr(1)
				}
				selectors.push(cleanedValue)
				return
			}

			if (value instanceof Array) {
				value.forEach(item => {
					if (typeof item === 'object') {
						if (objRefs.findIndex(ref => ref === value) === -1) {
							objRefs.push(value)
							selectors.push(...this.loopObjectForSelectors(value, objRefs))
							return
						}
					}
				})
			} else if (typeof value === 'object') {
				if (objRefs.findIndex(ref => ref === value) === -1) {
					objRefs.push(value)
					selectors.push(...this.loopObjectForSelectors(value, objRefs))
					return
				}
			}
		})

		return selectors
	}

	private getSelectors(styles: any[]) {
		return [
			...new Set(
				styles.reduce((acc, style) => {
					const selectors = this.loopObjectForSelectors(style)
					acc.push(...selectors)
					return acc
				}, [])
			),
		] as string[]
	}
}

const twClassesSorter = new TWClassesSorter()
console.log(
	twClassesSorter.sortClasslist(
		'z-50 z-10 container text-left md:text-center justify-center'.split(' ')
	)
)