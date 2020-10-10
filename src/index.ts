import fs from 'fs'
import nodePath from 'path'
import findUp from 'find-up'

interface ClassParts {
	classBase: string
	mediaQuery: string | false
}

export default class TWClassesSorter {
	public static readConfig(path?: string) {
		let config = null

		if (path === undefined) {
			path = findUp.sync('tailwind.config.js')
			if (!path) {
				throw new Error('could not find tailwind.config.js')
			}

			try {
				config = require(path)
			} catch (err) {
				config = null
			}
			if (config == null) {
				for (let i = 0; i < 16; ++i) {
					path = nodePath.join(path, '..', '..', 'tailwind.config.js')
					try {
						config = require(path)
					} catch (err) {
						config = null
					}
					if (path === '/tailwind.config.js') {
						break
					}
				}
			}
			if (config == null) {
				throw new Error('could not find tailwind.config.js')
			}
		}

		return require(path)
	}

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
	 * @param config Tailwind config - defaults to reading the nearest tailwind.config.js file
	 * @param nodeModulesDir Path to node_modules directory
	 */
	constructor(config?: any, nodeModulesDir: string = '../../') {
		if (config == undefined) {
			config = TWClassesSorter.readConfig()
		}

		this.defaultConfig = require(nodePath.join(
			nodeModulesDir,
			'tailwindcss/stubs/defaultConfig.stub.js'
		))
		this.processPlugins = require(nodePath.join(
			nodeModulesDir,
			'tailwindcss/lib/util/processPlugins'
		)).default
		this.resolveConfig = require(nodePath.join(
			nodeModulesDir,
			'tailwindcss/lib/util/resolveConfig'
		)).default

		this.tailwindInstallPath = nodePath.join(
			__dirname,
			'..',
			'..',
			'tailwindcss'
		)
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

		this.config = this.resolveConfig([config, this.defaultConfig])
		this.sortedSelectors = this.getAllSelectors()
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
	}

	/**
	 * Returns a class list array from a string of multiple classes.
	 * @param classes String of classes
	 */
	public static classesFromString(classes: string): string[] {
		return classes.split(' ').map(className => className.trim())
	}

	private getAllSelectors(): string[] {
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

	private getSelectors(styles: any[]): string[] {
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
