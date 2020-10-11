import fs from 'fs'
import nodePath from 'path'
import findUp from 'find-up'

interface ClassParts {
	classBase: string
	mediaQuery: string | false
}

interface Options {
	/** Tailwind config */
	config?: any
	/** Position of component and utility classes */
	classesPosition?: TWClassesSorter['classesPosition']
	/** Position of unknown classes */
	unknownClassesPosition?: TWClassesSorter['unknownClassesPosition']
	/** Custom path to node_modules */
	nodeModulesPath?: string
}

export default class TWClassesSorter {
	public static readConfig(path?: string) {
		if (path === undefined) {
			path = findUp.sync('tailwind.config.js', {
				cwd: __dirname,
			})
			if (!path) {
				throw new Error('could not find tailwind.config.js')
			}
		}

		return require(path)
	}

	public classesPosition: 'components-first' | 'components-last' | 'as-is'
	public unknownClassesPosition: 'start' | 'end'
	private currentPluginsOrder: string[]
	private defaultPluginsOrder: string[]
	private sortedSelectors: string[]
	private sortedMediaQueries = ['sm', 'md', 'lg', 'xl']
	private config: any
	private defaultConfig: any
	private processPlugins: processPlugins
	private resolveConfig: any
	private tailwindInstallPath: string
	private tailwindPluginsPath: string

	/**
	 * Creates an instance of TWClassesSorter.
	 */
	constructor(opts: Options = {}) {
		if (opts.config == undefined) {
			opts.config = TWClassesSorter.readConfig()
		}

		this.classesPosition = opts.classesPosition || 'components-first'
		this.unknownClassesPosition = opts.unknownClassesPosition || 'start'

		if (!opts.nodeModulesPath) {
			opts.nodeModulesPath = nodePath.resolve(process.cwd(), 'node_modules')
		}

		this.tailwindInstallPath = nodePath.join(
			opts.nodeModulesPath,
			'tailwindcss'
		)

		this.defaultConfig = require(nodePath.join(
			this.tailwindInstallPath,
			'stubs/defaultConfig.stub.js'
		))
		this.processPlugins = require(nodePath.join(
			this.tailwindInstallPath,
			'lib/util/processPlugins'
		)).default
		this.resolveConfig = require(nodePath.join(
			this.tailwindInstallPath,
			'lib/util/resolveConfig'
		)).default

		this.tailwindPluginsPath = nodePath.join(
			this.tailwindInstallPath,
			'lib',
			'plugins'
		)

		this.defaultPluginsOrder = fs
			.readdirSync(this.tailwindPluginsPath)
			.filter(fileName => fileName.indexOf('.') !== -1)
			.map(fileName => fileName.split('.')[0])
			.sort()
		this.currentPluginsOrder = this.defaultPluginsOrder

		this.config = this.resolveConfig([opts.config, this.defaultConfig])
		this.sortedSelectors = this.getAllSelectors()
	}

	public get pluginsOrder() {
		return this.currentPluginsOrder.slice()
	}

	/**
	 * Sorts an array of classes by Tailwind plugins.
	 * @param classes List of classes to sort
	 */
	public sortClasslist(classes: string[] | string): string[] {
		const classesArray =
			typeof classes === 'string'
				? TWClassesSorter.classesFromString(classes)
				: classes.slice()

		return classesArray.sort((a, b) => {
			const aParts = this.getClassParts(a)
			const bParts = this.getClassParts(b)

			const aClassBaseIndex = this.sortedSelectors.indexOf(aParts.classBase)
			const bClassBaseIndex = this.sortedSelectors.indexOf(bParts.classBase)

			const aHasMediaQuery =
				Boolean(aParts.mediaQuery) &&
				this.sortedMediaQueries.indexOf(String(aParts.mediaQuery)) !== -1
			const bHasMediaQuery =
				Boolean(bParts.mediaQuery) &&
				this.sortedMediaQueries.indexOf(String(bParts.mediaQuery)) !== -1

			const aMediaQueryIndex = this.sortedMediaQueries.indexOf(
				String(aParts.mediaQuery)
			)
			const bMediaQueryIndex = this.sortedMediaQueries.indexOf(
				String(bParts.mediaQuery)
			)

			// A or B have unknown selector
			if (aClassBaseIndex !== -1 && bClassBaseIndex === -1) {
				// B has unknown class
				return this.unknownClassesPosition === 'start' ? 1 : -1
			}
			if (aClassBaseIndex === -1 && bClassBaseIndex !== -1) {
				// A has unknown class
				return this.unknownClassesPosition === 'start' ? -1 : 1
			}

			// Sort by media query
			if (!aHasMediaQuery && bHasMediaQuery) {
				return -1
			}
			if (aHasMediaQuery && !bHasMediaQuery) {
				return 1
			}

			// Both or none have MQ at this point
			if (aHasMediaQuery && bHasMediaQuery) {
				if (aMediaQueryIndex < bMediaQueryIndex) {
					return -1
				}
				if (
					this.sortedMediaQueries.indexOf(String(aParts.mediaQuery)) >
					this.sortedMediaQueries.indexOf(String(bParts.mediaQuery))
				) {
					return 1
				}
			}

			// Sort based on sorted selector
			if (aClassBaseIndex !== -1 && bClassBaseIndex !== -1) {
				if (aClassBaseIndex < bClassBaseIndex) {
					return -1
				}
				if (aClassBaseIndex > bClassBaseIndex) {
					return 1
				}
			}

			return 0
		})
	}

	/**
	 * Changes the order classes are sorted by using Tailwind's plugins.
	 * @param newPluginOrder New plugins order used for sorting classes
	 */
	public setPluginOrder(
		newPluginOrder: string[] | ((defaultOrder: string[]) => string[])
	) {
		if (Array.isArray(newPluginOrder)) {
			this.currentPluginsOrder = newPluginOrder
		} else {
			this.currentPluginsOrder = newPluginOrder(
				this.defaultPluginsOrder.slice()
			)
		}
		this.sortedSelectors = this.getAllSelectors()
	}

	/**
	 * Returns a class list array from a string of multiple classes.
	 * @param classes String of classes
	 */
	public static classesFromString(classes: string): string[] {
		return classes
			.split(' ')
			.map(className => className.trim())
			.filter(Boolean)
	}

	private getAllSelectors(): string[] {
		const allSelectors: string[] = []
		const allComponentSelectors: string[] = []
		const allUtilitySelectors: string[] = []

		this.currentPluginsOrder.forEach(pluginName => {
			const filename = nodePath.join(
				this.tailwindPluginsPath,
				`${pluginName}.js`
			)
			const pluginModule = require(filename)
			const pluginDefault =
				typeof pluginModule === 'function'
					? pluginModule()
					: pluginModule.default()

			const { components, utilities } = this.processPlugins(
				[pluginDefault],
				this.config
			)

			const componentSelectors = this.getSelectors(components)
			const utilitiySelectors = this.getSelectors(utilities)

			switch (this.classesPosition) {
				case 'as-is':
					allSelectors.push(
						...[...componentSelectors, ...utilitiySelectors].sort()
					)
					break

				case 'components-first':
				case 'components-last':
					allComponentSelectors.push(...componentSelectors)
					allUtilitySelectors.push(...utilitiySelectors)
					break
			}
		})

		switch (this.classesPosition) {
			case 'as-is':
				return allSelectors

			case 'components-first':
				return [...allComponentSelectors, ...allUtilitySelectors]

			case 'components-last':
				return [...allUtilitySelectors, ...allComponentSelectors]
		}
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

	private getSelectors(styles: any[]): string[] {
		return [
			...new Set(
				styles
					.reduce<string[]>((acc, style) => {
						const selectors = this.loopObjectForSelectors(style)
						acc.push(...selectors)
						return acc
					}, [])
					.sort()
			),
		]
	}
}
