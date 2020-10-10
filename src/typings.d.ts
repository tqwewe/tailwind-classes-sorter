declare module 'tailwindcss'

interface PluginObject {
	base: any[]
	components: any[]
	utilities: any[]
	variantGenerators: object
}

type processPlugins = (plugins: any[], config: any) => PluginObject
